// One stage session: a staged copy of Omarchy's kit and one plugin, run in a
// headless Quickshell that can't reach the machine, driven over a socket.
import { spawn, execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FAKE_MODULES, transformBinaries, transformQml } from './transform.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const QML = path.join(here, 'qml');
const FAKE_COMMAND = path.join(here, 'fake-command.mjs');

/** Where sessions live. Large output stays out of /tmp, a shared memory disk. */
export const STAGE_HOME = path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'omarchy-stage');
/** Runtime folders hold only sockets, so their paths stay under 108 bytes. */
export const RUNTIME_PREFIX = '/tmp/oqs-';

/** Harmless tools a plugin's shell lines may use. Nothing else is on PATH. */
export const SAFE_TOOLS = ['sh', 'bash', 'env', 'cat', 'grep', 'sed', 'awk', 'head', 'tail', 'tr', 'cut', 'sort', 'uniq', 'wc',
  'printf', 'echo', 'test', '[', 'true', 'false', 'sleep', 'date', 'jq', 'basename', 'dirname', 'readlink', 'realpath', 'mkdir',
  'ls', 'stat', 'seq', 'xargs', 'tee', 'fc-match', 'fc-list', 'expr', 'id', 'whoami', 'uname', 'mktemp', 'touch', 'cp', 'mv', 'rm',
  'ln', 'find', 'timeout', 'od', 'base64', 'sha256sum', 'md5sum', 'paste', 'column', 'fold', 'rev', 'nl', 'diff', 'cmp', 'gzip'];

/**
 * Commands that would reach the machine. Each is faked in every session: the
 * fixture answers it, or the stage does (`stageDefaults`), or it fails and is
 * logged as unanswered. A plugin calling anything else finds no command.
 */
export const GUARDED = ['hyprctl', 'omarchy', 'notify-send', 'wl-copy', 'wl-paste', 'xdg-open', 'gtk-launch', 'uwsm', 'uwsm-app',
  'setsid', 'systemctl', 'loginctl', 'busctl', 'gdbus', 'dbus-send', 'nmcli', 'bluetoothctl', 'wpctl', 'pactl', 'pw-cli', 'pw-dump',
  'pw-metadata', 'pw-link', 'pw-top', 'amixer', 'alsactl', 'aplay', 'playerctl', 'brightnessctl', 'powerprofilesctl', 'upower',
  'asusctl', 'supergfxctl', 'tlp', 'cpupower', 'sensors', 'nvidia-smi', 'python', 'python3', 'node', 'curl', 'wget', 'ssh', 'op',
  'git', 'sudo', 'pkexec', 'su', 'kill', 'pkill', 'killall', 'shutdown', 'reboot', 'poweroff', 'hyprlock', 'hypridle', 'swayosd-client',
  'makoctl', 'walker', 'fuzzel', 'rofi', 'wofi', 'kitty', 'alacritty', 'ghostty', 'foot', 'xdg-terminal-exec', 'notify', 'quickshell',
  'qs', 'pacman', 'yay', 'paru', 'flatpak', 'docker', 'podman', 'iwctl', 'rfkill', 'ip', 'ping', 'journalctl', 'dmesg', 'lsblk',
  'udisksctl', 'mount', 'umount', 'xdotool', 'wtype', 'ydotool', 'grim', 'slurp', 'hyprpicker', 'hyprsunset', 'wvkbd-mobintl',
  'wvkbd', 'squeekboard', 'canberra-gtk-play', 'paplay', 'speaker-test'];

const found = new Map();
/** A program's absolute path, from the server's own PATH: the sandbox has only fakes and safe tools on its. */
function which(name) {
  if (found.has(name)) return found.get(name);
  for (const dir of (process.env.PATH || '/usr/bin:/bin').split(':')) {
    const p = path.join(dir, name);
    try { fs.accessSync(p, fs.constants.X_OK); if (fs.statSync(p).isFile()) { found.set(name, p); return p; } } catch { /* next */ }
  }
  throw new Error(`${name} is not installed`);
}

function hash(text) { return createHash('sha256').update(text).digest('hex').slice(0, 12); }

