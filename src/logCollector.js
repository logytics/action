const github = require('@actions/github');
const core = require('@actions/core');

async function getFailedJobLogs(octokit, owner, repo, runId) {
  const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id: runId,
  });

  const failedJobs = jobs.jobs.filter(job => job.conclusion === 'failure');

  if (failedJobs.length === 0) {
    return null;
  }

  const logs = [];

  for (const job of failedJobs) {
    const failedSteps = job.steps.filter(step => step.conclusion === 'failure');

    logs.push(`\n=== Job: ${job.name} ===\n`);

    for (const step of failedSteps) {
      logs.push(`\n--- Step: ${step.name} ---\n`);
    }

    try {
      const { data: jobLogs } = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
        owner,
        repo,
        job_id: job.id,
      });

      logs.push(jobLogs);
    } catch (error) {
      core.warning(`Could not download logs for job ${job.name}: ${error.message}`);
    }
  }

  return logs.join('\n');
}

async function collectLogs(token) {
  const context = github.context;

  if (!context.payload.workflow_run && !context.runId) {
    core.warning('No workflow run context available');
    return null;
  }

  const octokit = github.getOctokit(token);
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const runId = context.runId;

  core.info(`Collecting logs for run ${runId} in ${owner}/${repo}`);

  try {
    const logs = await getFailedJobLogs(octokit, owner, repo, runId);
    return logs;
  } catch (error) {
    core.error(`Failed to collect logs: ${error.message}`);
    throw error;
  }
}

async function getWorkflowRunInfo(token) {
  const context = github.context;
  const octokit = github.getOctokit(token);

  const { data: run } = await octokit.rest.actions.getWorkflowRun({
    owner: context.repo.owner,
    repo: context.repo.repo,
    run_id: context.runId,
  });

  return {
    name: run.name,
    event: run.event,
    branch: run.head_branch,
    sha: run.head_sha.substring(0, 7),
    actor: run.actor.login,
    url: run.html_url,
  };
}

module.exports = {
  collectLogs,
  getWorkflowRunInfo
};
