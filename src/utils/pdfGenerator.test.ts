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


  it('should generate PDF successfully with empty logs', () => {
    generatePDFSummary('Test Student', 5, 2, []);

    expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('No prophecies recorded yet. Begin your journey.'), expect.any(Number), expect.any(Number));
    expect(mockDoc.save).toHaveBeenCalledWith('LinguaRole_Grimoire_Test_Student.pdf');
  });

  it('should generate PDF successfully with some logs', () => {
    const logs = [
      { role: 'Mage', date: '2023-10-27T10:00:00Z', topic: 'Fireballs', ratingAI: 4, ratingTopic: 5, comments: 'Good form' },
      { role: 'Warrior', date: '2023-10-28T10:00:00Z', topic: 'Swords', ratingAI: 3, ratingTopic: 4, comments: 'Needs work' }
    ];
    generatePDFSummary('Test Student', 5, 2, logs);

    expect(mockDoc.roundedRect).toHaveBeenCalled();
    expect(mockDoc.text).toHaveBeenCalledWith('Mage', expect.any(Number), expect.any(Number));
    expect(mockDoc.text).toHaveBeenCalledWith('Warrior', expect.any(Number), expect.any(Number));
    expect(mockDoc.save).toHaveBeenCalledWith('LinguaRole_Grimoire_Test_Student.pdf');
  });

  it('should add a page when generating PDF with many logs', () => {
    const logs = [
      { role: 'Mage', date: '2023-10-27T10:00:00Z', topic: 'Fireballs', ratingAI: 4, ratingTopic: 5, comments: 'Good form' },
      { role: 'Warrior', date: '2023-10-28T10:00:00Z', topic: 'Swords', ratingAI: 3, ratingTopic: 4, comments: 'Needs work' },
      { role: 'Rogue', date: '2023-10-29T10:00:00Z', topic: 'Stealth', ratingAI: 5, ratingTopic: 5, comments: 'Excellent' }
    ];
    generatePDFSummary('Test Student', 5, 2, logs);

    // Initial yPos = 130
    // After 3 logs, yPos = 130 + 48 * 3 = 274
    // 274 > 240, so it should add a page
    expect(mockDoc.addPage).toHaveBeenCalled();
    expect(mockDoc.save).toHaveBeenCalledWith('LinguaRole_Grimoire_Test_Student.pdf');
  });
});
