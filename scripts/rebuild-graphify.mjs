import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const graphPath = 'graphify-out/graph.json';
const validFileTypes = new Set(['code', 'document', 'image', 'paper', 'rationale']);

function getGraphifyPythonFromCli() {
  const which = spawnSync('which', ['graphify'], { encoding: 'utf8' });
  const graphifyBin = which.status === 0 ? which.stdout.trim() : '';
  if (!graphifyBin || !existsSync(graphifyBin)) return '';

  const firstLine = readFileSync(graphifyBin, 'utf8').split(/\r?\n/, 1)[0] || '';
  if (!firstLine.startsWith('#!')) return '';

  const shebang = firstLine.slice(2).trim();
  const python = shebang.startsWith('/usr/bin/env ')
    ? shebang.slice('/usr/bin/env '.length).trim()
    : shebang;

  if (!python || /[^a-zA-Z0-9/_.-]/.test(python)) return '';

  const probe = spawnSync(python, ['-c', 'import graphify'], { stdio: 'ignore' });
  return probe.status === 0 ? python : '';
}

function sanitizeGraph() {
  if (!existsSync(graphPath)) return 0;

  const graph = JSON.parse(readFileSync(graphPath, 'utf8'));
  let changed = 0;
  for (const node of graph.nodes || []) {
    if (node.file_type === 'concept') {
      node.file_type = 'document';
      changed += 1;
    }
  }

  const generatedNodeIds = new Set(
    (graph.nodes || [])
      .filter(node => String(node.source_file || '').startsWith('graphify-out/'))
      .map(node => node.id)
      .filter(Boolean)
  );

  if (generatedNodeIds.size > 0) {
    graph.nodes = (graph.nodes || []).filter(node => !generatedNodeIds.has(node.id));
    const pruneEdge = edge =>
      generatedNodeIds.has(edge.source) || generatedNodeIds.has(edge.target);
    if (Array.isArray(graph.links)) {
      graph.links = graph.links.filter(edge => !pruneEdge(edge));
    }
    if (Array.isArray(graph.edges)) {
      graph.edges = graph.edges.filter(edge => !pruneEdge(edge));
    }
    if (Array.isArray(graph.hyperedges)) {
      graph.hyperedges = graph.hyperedges.filter(edge =>
        !(Array.isArray(edge.nodes) && edge.nodes.some(nodeId => generatedNodeIds.has(nodeId)))
      );
    }
    changed += generatedNodeIds.size;
    console.log(`[graphify] Pruned ${generatedNodeIds.size} generated graphify-out node(s).`);
  }

  if (changed > 0) {
    writeFileSync(graphPath, `${JSON.stringify(graph, null, 2)}\n`);
  }

  return changed;
}

function validateGraphFileTypes() {
  if (!existsSync(graphPath)) {
    throw new Error(`Missing ${graphPath}`);
  }

  const graph = JSON.parse(readFileSync(graphPath, 'utf8'));
  const invalid = (graph.nodes || []).filter(node =>
    node.file_type && !validFileTypes.has(node.file_type)
  );

  if (invalid.length > 0) {
    const sample = invalid.slice(0, 5).map(node =>
      `${node.id || '(missing id)'}:${node.file_type}`
    ).join(', ');
    throw new Error(`graphify graph contains ${invalid.length} invalid file_type value(s): ${sample}`);
  }
}

const defaultGraphifyPython = '/Users/adityaawasthi/.local/pipx/venvs/graphifyy/bin/python';
const uvGraphifyPython = '/Users/adityaawasthi/.local/share/uv/tools/graphifyy/bin/python';
const python = process.env.GRAPHIFY_PYTHON
  || getGraphifyPythonFromCli()
  || (existsSync(uvGraphifyPython) ? uvGraphifyPython : '')
  || (existsSync(defaultGraphifyPython) ? defaultGraphifyPython : 'python3');

sanitizeGraph();

const code = [
  'from graphify.watch import _rebuild_code',
  'from pathlib import Path',
  'import inspect',
  'kwargs = {}',
  'sig = inspect.signature(_rebuild_code)',
  'if "block_on_lock" in sig.parameters: kwargs["block_on_lock"] = True',
  'if "force" in sig.parameters: kwargs["force"] = True',
  'ok = _rebuild_code(Path("."), **kwargs)',
  'raise SystemExit(0 if ok else 1)',
].join('\n');
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
    `Graphify rebuild failed with ${python}. If this is a runtime selection issue, set GRAPHIFY_PYTHON to the Python executable that has the graphify package installed.`,
  );
  process.exit(result.status ?? 1);
}

sanitizeGraph();
validateGraphFileTypes();
