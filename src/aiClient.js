const core = require('@actions/core');
const { parseJsonSafe, sleep } = require('./utils');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function callOpenAI(apiKey, model, systemPrompt, userPrompt) {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function analyzeWithRetry(apiKey, model, systemPrompt, userPrompt) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      core.info(`Calling OpenAI API (attempt ${attempt}/${MAX_RETRIES})`);

      const rawResponse = await callOpenAI(apiKey, model, systemPrompt, userPrompt);
      const parsed = parseJsonSafe(rawResponse);

      if (!parsed) {
        throw new Error('Failed to parse AI response as JSON');
      }

      if (!parsed.rootCause || !parsed.keyError || parsed.confidence === undefined) {
        throw new Error('AI response missing required fields');
      }

      parsed.confidence = Math.max(0, Math.min(100, Math.round(parsed.confidence)));

      return parsed;
    } catch (error) {
      lastError = error;
      core.warning(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError;
}

function createFallbackAnalysis(error) {
  return {
    rootCause: 'Unable to analyze logs automatically',
    keyError: error.message,
    explanation: 'The AI analysis failed. Please review the logs manually.',
    suggestedFix: 'Check the workflow logs directly for error details',
    confidence: 0
  };
}

module.exports = {
  analyzeWithRetry,
  createFallbackAnalysis,
  callOpenAI
};
