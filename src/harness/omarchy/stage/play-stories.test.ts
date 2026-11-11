// @vitest-environment node
// The runner's two edges, with no browser on the machine: it reads no browser path, and it
// names the command that installs Playwright's headless shell.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const runner = fileURLToPath(new URL('./play-stories.mjs', import.meta.url));
const index = { entries: { 'omarchy-lab--one': { type: 'story', id: 'omarchy-lab--one', title: 'Omarchy/Lab', name: 'One' } } };

let server: Server;
let url = '';
let noBrowsers = '';

beforeAll(async () => {
  server = createServer((_request, response) => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(index)); });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('the stub Storybook has no port');
  url = `http://127.0.0.1:${address.port}`;
  noBrowsers = mkdtempSync(join(tmpdir(), 'zen-no-browsers-'));
});

afterAll(() => { server.close(); rmSync(noBrowsers, { recursive: true, force: true }); });

function run(env: Record<string, string>) {
  return new Promise<{ code: number | null; output: string }>((done) => {
    const child = spawn(process.execPath, [runner, '--url', url], { env: { ...process.env, ...env } });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('close', (code) => done({ code, output }));
  });
}

describe('play-stories', () => {
  it('plays nothing and names the install command when the headless shell is missing', async () => {
    const { code, output } = await run({ PLAYWRIGHT_BROWSERS_PATH: noBrowsers, CHROMIUM_PATH: '' });
    expect(output).toContain('npx playwright install --only-shell chromium');
    expect(output).not.toMatch(/^(pass|FAIL) /m);
    expect(code).not.toBe(0);
  }, 30000);

  it('says CHROMIUM_PATH is no longer read and does not launch it', async () => {
    const { output } = await run({ PLAYWRIGHT_BROWSERS_PATH: noBrowsers, CHROMIUM_PATH: '/usr/bin/true' });
    expect(output).toContain('CHROMIUM_PATH is no longer read');
    // /usr/bin/true would "launch" at once and fail differently; the hint shows the path was ignored.
    expect(output).toContain('npx playwright install --only-shell chromium');
  }, 30000);
});
