# Logytics

AI-powered GitHub Actions failure analysis. Get instant, developer-friendly explanations for CI failures without reading through long logs.

## Features

- Automatically analyzes failed GitHub Actions workflows
- Uses AI to identify root causes and suggest fixes
- Outputs clean summaries directly in GitHub Actions Summary
- Zero UI, zero database, zero accounts

## Quick Start

There are two ways to use Logytics:

### Option 1: Inline Log Capture (Recommended)

Capture output from your steps and pass to Logytics:

```yaml
- name: Run tests
  id: tests
  run: npm test 2>&1 | tee output.txt
  continue-on-error: true

- name: Logytics Analysis
  if: steps.tests.outcome == 'failure'
  uses: logytics/action@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    logs: $(cat output.txt)

- name: Fail if tests failed
  if: steps.tests.outcome == 'failure'
  run: exit 1
```

### Option 2: Workflow Run Trigger

Create a separate workflow that triggers after your CI fails:

```yaml
# .github/workflows/logytics.yml
name: Logytics Analysis

on:
  workflow_run:
    workflows: ["CI"]  # Your main workflow name
    types: [completed]

jobs:
  analyze:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    steps:
      - uses: logytics/action@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

This approach has full access to completed job logs via the GitHub API.

## Example Output

When a step fails with `Cannot find module 'redis'`, Logytics generates:

### Logytics Analysis

#### Root Cause
Missing dependency: `redis` is not installed in the project

#### Key Error
```
Error: Cannot find module 'redis'
```

#### Explanation
The code is importing the Redis package, but it has not been installed in the project dependencies.

#### Suggested Fix
```bash
npm install redis
```

#### Confidence
🟢 **92%**

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `openai-api-key` | OpenAI API key for AI analysis | Yes | - |
| `logs` | Log content to analyze (for inline capture) | No | - |
| `model` | OpenAI model to use | No | `gpt-4o-mini` |
| `max-log-lines` | Maximum log lines to analyze | No | `500` |
| `github-token` | GitHub token for API access | No | `${{ github.token }}` |

## Outputs

| Output | Description |
|--------|-------------|
| `root-cause` | Root cause of the failure |
| `suggested-fix` | Suggested fix for the failure |
| `confidence` | AI confidence score (0-100) |

## Full Example with Multiple Steps

```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        id: lint
        run: npm run lint 2>&1 | tee lint.txt
        continue-on-error: true

      - name: Run tests
        id: test
        run: npm test 2>&1 | tee test.txt
        continue-on-error: true

      - name: Collect failed logs
        if: failure() || steps.lint.outcome == 'failure' || steps.test.outcome == 'failure'
        run: |
          echo "LOGS<<EOF" >> $GITHUB_ENV
          [ "${{ steps.lint.outcome }}" == "failure" ] && echo "=== Lint ===" && cat lint.txt
          [ "${{ steps.test.outcome }}" == "failure" ] && echo "=== Test ===" && cat test.txt
          echo "EOF" >> $GITHUB_ENV

      - name: Logytics Analysis
        if: failure() || steps.lint.outcome == 'failure' || steps.test.outcome == 'failure'
        uses: logytics/action@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          logs: ${{ env.LOGS }}

      - name: Fail workflow
        if: steps.lint.outcome == 'failure' || steps.test.outcome == 'failure'
        run: exit 1
```

## How It Works

1. **Collect Logs**: Captures output from failed steps (inline or via API)
2. **Clean Logs**: Removes noise (ANSI codes, progress bars, debug output)
3. **AI Analysis**: Sends cleaned logs to OpenAI for analysis
4. **Generate Summary**: Writes a formatted summary to GitHub Actions Summary

## Privacy & Security

- Logs are sent to OpenAI for analysis
- Use your own OpenAI API key
- No data is stored or collected by Logytics
- Be cautious with sensitive data in logs

## Cost Considerations

- Default model: `gpt-4o-mini` (most cost-effective)
- Typical analysis: ~500-2000 tokens
- Estimated cost: $0.001-0.005 per analysis

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
