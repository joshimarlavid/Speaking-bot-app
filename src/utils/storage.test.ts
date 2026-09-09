import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeGetFeedbackLogs } from './storage';

describe('safeGetFeedbackLogs', () => {
  let getItemSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Mock localStorage.getItem safely via Storage.prototype
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    // Mock console.error to avoid cluttering test output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed array when localStorage contains valid JSON', () => {
    const mockData = [{ id: 1, text: 'test feedback' }];
    getItemSpy.mockReturnValue(JSON.stringify(mockData));

    const result = safeGetFeedbackLogs();

    expect(getItemSpy).toHaveBeenCalledWith('linguaRole_feedback');
    expect(result).toEqual(mockData);
  });

  it('returns an empty array when localStorage returns null', () => {
    getItemSpy.mockReturnValue(null);

    const result = safeGetFeedbackLogs();

    expect(getItemSpy).toHaveBeenCalledWith('linguaRole_feedback');
    expect(result).toEqual([]);
  });

  it('returns an empty array and logs an error when localStorage contains invalid JSON', () => {
    getItemSpy.mockReturnValue('invalid-json{');

    const result = safeGetFeedbackLogs();

    expect(getItemSpy).toHaveBeenCalledWith('linguaRole_feedback');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Failed to parse feedback logs from localStorage');
    expect(result).toEqual([]);
  });

  it('returns an empty array and logs an error when localStorage.getItem throws an exception', () => {
    const mockError = new Error('Storage access denied');
    getItemSpy.mockImplementation(() => {
      throw mockError;
    });

    const result = safeGetFeedbackLogs();

    expect(getItemSpy).toHaveBeenCalledWith('linguaRole_feedback');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Failed to parse feedback logs from localStorage');
    expect(result).toEqual([]);
  });
});