function copyTree(from, to, { transform, skip }) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (skip?.(entry.name)) continue;
    const src = path.join(from, entry.name), dst = path.join(to, entry.name);
    let stat;
    try { stat = fs.statSync(src); } catch { continue; }
    if (stat.isDirectory()) copyTree(src, dst, { transform, skip });
    else if (stat.isFile()) {
      const data = fs.readFileSync(src);
      const out = transform?.(entry.name, data, src);
      fs.writeFileSync(dst, out ?? data);
      fs.chmodSync(dst, stat.mode & 0o755);
    }
  }
}

/** The kit's own home: OMARCHY_PATH, else the package. */
export function omarchyRoot() {
  return process.env.OMARCHY_PATH && fs.existsSync(path.join(process.env.OMARCHY_PATH, 'shell'))
    ? process.env.OMARCHY_PATH : '/usr/share/omarchy';
}

/** Why the stage can't run here, or null. */
export function unavailable() {
  try { execFileSync('quickshell', ['--version'], { stdio: 'ignore' }); } catch { return 'quickshell is not installed'; }
  try { execFileSync('dbus-run-session', ['--version'], { stdio: 'ignore' }); } catch { return 'dbus-run-session is not installed'; }
  try { execFileSync('bwrap', ['--version'], { stdio: 'ignore' }); } catch { return 'bubblewrap (bwrap) is not installed'; }
  if (!fs.existsSync(path.join(omarchyRoot(), 'shell', 'Ui', 'qmldir'))) return `Omarchy's shell kit isn't at ${omarchyRoot()}/shell`;
  return null;
}

let hyprSnapshot = null;
/** The live compositor's look, read once (read-only), so Style draws as the bar does. */
function hyprOptions() {
  if (hyprSnapshot) return hyprSnapshot;
  hyprSnapshot = {};
  for (const option of ['decoration:rounding', 'general:gaps_out', 'animations:enabled']) {
    // Storybook may run where HYPRLAND_INSTANCE_SIGNATURE isn't set: then the first running instance.
    const instance = process.env.HYPRLAND_INSTANCE_SIGNATURE ? [] : ['-i', '0'];
    try { hyprSnapshot[option] = JSON.parse(execFileSync('hyprctl', [...instance, '-j', 'getoption', option], { encoding: 'utf8', timeout: 2000 })); }
    catch { /* no Hyprland here: Style keeps its defaults */ }
  }
  return hyprSnapshot;
}

/** The stage's own answers, for commands a fixture leaves alone. */
function stageDefaults(options) {
  return {
    hyprctl(call) {
      const args = call.argv.filter((a) => a !== '-j');
      if (args[0] === 'getoption') {
        if (args[1] === 'animations:enabled' && !options.animations) return { stdout: JSON.stringify({ option: args[1], int: 0, set: true }) };
        const snap = hyprOptions()[args[1]];
        return snap ? { stdout: JSON.stringify(snap) } : { code: 1, stderr: `no such option ${args[1]}` };
      }
      if (args[0] === 'dispatch') return { stdout: 'ok' };
      if (['monitors', 'workspaces', 'clients', 'activewindow', 'activeworkspace', 'devices', 'layers', 'binds'].includes(args[0])) {
        return { stdout: args[0] === 'monitors' ? JSON.stringify([{ id: 0, name: 'STAGE-1', width: options.width, height: options.height, scale: 1, focused: true }]) : '[]' };
      }
      return { stdout: '' };
    },
    'notify-send': () => ({ code: 0 }),
  };
}

let toolsDir = null;
function safeTools() {
  if (toolsDir) return toolsDir;
  toolsDir = path.join(STAGE_HOME, 'tools');
  fs.mkdirSync(toolsDir, { recursive: true });
  for (const tool of SAFE_TOOLS) {
    const link = path.join(toolsDir, tool);
    let real = null;
    for (const dir of ['/usr/bin', '/bin']) if (fs.existsSync(path.join(dir, tool))) { real = path.join(dir, tool); break; }
    if (!real) continue;
    try { fs.lstatSync(link); } catch { fs.symlinkSync(real, link); }
  }
  return toolsDir;
}

