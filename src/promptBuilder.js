const SYSTEM_PROMPT = `You are an expert CI/CD debugging assistant. Analyze the provided GitHub Actions logs and identify the root cause of the failure.

Your response must be a valid JSON object with this exact structure:
{
  "rootCause": "Brief description of what caused the failure",
  "keyError": "The exact error message or most relevant error line",
  "explanation": "A short, practical explanation of why this happened",
  "suggestedFix": "Specific command or code change to fix the issue",
  "confidence": 85
}

Rules:
- Keep all text short and practical
- rootCause should be 1-2 sentences max
- keyError should be the actual error text from the logs
- explanation should be 2-3 sentences max
- suggestedFix should be actionable (command, code snippet, or specific instruction)
- confidence must be an integer from 0 to 100
- Do not use markdown formatting inside the JSON values
- Respond ONLY with the JSON object, no other text`;

function buildPrompt(cleanedLogs, workflowInfo = null) {
  let userPrompt = 'Analyze these GitHub Actions logs and identify the root cause of the failure:\n\n';

  if (workflowInfo) {
    userPrompt += `Workflow: ${workflowInfo.name}\n`;
    userPrompt += `Event: ${workflowInfo.event}\n`;
    userPrompt += `Branch: ${workflowInfo.branch}\n`;
    userPrompt += `Commit: ${workflowInfo.sha}\n\n`;
  }

  userPrompt += '```\n' + cleanedLogs + '\n```';

  return {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt
  };
}

module.exports = {
  buildPrompt,
  SYSTEM_PROMPT
};
