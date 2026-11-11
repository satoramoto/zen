// Every faked command on the stage is this script, linked under the
// command's name. It hands its arguments and input to the session's broker,
// prints what the fixture answers and exits with its code. With no broker it
// fails rather than reach for the real command.
import net from 'node:net';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [name, ...argv] = process.argv.slice(2);
const broker = process.env.OMARCHY_STAGE_BROKER;

function fail(message, code = 70) {
  process.stderr.write(`${name}: ${message}\n`);
  process.exit(code);
}

if (!broker) fail('no Omarchy stage broker');

// Input, when there is any: a closed stdin ends at once; an open one that
// stays silent for 150 ms is taken as what the call says, since a fixture
// answers arguments. A program the fixture passes through gets the rest live.
let stdinEnded = false;
function readInput() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) { stdinEnded = true; return resolve(''); }
    let data = '';
    let timer = setTimeout(done, 150);
    const onData = (d) => { data += d; clearTimeout(timer); timer = setTimeout(done, 150); };
    const onEnd = () => { stdinEnded = true; done(); };
    function done() {
      clearTimeout(timer);
      process.stdin.off('data', onData);
      process.stdin.off('end', onEnd);
      process.stdin.off('error', onEnd);
      process.stdin.pause();
      resolve(data);
    }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', onData);
    process.stdin.on('end', onEnd);
    process.stdin.on('error', onEnd);
  });
}

const stdin = await readInput();
const socket = net.connect(broker);
let buf = '';
let exitCode = null;
socket.on('connect', () => socket.write(JSON.stringify({ name, argv, stdin, cwd: process.cwd() }) + '\n'));
socket.on('data', (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i);
    buf = buf.slice(i + 1);
    const m = JSON.parse(line);
    if (m.out !== undefined) process.stdout.write(m.out);
    if (m.err !== undefined) process.stderr.write(m.err);
    if (m.exit !== undefined) exitCode = m.exit;
    if (m.exec) passThrough(m.exec, m.env, m.capture);
  }
});

// The fixture asked for the real program: run it here, inside the sandbox,
// with this command's input, and leave with its code.
let passing = false;
function passThrough(argv, env, capture) {
  passing = true;
  socket.removeAllListeners('close');
  socket.destroy();
  const child = spawn(argv[0], argv.slice(1), { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, ...(env ?? {}) } });
  // What arrived before the fixture answered, then the rest as it comes, until
  // the caller closes it: a backend that talks over stdin keeps talking.
  child.stdin.on('error', () => {});
  if (stdin) child.stdin.write(stdin);
  if (stdinEnded) child.stdin.end();
  else process.stdin.pipe(child.stdin);
  // What it prints goes to the caller and, for the story's log, to the capture file.
  // The log keeps the newest 256 KB of each, however long the program runs.
  const out = [], err = [];
  const keep = (list, d) => {
    list.push(d);
    let size = list.reduce((n, b) => n + b.length, 0);
    while (size > 262144 && list.length > 1) size -= list.shift().length;
  };
  child.stdout.on('data', (d) => { keep(out, d); process.stdout.write(d); });
  child.stderr.on('data', (d) => { keep(err, d); process.stderr.write(d); });
  child.on('error', (e) => fail(`couldn't run ${argv[0]}: ${e.message}`, 127));
  child.on('close', (code, signal) => {
    const exit = code ?? (signal ? 128 : 1);
    if (capture) {
      try { writeFileSync(capture, JSON.stringify({ stdout: Buffer.concat(out).toString(), stderr: Buffer.concat(err).toString(), code: exit })); } catch { /* the session is gone */ }
    }
    process.exit(exit);
  });
}
socket.on('error', (e) => { if (!passing) fail(`the Omarchy stage broker is gone (${e.code})`); });
socket.on('close', () => {
  const code = exitCode ?? 70;
  // Let stdout drain before leaving.
  if (process.stdout.writableLength) process.stdout.once('drain', () => process.exit(code));
  else process.exit(code);
});
process.on('SIGTERM', () => { socket.destroy(); process.exit(143); });