/** Copies the theme files Commons reads, so the stage draws in the person's theme. */
function stageTheme(home, theme) {
  const real = os.homedir();
  const themeDir = path.join(home, '.local/state/omarchy/current/theme');
  fs.mkdirSync(themeDir, { recursive: true });
  const source = theme && theme !== 'current'
    ? [path.join(real, '.config/omarchy/themes', theme), path.join(omarchyRoot(), 'themes', theme)].find((d) => fs.existsSync(d))
    : path.join(real, '.local/state/omarchy/current/theme');
  if (theme && theme !== 'current' && !source) throw new Error(`no Omarchy theme called ${theme}`);
  if (source && fs.existsSync(source)) {
    for (const name of fs.readdirSync(source)) {
      if (/\.(toml|conf|json|lua|css|ini)$/.test(name)) {
        try { fs.copyFileSync(path.join(source, name), path.join(themeDir, name)); } catch { /* a link to nothing */ }
      }
    }
  }
  for (const rel of ['.config/omarchy/shell.toml', '.config/fontconfig/fonts.conf']) {
    const from = path.join(real, rel);
    if (fs.existsSync(from)) {
      fs.mkdirSync(path.dirname(path.join(home, rel)), { recursive: true });
      fs.copyFileSync(from, path.join(home, rel));
    }
  }
  // Fonts are read, not copied: the person's own fonts, as the bar sees them.
  const fonts = path.join(real, '.local/share/fonts');
  if (fs.existsSync(fonts)) {
    fs.mkdirSync(path.join(home, '.local/share'), { recursive: true });
    fs.symlinkSync(fonts, path.join(home, '.local/share/fonts'));
  }
}

/**
 * @typedef {{ stdout?: string, stderr?: string, code?: number, delay?: number,
 *   stream?: (write: (chunk: string) => void, signal: AbortSignal) => Promise<number|void> }} Answer
 * @typedef {{ name: string, argv: string[], stdin: string, cwd: string }} Call
 */

export class Session {
  /**
   * @param {object} o
   * @param {string} o.id plugin id
   * @param {string} o.source the plugin's folder
   * @param {{ role: string, file: string }[]} o.entries
   * @param {object} [o.manifest]
   * @param {string} [o.section]
   * @param {object} [o.settings]
   * @param {(dir: string, session: Session) => void} [o.prepare] edits the staged plugin
   * @param {(state: any, session: Session) => any} [o.fixture]
   * @param {any} [o.state] what the story gives the fixture
   * @param {number} [o.width] @param {number} [o.height] @param {number} [o.scale]
   * @param {string} [o.theme] @param {boolean} [o.animations]
   */
  constructor(o) {
    this.options = { width: 1100, height: 760, scale: 1, theme: 'current', animations: false, ...o };
    this.key = randomBytes(6).toString('hex');
    this.dir = path.join(STAGE_HOME, 'sessions', this.key);
    this.log = [];        // what happened: commands, reports, errors, Qt's warnings
    this.calls = [];      // every command the plugin ran
    this.frame = null;    // { n, png, hash }
    this.frameWaiters = [];
    this.pending = new Map();
    this.nextId = 1;
    this.closed = false;
    this.ready = null;
    this.lastSeen = Date.now();
    this.streams = new Set();
  }

  note(kind, data) {
    const entry = { at: Date.now(), kind, ...data };
    this.log.push(entry);
    if (this.log.length > 2000) this.log.splice(0, this.log.length - 2000);
    return entry;
  }

