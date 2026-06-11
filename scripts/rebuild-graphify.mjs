import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const defaultGraphifyPython = '/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/python';
const python = process.env.GRAPHIFY_PYTHON || (
  existsSync(defaultGraphifyPython) ? defaultGraphifyPython : 'python3'
);

const code = "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))";
const result = spawnSync(python, ['-c', code], {
  cwd: process.cwd(),
  stdio: 'inherit',
});

if (result.error) {
  console.error(`Failed to start graphify rebuild with ${python}: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(
    `Graphify rebuild failed with ${python}. Set GRAPHIFY_PYTHON to the Python executable that has the graphify package installed.`,
  );
  process.exit(result.status ?? 1);
}
