import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePDFSummary } from './pdfGenerator';
import { jsPDF } from 'jspdf';

const mockDoc = {
  setFillColor: vi.fn(),
  rect: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  setTextColor: vi.fn(),
  setFont: vi.fn(),
  setFontSize: vi.fn(),
  text: vi.fn(),
  line: vi.fn(),
  roundedRect: vi.fn(),
  splitTextToSize: vi.fn().mockReturnValue(['mock text']),
  addPage: vi.fn(),
  save: vi.fn(),
};

// Mock jsPDF class completely
vi.mock('jspdf', () => {
  return {
    jsPDF: vi.fn(function() {
      return mockDoc;
    })
  };
});

vi.mock('./audio', () => ({
  playReward: vi.fn(),
}));

describe('generatePDFSummary', () => {
  let mockAlert: any;
  let mockConsoleError: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAlert = vi.fn();
    vi.stubGlobal('alert', mockAlert);
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should handle errors during PDF generation, logging the error and alerting the user', () => {
    // Force jsPDF constructor to throw an error for this test
    vi.mocked(jsPDF).mockImplementationOnce(function() {
      throw new Error('Mock PDF Error');
    } as any);

    generatePDFSummary('Test Student', 5, 2, []);

    expect(mockConsoleError).toHaveBeenCalledWith('Failed to generate PDF', expect.any(Error));
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith('Could not generate PDF. Please ensure popups are allowed.');
    expect(mockAlert).toHaveBeenCalledTimes(1);
  });

  it('should generate PDF successfully', () => {
     generatePDFSummary('Test Student', 5, 2, []);

     expect(mockDoc.save).toHaveBeenCalledWith('LinguaRole_Grimoire_Test_Student.pdf');
  });
});
