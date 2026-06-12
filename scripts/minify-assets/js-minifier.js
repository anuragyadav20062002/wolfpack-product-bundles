export function minifyJS(js) {
  js = removeJSBlockComments(js);
  js = removeJSSingleLineComments(js);
  js = js
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
  return js.replace(/\n{3,}/g, '\n\n').trim();
}

function removeJSBlockComments(src) {
  let out = '';
  let i = 0;
  const len = src.length;

  while (i < len) {
    const ch = src[i];
    if (ch === '`' || ch === "'" || ch === '"') {
      const end = readQuoted(src, i, ch);
      out += src.slice(i, end);
      i = end;
      continue;
    }

    if (ch === '/' && src[i + 1] === '*') {
      const isLicence = src[i + 2] === '!';
      const end = src.indexOf('*/', i + 2);
      if (end === -1) {
        if (isLicence) out += src.slice(i);
        break;
      }
      if (isLicence) out += src.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

function removeJSSingleLineComments(src) {
  return src
    .split('\n')
    .map((line) => stripLineComment(line))
    .join('\n');
}

function stripLineComment(line) {
  let i = 0;
  const len = line.length;

  while (i < len) {
    const ch = line[i];
    if (ch === '`' || ch === "'" || ch === '"') {
      i = readQuoted(line, i, ch);
      continue;
    }
    if (ch === '/' && line[i + 1] === '/') {
      return line.slice(0, i).trimEnd();
    }
    i++;
  }

  return line;
}

function readQuoted(source, start, quote) {
  let i = start + 1;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === quote) {
      return i + 1;
    }
    i++;
  }
  return i;
}
