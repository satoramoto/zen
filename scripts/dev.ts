import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

const label = process.env.PREVIEW_LABEL ?? 'Zen';
function port(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1024 || parsed > 65535) throw new Error('Preview ports must be integers between 1024 and 65535.');
  return parsed;
}
const webPort = port(process.env.PREVIEW_PORT, 4191);
const storyPort = port(process.env.STORYBOOK_PORT, 6022);
if (webPort === storyPort) throw new Error('The app and Storybook need different ports.');
async function available(value: number) {
  await new Promise<void>((yes, no) => { const server = createServer(); server.once('error', () => no(new Error(`Port ${value} is occupied. Choose a free port; no existing process was stopped.`))); server.listen(value, '127.0.0.1', () => server.close(() => yes())); });
}
await available(webPort);
await available(storyPort);
const children: ChildProcess[] = [];
let stopping = false;
function stop(code: number) {
  if (stopping) return;
  stopping = true;
  console.log(`\n[${label}] Stopping all preview servers.`);
  for (const child of children) { if (child.pid) { try { process.kill(-child.pid, 'SIGTERM'); } catch {} } }
  const timeout = setTimeout(() => { for (const child of children) { if(child.pid) { try { process.kill(-child.pid, 'SIGKILL'); } catch {} } } process.exit(code); }, 2000);
  timeout.unref();
  Promise.all(children.map(child => new Promise<void>(done => { if(child.exitCode !== null || child.signalCode !== null) done(); else child.once('exit', () => done()); }))).then(() => process.exit(code));
}
function start(binary: string, args: string[]) {
  const child = spawn(resolve('node_modules/.bin', binary), args, { stdio: 'inherit', detached: true, env: { ...process.env, STORYBOOK_DISABLE_TELEMETRY: '1' } });
  children.push(child);
  child.on('error', error => { console.error(error); stop(1); });
  child.on('exit', code => { if (!stopping) { console.error(`[${label}] ${binary} exited (${code}); stopping the complete preview group.`); stop(code === 0 ? 1 : (code ?? 1)); } });
}
process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));
// The Svelte Storybook joins the group only when asked for (SVELTE_STORYBOOK_PORT); the React one composes it as a ref.
const svelteStoryPort = process.env.SVELTE_STORYBOOK_PORT === undefined ? undefined : port(process.env.SVELTE_STORYBOOK_PORT, 6023);
if (svelteStoryPort !== undefined) {
  if (svelteStoryPort === webPort || svelteStoryPort === storyPort) throw new Error('The Svelte Storybook needs its own port.');
  await available(svelteStoryPort);
  process.env.SVELTE_STORYBOOK_URL = `http://127.0.0.1:${svelteStoryPort}`;
}
console.log(`[${label}] App http://127.0.0.1:${webPort} | Storybook http://127.0.0.1:${storyPort}${svelteStoryPort ? ` | Svelte Storybook http://127.0.0.1:${svelteStoryPort}` : ''}`);
start('vite', ['--host', '127.0.0.1', '--port', String(webPort), '--strictPort']);
start('storybook', ['dev', '--host', '127.0.0.1', '--port', String(storyPort), '--ci', '--no-open', '--disable-telemetry']);
if (svelteStoryPort !== undefined) start('storybook', ['dev', '-c', '.storybook-svelte', '--host', '127.0.0.1', '--port', String(svelteStoryPort), '--ci', '--no-open', '--disable-telemetry']);
