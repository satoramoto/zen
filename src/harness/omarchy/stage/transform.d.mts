export const FAKE_MODULES: Record<string, string>;
export function transformQml(text: string, options?: { fakes?: Record<string, string> }): { text: string; changes: string[] };
export function transformBinaries(text: string): { text: string; changes: string[] };
