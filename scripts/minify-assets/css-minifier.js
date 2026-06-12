import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';

export function minifyCSS(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  css = css.replace(/\s*\n\s*/g, ' ');
  css = css.replace(/[ \t]+/g, ' ');
  css = css.replace(/\s*\{\s*/g, '{');
  css = css.replace(/\s*\}\s*/g, '}');
  css = css.replace(/\s*:\s*/g, ':');
  css = css.replace(/\s*,\s*/g, ',');
  css = css.replace(/\s*;\s*/g, ';');
  css = css.replace(/;}/g, '}');
  css = css.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3\b/g, '#$1$2$3');
  css = css.replace(
    /(^|[\s:,(])0(?:px|rem|em|%)(?=\b|[;},)\s])/g,
    (_match, prefix) => `${prefix}0`,
  );
  css = css.replace(/(^|[\s:(,])0\.(\d+)/g, (_match, prefix, fraction) => `${prefix}.${fraction}`);
  css = css.replace(/\btransparent\b/g, '#0000');

  let prev;
  do {
    prev = css;
    css = css.replace(/[^{}]+\{\}/g, '');
  } while (css !== prev);

  return css.trim();
}

export function resolveCssImports(sourcePath, css, seen = new Set()) {
  const sourceDir = dirname(sourcePath);

  return css.replace(
    /@import\s+(?:url\()?['"]([^'")]+)['"]\)?\s*;/g,
    (statement, importPath) => {
      if (/^(?:https?:)?\/\//.test(importPath) || importPath.startsWith('/')) {
        return statement;
      }

      const resolvedPath = join(sourceDir, importPath);
      if (seen.has(resolvedPath)) {
        return '';
      }
      if (!existsSync(resolvedPath)) {
        throw new Error(`Missing CSS import ${importPath} from ${sourcePath}`);
      }

      seen.add(resolvedPath);
      return resolveCssImports(resolvedPath, readFileSync(resolvedPath, 'utf-8'), seen);
    },
  );
}
