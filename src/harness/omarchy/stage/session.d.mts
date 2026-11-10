/** A command the plugin ran, as a fixture sees it. */
export interface Call { name: string; argv: string[]; stdin: string; cwd: string }

/** A fixture's answer to one command. */
export interface Answer {
  stdout?: string;
  stderr?: string;
  code?: number;
  /** Milliseconds before answering. */
  delay?: number;
  /** Run this real program instead, inside the sandbox (session HOME, fakes on PATH), with the call's input. */
  exec?: string[];
  /** Environment for `exec`. */
  env?: Record<string, string>;
  /** Lines over time, until the session ends or the plugin stops the command; resolves to the exit code. */
  stream?: (write: (chunk: string) => void, signal: AbortSignal) => Promise<number | void>;
}

/** What a fixture module's default export returns for one session. */
export interface Fixture {
  /** Answers by command name. */
  commands?: Record<string, (call: Call, session: Session) => Answer | void | Promise<Answer | void>>;
  /** More names to fake, unanswered (logged, exit 127). */
  alsoFake?: string[];
  /** Files laid over the sandbox, read-only, by absolute path (an /etc/passwd with its accounts). */
  overlays?: Record<string, string>;
  /** The fake services' first state, by service (upower, pipewire, mpris, polkit, hyprland). */
  services?: Record<string, unknown> | (() => Record<string, unknown>);
  /** Operations a play runs with `stage.fixture(op, data)`. */
  ops?: Record<string, (data: any, session: Session) => unknown>;
  /** Hears what a fake service was asked to do (`{ service, method, args }`). */
  serviceCall?: (call: { service: string; method: string; args: unknown[] }, session: Session) => unknown;
}

export class Session {
  /** The session's own folder (the only place it can write, with its runtime folder). */
  dir: string;
  /** The staged plugin's folder. */
  pluginDir: string;
  /** The session's HOME. */
  home: string;
  /** The session's fake commands. */
  bin: string;
  /** Every command the plugin ran. */
  calls: { name: string; argv: string[]; stdin: string; answered: boolean; code?: number; at: number }[];
  /** Pushes new state to the fake services. */
  setServices(state: Record<string, unknown>): Promise<unknown>;
  /** Writes into the session's log. */
  note(kind: string, data: Record<string, unknown>): unknown;
}

export const STAGE_HOME: string;
export const RUNTIME_PREFIX: string;
export function unavailable(): string | null;
