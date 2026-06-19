# Logytics

AI-powered GitHub Actions failure analysis. Get instant, developer-friendly explanations for CI failures without reading through long logs.

## Features

- Automatically analyzes failed GitHub Actions workflows
- Uses AI to identify root causes and suggest fixes
- Outputs clean summaries directly in GitHub Actions Summary
- Zero UI, zero database, zero accounts
- Single-line installation

## Quick Start

Add Logytics to your workflow:

```yaml
- uses: logytics/action@v1
  if: failure()
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

That's it! When a step fails, Logytics will analyze the logs and provide an explanation in the workflow summary.

## Example Output

When a step fails with an error like `Cannot find module 'redis'`, Logytics generates:

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
| `model` | OpenAI model to use | No | `gpt-4o-mini` |
| `max-log-lines` | Maximum log lines to analyze | No | `500` |
| `github-token` | GitHub token for API access | No | `${{ github.token }}` |

## Outputs

| Output | Description |
|--------|-------------|
| `root-cause` | Root cause of the failure |
| `suggested-fix` | Suggested fix for the failure |
| `confidence` | AI confidence score (0-100) |

## Full Workflow Example

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

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

      - name: Run tests
        run: npm test

      - name: Logytics Analysis
        uses: logytics/action@v1
        if: failure()
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

## How It Works

1. **Detect Failure**: Logytics runs only when a previous step fails (`if: failure()`)
2. **Collect Logs**: Extracts logs from failed steps using the GitHub API
3. **Clean Logs**: Removes noise (ANSI codes, progress bars, debug output) while keeping errors and stack traces
4. **AI Analysis**: Sends cleaned logs to OpenAI for analysis
5. **Generate Summary**: Writes a formatted summary to GitHub Actions Summary

## Privacy & Security

- Logs are sent to OpenAI for analysis
- Use your own OpenAI API key
- No data is stored or collected by Logytics
- Recommended: use with private repositories cautiously

## Using with Self-Hosted Runners

Logytics works with self-hosted runners. Ensure your runner has:

- Node.js 20 or later
- Network access to `api.openai.com`
- Network access to `api.github.com`

## Cost Considerations

Logytics uses OpenAI's API which has associated costs:

- Default model: `gpt-4o-mini` (most cost-effective)
- Typical analysis: ~500-2000 tokens
- Estimated cost: $0.001-0.005 per analysis

## Development

```bash
# Install dependencies
npm install

# Build the action
npm run build

# Run tests
npm test
```

## License

MIT
