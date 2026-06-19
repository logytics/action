const { test, describe } = require('node:test');
const assert = require('node:assert');
const { buildPrompt, SYSTEM_PROMPT } = require('../src/promptBuilder');

describe('promptBuilder', () => {
  describe('buildPrompt', () => {
    test('includes cleaned logs in user prompt', () => {
      const logs = 'Error: Test failed';
      const { userPrompt } = buildPrompt(logs);
      assert.ok(userPrompt.includes(logs));
    });

    test('includes workflow info when provided', () => {
      const logs = 'Error: Test failed';
      const workflowInfo = {
        name: 'CI',
        event: 'push',
        branch: 'main',
        sha: 'abc1234'
      };
      const { userPrompt } = buildPrompt(logs, workflowInfo);
      assert.ok(userPrompt.includes('Workflow: CI'));
      assert.ok(userPrompt.includes('Branch: main'));
      assert.ok(userPrompt.includes('Commit: abc1234'));
    });

    test('works without workflow info', () => {
      const logs = 'Error: Test failed';
      const { userPrompt, systemPrompt } = buildPrompt(logs);
      assert.ok(userPrompt.includes(logs));
      assert.ok(systemPrompt.length > 0);
    });

    test('system prompt includes JSON structure', () => {
      assert.ok(SYSTEM_PROMPT.includes('rootCause'));
      assert.ok(SYSTEM_PROMPT.includes('keyError'));
      assert.ok(SYSTEM_PROMPT.includes('suggestedFix'));
      assert.ok(SYSTEM_PROMPT.includes('confidence'));
    });

    test('system prompt specifies JSON-only response', () => {
      assert.ok(SYSTEM_PROMPT.includes('JSON'));
    });
  });
});
