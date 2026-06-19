const { test, describe } = require('node:test');
const assert = require('node:assert');
const { stripAnsi, truncateToTokenLimit, parseJsonSafe } = require('../src/utils');

describe('utils', () => {
  describe('stripAnsi', () => {
    test('removes color codes', () => {
      const input = '\x1B[31mRed text\x1B[0m';
      assert.strictEqual(stripAnsi(input), 'Red text');
    });

    test('removes bold codes', () => {
      const input = '\x1B[1mBold text\x1B[22m';
      assert.strictEqual(stripAnsi(input), 'Bold text');
    });

    test('handles multiple codes', () => {
      const input = '\x1B[31m\x1B[1mRed bold\x1B[0m normal';
      assert.strictEqual(stripAnsi(input), 'Red bold normal');
    });

    test('returns plain text unchanged', () => {
      const input = 'Just plain text';
      assert.strictEqual(stripAnsi(input), 'Just plain text');
    });
  });

  describe('truncateToTokenLimit', () => {
    test('keeps short text unchanged', () => {
      const input = 'Short text';
      assert.strictEqual(truncateToTokenLimit(input, 100), input);
    });

    test('truncates long text', () => {
      const input = 'a'.repeat(1000);
      const result = truncateToTokenLimit(input, 50);
      assert.ok(result.length < 1000);
      assert.ok(result.includes('[... truncated'));
    });
  });

  describe('parseJsonSafe', () => {
    test('parses valid JSON', () => {
      const input = '{"key": "value"}';
      const result = parseJsonSafe(input);
      assert.deepStrictEqual(result, { key: 'value' });
    });

    test('extracts JSON from surrounding text', () => {
      const input = 'Here is the result: {"rootCause": "test"} End of message';
      const result = parseJsonSafe(input);
      assert.deepStrictEqual(result, { rootCause: 'test' });
    });

    test('returns null for invalid JSON', () => {
      const input = 'Not JSON at all';
      assert.strictEqual(parseJsonSafe(input), null);
    });

    test('returns null for malformed JSON', () => {
      const input = '{"key": value}';
      assert.strictEqual(parseJsonSafe(input), null);
    });
  });
});
