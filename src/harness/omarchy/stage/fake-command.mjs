// Every faked command on the stage is this script, linked under the
// command's name. It hands its arguments and input to the session's broker,
// prints what the fixture answers and exits with its code. With no broker it
// fails rather than reach for the real command.
import net from 'node:net';

const [name, ...argv] = process.argv.slice(2);
const broker = process.env.OMARCHY_STAGE_BROKER;

function fail(message, code = 70) {
  process.stderr.write(`${name}: ${message}\n`);
  process.exit(code);
}

if (!broker) fail('no Omarchy stage broker');

// Input, when there is any: a closed stdin ends at once; an open one that
// stays silent for 150 ms is taken as empty, since a fixture answers
// arguments, not a live stream.
function readInput() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    let timer = setTimeout(done, 150);
    function done() {
      clearTimeout(timer);
      process.stdin.removeAllListeners();
      process.stdin.pause();
      resolve(data);
    }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (d) => { data += d; clearTimeout(timer); timer = setTimeout(done, 150); });
    process.stdin.on('end', done);
    process.stdin.on('error', done);
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
  }
});
socket.on('error', (e) => fail(`the Omarchy stage broker is gone (${e.code})`));
socket.on('close', () => {
  const code = exitCode ?? 70;
  // Let stdout drain before leaving.
  if (process.stdout.writableLength) process.stdout.once('drain', () => process.exit(code));
  else process.exit(code);
});
process.on('SIGTERM', () => { socket.destroy(); process.exit(143); });
