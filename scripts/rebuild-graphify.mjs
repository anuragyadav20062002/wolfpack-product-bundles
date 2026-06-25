import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

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

function getUvToolDir() {
  if (process.env.UV_TOOL_DIR) return process.env.UV_TOOL_DIR;

  const result = spawnSync('uv', ['tool', 'dir'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();

  return join(homedir(), '.local', 'share', 'uv', 'tools');
}

function getGraphifyPythonFromUvTool() {
  const python = join(getUvToolDir(), 'graphifyy', 'bin', 'python');
  if (!existsSync(python)) return '';

  const probe = spawnSync(python, ['-c', 'import graphify'], { stdio: 'ignore' });
  return probe.status === 0 ? python : '';
}

function getDetectedSources(python) {
  const code = [
    'from pathlib import Path',
    'from graphify.detect import detect',
    'import json',
    'root = Path(".").resolve()',
    'out = []',
    'for values in detect(Path("."))["files"].values():',
    '    for source in values:',
    '        path = Path(source)',
    '        try:',
    '            out.append(path.resolve().relative_to(root).as_posix())',
    '        except Exception:',
    '            out.append(source)',
    'print(json.dumps(out))',
  ].join('\n');

  const result = spawnSync(python, ['-c', code], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });

  if (result.status !== 0) return null;
  try {
    return new Set(JSON.parse(result.stdout));
  } catch (_error) {
    return null;
  }
}

function sanitizeGraph(detectedSources = null) {
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

  const staleNodeIds = new Set(generatedNodeIds);
  if (detectedSources) {
    for (const node of graph.nodes || []) {
      const sourceFile = String(node.source_file || '');
      if (sourceFile && !detectedSources.has(sourceFile)) {
        staleNodeIds.add(node.id);
      }
    }
  }

  if (staleNodeIds.size > 0) {
    graph.nodes = (graph.nodes || []).filter(node => !staleNodeIds.has(node.id));
    const pruneEdge = edge =>
      staleNodeIds.has(edge.source) || staleNodeIds.has(edge.target);
    if (Array.isArray(graph.links)) {
      graph.links = graph.links.filter(edge => !pruneEdge(edge));
    }
    if (Array.isArray(graph.edges)) {
      graph.edges = graph.edges.filter(edge => !pruneEdge(edge));
    }
    if (Array.isArray(graph.hyperedges)) {
      graph.hyperedges = graph.hyperedges.filter(edge =>
        !(Array.isArray(edge.nodes) && edge.nodes.some(nodeId => staleNodeIds.has(nodeId)))
      );
    }
    changed += staleNodeIds.size;
    console.log(`[graphify] Pruned ${staleNodeIds.size} stale/generated node(s).`);
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

const python = process.env.GRAPHIFY_PYTHON
  || getGraphifyPythonFromCli()
  || getGraphifyPythonFromUvTool()
  || 'python3';
const detectedSources = getDetectedSources(python);

sanitizeGraph(detectedSources);

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

sanitizeGraph(detectedSources);
validateGraphFileTypes();
