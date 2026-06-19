const github = require('@actions/github');
const core = require('@actions/core');

async function getCurrentJobInfo(octokit, owner, repo, runId) {
  const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id: runId,
  });

  const currentJob = jobs.jobs.find(job => job.status === 'in_progress');

  if (currentJob) {
    const failedSteps = currentJob.steps.filter(step => step.conclusion === 'failure');
    return { job: currentJob, failedSteps };
  }

  return null;
}

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

async function downloadWorkflowRunLogs(octokit, owner, repo, runId) {
  try {
    const { data } = await octokit.rest.actions.downloadWorkflowRunLogs({
      owner,
      repo,
      run_id: runId,
    });
    return data;
  } catch (error) {
    core.debug(`Could not download workflow run logs: ${error.message}`);
    return null;
  }
}

async function collectLogs(token, directLogs = null) {
  if (directLogs && directLogs.trim()) {
    core.info('Using directly provided logs');
    return directLogs;
  }

  const context = github.context;

  const runId = context.payload.workflow_run?.id || context.runId;

  if (!runId) {
    core.warning('No workflow run context available');
    return null;
  }

  const octokit = github.getOctokit(token);
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  core.info(`Collecting logs for run ${runId} in ${owner}/${repo}`);

  try {
    const completedJobLogs = await getFailedJobLogs(octokit, owner, repo, runId);
    if (completedJobLogs) {
      return completedJobLogs;
    }

    const currentJobInfo = await getCurrentJobInfo(octokit, owner, repo, runId);
    if (currentJobInfo && currentJobInfo.failedSteps.length > 0) {
      core.info(`Found ${currentJobInfo.failedSteps.length} failed step(s) in current job`);

      const stepInfo = currentJobInfo.failedSteps.map(step =>
        `Step "${step.name}" failed (conclusion: ${step.conclusion})`
      ).join('\n');

      core.warning(
        'Cannot download logs for in-progress job. ' +
        'For better analysis, use the workflow_run trigger or provide logs directly via the "logs" input.'
      );

      return `Failed steps detected:\n${stepInfo}\n\n` +
        `Note: Full logs are not available for in-progress jobs. ` +
        `Consider using workflow_run trigger for complete log analysis.`;
    }

    core.warning('No failed job logs found');
    return null;
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
  getWorkflowRunInfo,
  getCurrentJobInfo
};
