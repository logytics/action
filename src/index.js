const core = require('@actions/core');
const { collectLogs, getWorkflowRunInfo } = require('./logCollector');
const { cleanLogs } = require('./logCleaner');
const { buildPrompt } = require('./promptBuilder');
const { analyzeWithRetry, createFallbackAnalysis } = require('./aiClient');
const { writeSummary } = require('./summaryWriter');

async function run() {
  try {
    const openaiApiKey = core.getInput('openai-api-key', { required: true });
    const model = core.getInput('model') || 'gpt-4o-mini';
    const maxLogLines = parseInt(core.getInput('max-log-lines') || '500', 10);
    const githubToken = core.getInput('github-token') || process.env.GITHUB_TOKEN;
    const directLogs = core.getInput('logs') || '';

    if (!githubToken) {
      throw new Error('GitHub token is required. Provide it via github-token input or GITHUB_TOKEN environment variable.');
    }

    core.info('Logytics: Starting failure analysis...');

    let workflowInfo = null;
    try {
      workflowInfo = await getWorkflowRunInfo(githubToken);
      core.info(`Analyzing workflow: ${workflowInfo.name} on ${workflowInfo.branch}`);
    } catch (error) {
      core.warning(`Could not get workflow info: ${error.message}`);
    }

    core.info('Collecting logs from failed steps...');
    const rawLogs = await collectLogs(githubToken, directLogs);

    if (!rawLogs) {
      core.warning('No failed job logs found. Skipping analysis.');
      return;
    }

    core.info('Cleaning and preparing logs...');
    const cleanedLogs = cleanLogs(rawLogs, maxLogLines);

    core.info(`Prepared ${cleanedLogs.split('\n').length} lines for analysis`);

    core.info('Sending logs to AI for analysis...');
    const { systemPrompt, userPrompt } = buildPrompt(cleanedLogs, workflowInfo);

    let analysis;
    try {
      analysis = await analyzeWithRetry(openaiApiKey, model, systemPrompt, userPrompt);
      core.info('AI analysis complete');
    } catch (error) {
      core.warning(`AI analysis failed: ${error.message}`);
      analysis = createFallbackAnalysis(error);
    }

    core.info('Writing summary to GitHub Actions...');
    await writeSummary(analysis, workflowInfo);

    core.setOutput('root-cause', analysis.rootCause);
    core.setOutput('suggested-fix', analysis.suggestedFix || '');
    core.setOutput('confidence', analysis.confidence.toString());

    core.info('Logytics analysis complete!');
  } catch (error) {
    core.setFailed(`Logytics failed: ${error.message}`);
  }
}

run();
