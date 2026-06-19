const ANSI_REGEX = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

function stripAnsi(str) {
  return str.replace(ANSI_REGEX, '');
}

function truncateToTokenLimit(text, maxTokens = 4000) {
  const avgCharsPerToken = 4;
  const maxChars = maxTokens * avgCharsPerToken;

  if (text.length <= maxChars) {
    return text;
  }

  return text.slice(0, maxChars) + '\n\n[... truncated for token limit ...]';
}

function parseJsonSafe(str) {
  try {
    const jsonMatch = str.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  stripAnsi,
  truncateToTokenLimit,
  parseJsonSafe,
  sleep
};
