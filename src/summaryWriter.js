const core = require('@actions/core');

function getConfidenceEmoji(confidence) {
  if (confidence >= 80) return '🟢';
  if (confidence >= 50) return '🟡';
  return '🔴';
}

async function writeSummary(analysis, workflowInfo = null) {
  const summary = core.summary;

  summary.addHeading('Logytics Analysis', 1);

  if (workflowInfo) {
    summary.addRaw(`<sub>Workflow: ${workflowInfo.name} | Branch: ${workflowInfo.branch} | Commit: ${workflowInfo.sha}</sub>\n\n`);
  }

  summary.addHeading('Root Cause', 2);
  summary.addRaw(analysis.rootCause + '\n\n');

  summary.addHeading('Key Error', 2);
  summary.addCodeBlock(analysis.keyError, 'text');

  if (analysis.explanation) {
    summary.addHeading('Explanation', 2);
    summary.addRaw(analysis.explanation + '\n\n');
  }

  if (analysis.suggestedFix) {
    summary.addHeading('Suggested Fix', 2);
    const isCode = analysis.suggestedFix.includes('\n') ||
                   analysis.suggestedFix.startsWith('npm ') ||
                   analysis.suggestedFix.startsWith('yarn ') ||
                   analysis.suggestedFix.startsWith('pip ') ||
                   analysis.suggestedFix.startsWith('apt ') ||
                   analysis.suggestedFix.startsWith('brew ');

    if (isCode) {
      summary.addCodeBlock(analysis.suggestedFix, 'bash');
    } else {
      summary.addRaw(analysis.suggestedFix + '\n\n');
    }
  }

  summary.addHeading('Confidence', 2);
  const emoji = getConfidenceEmoji(analysis.confidence);
  summary.addRaw(`${emoji} **${analysis.confidence}%**\n\n`);

  summary.addSeparator();
  summary.addRaw('<sub>Powered by <a href="https://github.com/logytics/action">Logytics</a></sub>\n');

  await summary.write();

  core.info('Summary written successfully');
}

module.exports = {
  writeSummary,
  getConfidenceEmoji
};
