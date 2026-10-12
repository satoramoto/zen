import { resolve, sep } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Agent worktrees live under this project's .claude/; their builds must not reload the app. Only
// the project's own .claude/ is ignored, so a server started inside a worktree still watches its src.
const agentDir = resolve('.claude') + sep;
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', strictPort: true, watch: { ignored: (path) => path.startsWith(agentDir) } },
});
