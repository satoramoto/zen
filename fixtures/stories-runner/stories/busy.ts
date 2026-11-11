// Records how many fixture stories are being played at once, when the test asks (Node only).
export async function busy() {
  const dir = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.ZEN_FIXTURE_BUSY_DIR;
  if (!dir) return;
  const fs = await import(/* @vite-ignore */ 'node:fs');
  const mine = `${dir}/${Math.random().toString(36).slice(2)}.busy`;
  fs.writeFileSync(mine, '');
  const now = fs.readdirSync(dir).filter((f: string) => f.endsWith('.busy')).length;
  fs.appendFileSync(`${dir}/seen`, `${now}\n`);
  await new Promise((r) => setTimeout(r, 400));
  fs.rmSync(mine);
}
