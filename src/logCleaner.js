const { stripAnsi, truncateToTokenLimit } = require('./utils');

const NOISE_PATTERNS = [
  /^##\[group\]/,
  /^##\[endgroup\]/,
  /^##\[debug\]/,
  /^##\[command\]/,
  /^\s*$/,
  /^Downloading .+/,
  /^Download .+ complete/,
  /^Run actions\//,
  /^Using .+ version/,
  /^\d+%\s*\|/,
  /^npm WARN/,
  /^npm notice/,
  /^added \d+ packages/,
  /^up to date/,
  /^\s*\^+\s*$/,
  /^remote:/,
  /^Receiving objects:/,
  /^Resolving deltas:/,
  /^Counting objects:/,
  /^Compressing objects:/,
];

const IMPORTANT_PATTERNS = [
  /error/i,
  /fail/i,
  /exception/i,
  /traceback/i,
  /stack trace/i,
  /at .+\(.+:\d+:\d+\)/,
  /^\s+at\s+/,
  /cannot find/i,
  /not found/i,
  /permission denied/i,
  /syntax error/i,
  /undefined/i,
  /null/i,
  /segmentation fault/i,
  /core dumped/i,
  /assertion fail/i,
  /panic/i,
  /fatal/i,
];

function isNoiseLine(line) {
  return NOISE_PATTERNS.some(pattern => pattern.test(line));
}

function isImportantLine(line) {
  return IMPORTANT_PATTERNS.some(pattern => pattern.test(line));
}

function deduplicateLines(lines) {
  const seen = new Set();
  const result = [];

  for (const line of lines) {
    const normalized = line.trim();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(line);
    }
  }

  return result;
}

function cleanLogs(rawLogs, maxLines = 500) {
  const cleaned = stripAnsi(rawLogs);
  const lines = cleaned.split('\n');

  const filtered = lines.filter(line => {
    if (isNoiseLine(line)) {
      return false;
    }
    return true;
  });

  const deduped = deduplicateLines(filtered);

  const important = [];
  const other = [];

  for (const line of deduped) {
    if (isImportantLine(line)) {
      important.push(line);
    } else {
      other.push(line);
    }
  }

  let result = [...important];
  const remainingSlots = maxLines - important.length;

  if (remainingSlots > 0) {
    result = [...important, ...other.slice(-remainingSlots)];
  }

  if (result.length > maxLines) {
    result = result.slice(0, maxLines);
  }

  const output = result.join('\n');
  return truncateToTokenLimit(output);
}

module.exports = {
  cleanLogs,
  isNoiseLine,
  isImportantLine
};
