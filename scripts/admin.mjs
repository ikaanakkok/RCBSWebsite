import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const child = spawn(process.execPath, [require.resolve('decap-server')], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, BIND_HOST: '127.0.0.1', PORT: '8081', MODE: 'fs', GIT_REPO_DIRECTORY: root },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 0; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