  /** Builds the staged copy and starts Quickshell. Resolves once the plugin has loaded. */
  async start() {
    const o = this.options;
    const kit = path.join(omarchyRoot(), 'shell');
    this.runtime = fs.mkdtempSync(RUNTIME_PREFIX);
    fs.chmodSync(this.runtime, 0o700);
    const cfg = path.join(this.dir, 'cfg');
    this.home = path.join(this.dir, 'home');
    this.bin = path.join(this.dir, 'bin');
    this.frames = path.join(this.dir, 'frames');
    for (const d of [cfg, this.home, this.bin, this.frames]) fs.mkdirSync(d, { recursive: true });
    for (const d of ['.config', '.cache', '.local/state', '.local/share']) fs.mkdirSync(path.join(this.home, d), { recursive: true });

    // Fakes that exist on disk; a module with no fake stays Quickshell's own.
    const fakes = Object.fromEntries(Object.entries(FAKE_MODULES)
      .filter(([, fake]) => fs.existsSync(path.join(QML, 'stage', ...fake.split('.').slice(2)))));
    const rewrites = [];
    const transform = (name, data, src) => {
      if (name.endsWith('.qml')) {
        const { text, changes } = transformQml(data.toString('utf8'), { fakes });
        if (changes.length) rewrites.push({ file: src, changes });
        return text;
      }
      if (/\.(js|mjs|sh|py)$/.test(name)) {
        const { text, changes } = transformBinaries(data.toString('utf8'));
        if (changes.length) rewrites.push({ file: src, changes });
        return text;
      }
      return null;
    };
    for (const part of ['Commons', 'Ui', 'services']) copyTree(path.join(kit, part), path.join(cfg, part), { transform });
    // Outside the shell's config root, loaded by file URL, as the shell loads
    // ~/.config/omarchy/plugins: inside it Quickshell's qs: scheme would break
    // a plugin's imports of its own sibling files.
    const pluginDir = path.join(this.dir, 'plugins', o.id);
    this.pluginDir = pluginDir;
    copyTree(o.source, pluginDir, {
      transform,
      skip: (n) => n === '.git' || n === 'node_modules' || n === '__pycache__' || n === 'preview' || /\.bak|\.orig$|~$/.test(n),
    });
    copyTree(path.join(QML, 'stage'), path.join(cfg, 'stage'), {});
    fs.copyFileSync(path.join(QML, 'shell.qml'), path.join(cfg, 'shell.qml'));
    o.prepare?.(pluginDir, this);
    this.note('staged', { rewrites });

    // Omarchy's own folder, read through links, with bin/ swapped for the fakes.
    const omarchy = path.join(this.dir, 'omarchy');
    fs.mkdirSync(omarchy);
    for (const name of fs.readdirSync(omarchyRoot())) {
      if (name === 'bin') continue;
      fs.symlinkSync(path.join(omarchyRoot(), name), path.join(omarchy, name));
    }
    fs.symlinkSync(this.bin, path.join(omarchy, 'bin'));
    this.omarchy = omarchy;

    stageTheme(this.home, o.theme);

    // The fixture answers first, then the stage; a guarded name nobody answers fails.
    this.fixture = o.fixture ? await o.fixture(o.state ?? {}, this) : {};
    const answers = { ...stageDefaults(o), ...(this.fixture.commands ?? {}) };
    this.answers = answers;
    const names = new Set([...GUARDED, ...Object.keys(answers), ...(this.fixture.alsoFake ?? [])]);
    for (const name of names) this.addFake(name);

    // Files the fixture lays over the sandbox, read-only (an /etc/passwd with its accounts).
    this.overlays = [];
    for (const [target, content] of Object.entries(this.fixture.overlays ?? {})) {
      if (!path.isAbsolute(target)) throw new Error(`an overlay needs an absolute path, not ${target}`);
      const file = path.join(this.dir, 'overlays', String(this.overlays.length));
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
      this.overlays.push(['--ro-bind', file, target]);
    }

    // The fixture's initial service state rides in the config; later changes go over the socket.
    const services = typeof this.fixture.services === 'function' ? this.fixture.services() : (this.fixture.services ?? {});

    const config = {
      screen: { width: o.width, height: o.height },
      socket: path.join(this.runtime, 'stage.sock'),
      frames: this.frames,
      omarchyPath: omarchy,
      desktop: o.desktop ?? null,
      services,
      plugin: {
        id: o.id,
        section: o.section ?? 'left',
        settings: o.settings ?? {},
        manifest: o.manifest ?? null,
        entries: o.entries.map((e) => ({ role: e.role, url: pathToFileURL(path.join(pluginDir, e.file)).href })),
      },
    };
    fs.writeFileSync(path.join(cfg, 'stage', 'config.js'), `.pragma library\nvar config = ${JSON.stringify(config, null, 2)}\n`);

    await this.startBroker();

    const screens = path.join(this.dir, 'screens.json');
    fs.writeFileSync(screens, JSON.stringify({ screens: [{ name: 'STAGE-1', x: 0, y: 0, width: o.width, height: o.height, logicalDpi: 96, logicalBaseDpi: 96, dpr: o.scale }] }));
    const keep = ['LANG', 'LC_ALL', 'LC_CTYPE', 'LC_MESSAGES', 'LC_TIME', 'LC_NUMERIC', 'TZ', 'TERM'];
    const env = Object.fromEntries(keep.filter((k) => process.env[k]).map((k) => [k, process.env[k]]));
    Object.assign(env, {
      HOME: this.home,
      USER: os.userInfo().username,
      PATH: `${this.bin}:${safeTools()}`,
      XDG_RUNTIME_DIR: this.runtime,
      XDG_CONFIG_HOME: path.join(this.home, '.config'),
      XDG_CACHE_HOME: path.join(this.home, '.cache'),
      XDG_STATE_HOME: path.join(this.home, '.local/state'),
      XDG_DATA_HOME: path.join(this.home, '.local/share'),
      XDG_DATA_DIRS: '/usr/local/share:/usr/share',
      XDG_CONFIG_DIRS: '/etc/xdg',
      OMARCHY_PATH: omarchy,
      QT_QPA_PLATFORM: `offscreen:configfile=${screens}`,
      QT_QUICK_BACKEND: 'software',
      QT_SCALE_FACTOR: String(o.scale),
      QT_QPA_PLATFORMTHEME: '',
      DBUS_SYSTEM_BUS_ADDRESS: `unix:path=${path.join(this.runtime, 'no-system-bus')}`,
      OMARCHY_STAGE_BROKER: this.brokerPath,
      OMARCHY_STAGE: '1',
    });
    this.env = env;

    // The sandbox: everything read-only but the session's own folders, the
    // person's runtime folder (Wayland, PipeWire, their bus, 1Password) and
    // the system bus hidden, no network, its own process and IPC namespaces.
    const sandbox = [
      '--die-with-parent', '--new-session', '--unshare-ipc', '--unshare-net', '--unshare-pid', '--unshare-uts',
      '--ro-bind', '/', '/', '--dev', '/dev', '--proc', '/proc',
      '--tmpfs', '/tmp', '--tmpfs', '/run/user', '--tmpfs', '/run/dbus',
      '--bind', this.runtime, this.runtime, '--bind', this.dir, this.dir,
      ...this.overlays.flat(),
      '--chdir', this.home, '--clearenv',
      ...Object.entries(env).flatMap(([k, v]) => ['--setenv', k, v]),
    ];
    this.proc = spawn(which('bwrap'), [...sandbox, '--', which('dbus-run-session'), `--dbus-daemon=${which('dbus-daemon')}`, '--', which('quickshell'), '--no-duplicate', '-p', path.join(cfg, 'shell.qml')], {
      env: {}, cwd: this.home, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const qtLog = (stream) => {
      let buf = '';
      stream.on('data', (d) => {
        buf += d;
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).replace(/\x1b\[[0-9;]*m/g, '').trimEnd();
          buf = buf.slice(i + 1);
          if (!line || /inotify|Launching config|Shell ID|Saving logs to/.test(line)) continue;
          this.note('qt', { line });
        }
      });
    };
    qtLog(this.proc.stdout);
    qtLog(this.proc.stderr);
    this.exited = new Promise((resolve) => this.proc.on('exit', (code, signal) => {
      this.note('exit', { code, signal });
      resolve({ code, signal });
    }));

    await this.connect();
    this.ready = await Promise.race([
      this.call({ op: 'ready' }, 20000),
      this.exited.then(() => { throw new Error(`Quickshell exited while loading:\n${this.qtErrors()}`); }),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`the plugin took over 20 s to load:\n${this.qtErrors()}`)), 20000)),
    ]);
    if (this.ready.errors?.length) this.note('error', { errors: this.ready.errors });
    await this.call({ op: 'frame' });
    return this;
  }

  qtErrors() {
    return this.log.filter((e) => e.kind === 'qt' && /ERROR|WARN|error|Error/.test(e.line)).map((e) => e.line).slice(-20).join('\n');
  }

  addFake(name) {
    const file = path.join(this.bin, name);
    if (fs.existsSync(file)) return;
    fs.writeFileSync(file, `#!/bin/sh\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(FAKE_COMMAND)} ${JSON.stringify(name)} "$@"\n`);
    fs.chmodSync(file, 0o755);
  }

  /** The socket the fake commands ask. */
  startBroker() {
    this.brokerPath = path.join(this.runtime, 'broker.sock');
    this.broker = net.createServer((socket) => {
      let buf = '';
      socket.on('data', (d) => {
        buf += d;
        const i = buf.indexOf('\n');
        if (i < 0) return;
        const call = JSON.parse(buf.slice(0, i));
        buf = '';
        this.answer(call, socket).catch((e) => {
          socket.end(JSON.stringify({ err: `stage: ${e.message}\n` }) + '\n' + JSON.stringify({ exit: 70 }) + '\n');
        });
      });
      socket.on('error', () => {});
    });
    return new Promise((resolve) => this.broker.listen(this.brokerPath, resolve));
  }

  async answer(call, socket) {
    const handler = this.answers[call.name];
    const by = !handler ? null : this.fixture.commands?.[call.name] ? 'fixture' : 'stage';
    const entry = { name: call.name, argv: call.argv, stdin: call.stdin || '', answered: !!handler, by, at: Date.now() };
    this.calls.push(entry);
    this.note('call', { call: entry });
    const send = (m) => { if (!socket.destroyed) socket.write(JSON.stringify(m) + '\n'); };
    if (!handler) {
      send({ err: `${call.name}: not available on the Omarchy stage\n` });
      send({ exit: 127 });
      socket.end();
      return;
    }
    /** @type {Answer} */
    const a = (await handler(call, this)) ?? {};
    if (a.delay) await new Promise((r) => setTimeout(r, a.delay));
    if (a.exec) {
      entry.exec = a.exec;
      fs.mkdirSync(path.join(this.dir, 'captures'), { recursive: true });
      entry.capture = path.join(this.dir, 'captures', `${this.calls.length}.json`);
      send({ exec: a.exec, env: a.env ?? {}, capture: entry.capture });
      socket.end();
      return;
    }
    if (a.stdout) send({ out: a.stdout });
    if (a.stderr) send({ err: a.stderr });
    let code = a.code ?? 0;
    if (a.stream) {
      const abort = new AbortController();
      this.streams.add(abort);
      socket.on('close', () => abort.abort());
      try { code = (await a.stream((chunk) => send({ out: chunk }), abort.signal)) ?? code; }
      finally { this.streams.delete(abort); }
    }
    entry.code = code;
    send({ exit: code });
    socket.end();
  }

  /** Connects to the stage's control socket, retrying while Quickshell starts. */
  async connect() {
    const sock = path.join(this.runtime, 'stage.sock');
    const deadline = Date.now() + 20000;
    for (;;) {
      if (this.proc.exitCode !== null) throw new Error(`Quickshell exited before the stage started:\n${this.qtErrors()}`);
      try {
        this.control = await new Promise((resolve, reject) => {
          const c = net.connect(sock);
          c.once('connect', () => resolve(c));
          c.once('error', reject);
        });
        break;
      } catch {
        if (Date.now() > deadline) throw new Error(`the stage never opened its socket:\n${this.qtErrors()}`);
        await new Promise((r) => setTimeout(r, 50));
      }
    }
    let buf = '';
    this.control.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.id !== undefined && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.ok) resolve(msg.result); else reject(new Error(msg.error));
        } else if (msg.event === 'frame') this.takeFrame(msg);
        else if (msg.event === 'report') this.onReport(msg.report);
      }
    });
    this.control.on('error', () => {});
  }

  onReport(report) {
    this.note('report', { report });
    if (report.kind === 'service' && typeof this.fixture.serviceCall === 'function') {
      Promise.resolve(this.fixture.serviceCall(report.data, this)).catch((e) => this.note('error', { errors: [e.message] }));
    }
    if (typeof this.fixture.report === 'function') {
      Promise.resolve(this.fixture.report(report, this)).catch((e) => this.note('error', { errors: [e.message] }));
    }
  }

  takeFrame(msg) {
    let png = null;
    try { png = fs.readFileSync(msg.path); } catch { /* not saved */ }
    try { fs.unlinkSync(msg.path); } catch { /* already gone */ }
    if (!png) return;
    const h = createHash('sha1').update(png).digest('hex');
    if (this.frame && this.frame.hash === h) return;
    this.frame = { n: (this.frame?.n ?? 0) + 1, png, hash: h, at: Date.now() };
    const waiters = this.frameWaiters;
    this.frameWaiters = [];
    for (const w of waiters) w(this.frame);
  }

  /** The newest frame after `after`, waiting up to `timeout` ms for one. */
  nextFrame(after, timeout = 25000) {
    if (this.frame && this.frame.n > after) return Promise.resolve(this.frame);
    return new Promise((resolve) => {
      const timer = setTimeout(() => { this.frameWaiters = this.frameWaiters.filter((w) => w !== done); resolve(this.frame); }, timeout);
      const done = (f) => { clearTimeout(timer); resolve(f); };
      this.frameWaiters.push(done);
    });
  }

  /** Sends one request to the stage and waits for its reply. */
  call(request, timeout = 15000) {
    if (this.closed) return Promise.reject(new Error('the session has ended'));
    this.lastSeen = Date.now();
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`the stage didn't answer ${request.op} in ${timeout} ms`)); }, timeout);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      this.control.write(JSON.stringify({ ...request, id }) + '\n');
    });
  }

  /** Every call so far, with what a passed-through program printed once it has finished. */
  callLog() {
    return this.calls.map((c) => {
      if (!c.capture || c.code !== undefined) return c;
      try { Object.assign(c, JSON.parse(fs.readFileSync(c.capture, 'utf8'))); } catch { /* still running */ }
      return c;
    });
  }

  /** Pushes new service state to the fakes. */
  async setServices(state) {
    return this.call({ op: 'services', state });
  }

  /** Runs a fixture operation a play asked for. */
  async fixtureOp(name, data) {
    const op = this.fixture.ops?.[name];
    if (!op) throw new Error(`the fixture has no operation ${name}`);
    return op(data, this);
  }

  /** Calls one of the plugin's IPC handlers, as `quickshell ipc call` would from a keybind. */
  ipc(target, fn, args = []) {
    return new Promise((resolve, reject) => {
      const p = spawn('quickshell', ['ipc', '-p', path.join(this.dir, 'cfg', 'shell.qml'), '--any-display', 'call', '--', target, fn, ...args.map(String)], { env: this.env });
      let out = '', err = '';
      p.stdout.on('data', (d) => { out += d; });
      p.stderr.on('data', (d) => { err += d; });
      p.on('exit', (code) => code === 0 ? resolve(out.trim()) : reject(new Error(err.trim() || `ipc ${target} ${fn} failed`)));
    });
  }

  /** Stops Quickshell and everything it started, and removes the session's folders. */
  async close() {
    if (this.closed) return;
    this.closed = true;
    for (const s of this.streams) s.abort();
    for (const { reject } of this.pending.values()) reject(new Error('the session has ended'));
    this.pending.clear();
    try { this.control?.destroy(); } catch { /* gone */ }
    if (this.proc && this.proc.exitCode === null && this.proc.signalCode === null) {
      try { process.kill(-this.proc.pid, 'SIGTERM'); } catch { /* gone */ }
      const exited = await Promise.race([this.exited.then(() => true), new Promise((r) => setTimeout(() => r(false), 2000))]);
      if (!exited) { try { process.kill(-this.proc.pid, 'SIGKILL'); } catch { /* gone */ } await this.exited; }
    }
    await new Promise((r) => (this.broker ? this.broker.close(() => r()) : r()));
    removeOwned(this.runtime, RUNTIME_PREFIX);
    removeOwned(this.dir, path.join(STAGE_HOME, 'sessions') + path.sep);
  }
}

/** Removes a folder the stage made, and only one under the prefix it makes them in. */
export function removeOwned(dir, prefix) {
  if (!dir || typeof dir !== 'string') return;
  const resolved = path.resolve(dir);
  if (!resolved.startsWith(prefix) || resolved.length <= prefix.length + 3) throw new Error(`refusing to remove ${resolved}`);
  fs.rmSync(resolved, { recursive: true, force: true });
}

export { hash };
