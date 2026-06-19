const { test, describe } = require('node:test');
const assert = require('node:assert');
const { cleanLogs, isNoiseLine, isImportantLine } = require('../src/logCleaner');

describe('logCleaner', () => {
  describe('isNoiseLine', () => {
    test('identifies debug lines as noise', () => {
      assert.strictEqual(isNoiseLine('##[debug]Some debug info'), true);
    });

    test('identifies group markers as noise', () => {
      assert.strictEqual(isNoiseLine('##[group]Running tests'), true);
      assert.strictEqual(isNoiseLine('##[endgroup]'), true);
    });

    test('identifies empty lines as noise', () => {
      assert.strictEqual(isNoiseLine('   '), true);
      assert.strictEqual(isNoiseLine(''), true);
    });

    test('identifies download progress as noise', () => {
      assert.strictEqual(isNoiseLine('Downloading artifact...'), true);
    });

    test('keeps regular log lines', () => {
      assert.strictEqual(isNoiseLine('Running npm test'), false);
    });
  });

  describe('isImportantLine', () => {
    test('identifies error lines', () => {
      assert.strictEqual(isImportantLine('Error: Cannot find module'), true);
      assert.strictEqual(isImportantLine('FATAL ERROR'), true);
    });

    test('identifies stack traces', () => {
      assert.strictEqual(isImportantLine('    at Object.<anonymous> (/app/index.js:10:5)'), true);
    });

    test('identifies failure messages', () => {
      assert.strictEqual(isImportantLine('Test failed: expected true'), true);
    });

    test('does not flag normal lines', () => {
      assert.strictEqual(isImportantLine('Starting build process'), false);
    });
  });

  describe('cleanLogs', () => {
    test('removes ANSI color codes', () => {
      const input = '\x1B[31mError: Something went wrong\x1B[0m';
      const result = cleanLogs(input);
      assert.ok(!result.includes('\x1B[31m'));
      assert.ok(result.includes('Error: Something went wrong'));
    });

    test('removes noise lines', () => {
      const input = '##[debug]Debug info\nActual error message\n##[endgroup]';
      const result = cleanLogs(input);
      assert.ok(!result.includes('##[debug]'));
      assert.ok(result.includes('Actual error message'));
    });

    test('deduplicates repeated lines', () => {
      const input = 'Error: fail\nError: fail\nError: fail';
      const result = cleanLogs(input);
      const matches = result.match(/Error: fail/g);
      assert.strictEqual(matches.length, 1);
    });

    test('respects max lines limit', () => {
      const lines = Array(100).fill('Line content').join('\n');
      const result = cleanLogs(lines, 10);
      const lineCount = result.split('\n').length;
      assert.ok(lineCount <= 10);
    });

    test('prioritizes important lines', () => {
      const input = 'Normal line 1\nNormal line 2\nError: critical failure\nNormal line 3';
      const result = cleanLogs(input, 2);
      assert.ok(result.includes('Error: critical failure'));
    });
  });
});
