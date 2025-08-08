import { describe, it, expect } from 'vitest';
import { textResponse, jsonResponse, handleError } from '../../src/core/responses';

describe('responses', () => {
  describe('textResponse', () => {
    it('should return text content in MCP format', () => {
      const result = textResponse('Hello World');
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Hello World' }]
      });
    });

    it('should handle empty strings', () => {
      const result = textResponse('');
      expect(result).toEqual({
        content: [{ type: 'text', text: '' }]
      });
    });
  });

  describe('jsonResponse', () => {
    it('should return JSON content in MCP format', () => {
      const data = { foo: 'bar', num: 42 };
      const result = jsonResponse(data);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(data);
    });

    it('should handle BigInt values', () => {
      const data = { value: BigInt(12345678901234567890n) };
      const result = jsonResponse(data);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.value).toBe('12345678901234567890');
    });

    it('should format JSON with indentation', () => {
      const data = { nested: { value: 1 } };
      const result = jsonResponse(data);
      expect(result.content[0].text).toContain('\n');
      expect(result.content[0].text).toContain('  ');
    });
  });

  describe('handleError', () => {
    it('should handle Error instances', () => {
      const error = new Error('Test error message');
      const result = handleError(error);
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Test error message' }]
      });
    });

    it('should handle string errors', () => {
      const result = handleError('String error');
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: String error' }]
      });
    });

    it('should handle unknown error types', () => {
      const result = handleError({ custom: 'error' });
      expect(result.content[0].text).toContain('Error:');
      expect(result.content[0].text).toContain('[object Object]');
    });

    it('should handle null/undefined errors', () => {
      const resultNull = handleError(null);
      expect(resultNull.content[0].text).toBe('Error: null');
      
      const resultUndefined = handleError(undefined);
      expect(resultUndefined.content[0].text).toBe('Error: undefined');
    });
  });
});