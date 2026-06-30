import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InteractiveFlashcards } from '../InteractiveFlashcards';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('InteractiveFlashcards', () => {
  const mockPlayClick = vi.fn();
  const mockPlayReward = vi.fn();

  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve({
      json: () => Promise.resolve({
        vocab: "aisle",
        definitionEn: "a passage between rows of seats in a building such as a church or theatre, an aircraft, or train.",
        definitionEs: "pasillo",
        ipa: "/aɪl/",
        partOfSpeech: "noun",
        exampleEn: "She walked down the aisle.",
        exampleEs: "Ella caminó por el pasillo.",
        syllables: "aisle",
        tips: ""
      })
    })) as any;
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderComponent = () => {
    return render(
      <InteractiveFlashcards
        theme={{
          primary: 'blue',
          textPrimary: 'text-cyan-400',
          textLight: 'text-cyan-100',
          textMedium: 'text-cyan-200',
          textMuted: 'text-cyan-300/60',
          badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          borderDouble: 'border-cyan-300/40',
          borderSingle: 'border-cyan-900/40',
          accentBtn: 'bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold',
          accentBtnDisabled: 'disabled:bg-cyan-950/50 disabled:text-cyan-300/40',
          shadowGlow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]',
          glowHex: '#22d3ee',
          bgGradient: 'from-cyan-950/30 via-blue-950/70 to-black/98',
          glowClass: 'hover:shadow-[0_0_35px_rgba(34,211,238,0.35)]',
          activeIconColor: 'text-cyan-400',
          svgPrimary: '#22d3ee',
          svgSecondary: '#06b6d4'
        }}
        playClick={mockPlayClick}
        playReward={mockPlayReward}
      />
    );
  };

  it('renders the first word of the default deck and image', async () => {
    renderComponent();

    // Wait for data to load and spinner to disappear
    await waitFor(() => {
      expect(screen.queryByText(/Whispering Runes.../i)).not.toBeInTheDocument();
    });

    const image = document.querySelector("img") as HTMLImageElement;
    expect(image).not.toBeNull();
    expect(image).toBeInTheDocument();

    expect(screen.getByText(/CLICK CARD TO ROTATE AND VIEW DETAILS/i)).toBeInTheDocument();
  });

  it('reveals the card back when clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Whispering Runes.../i)).not.toBeInTheDocument();
    });

    const wordText = screen.getByText(/Word 1 of/i);
    const clickArea = wordText.closest('div.glass-panel');
    if (clickArea) {
      fireEvent.click(clickArea);
    }

    expect(mockPlayClick).toHaveBeenCalled();
    expect(screen.queryByText(/Meaning & Usage/i)).toBeInTheDocument();
  });

  it('navigates to the next word', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Whispering Runes.../i)).not.toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /next/i }) || document.querySelector('.lucide-chevron-right')?.closest('button');
    if (nextButton) {
      fireEvent.click(nextButton);
    }

    expect(mockPlayClick).toHaveBeenCalled();
    expect(screen.getByText(/Word 2 of/i)).toBeInTheDocument();
  });

  it('navigates to the previous word', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Whispering Runes.../i)).not.toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /next/i }) || document.querySelector('.lucide-chevron-right')?.closest('button');
    if (nextButton) {
      fireEvent.click(nextButton);
    }

    const prevButton = screen.getByRole('button', { name: /prev/i }) || document.querySelector('.lucide-chevron-left')?.closest('button');
    if (prevButton) {
      fireEvent.click(prevButton);
    }

    expect(screen.getByText(/Word 1 of/i)).toBeInTheDocument();
  });

  it('renders images using placeholder with word seed', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Whispering Runes.../i)).not.toBeInTheDocument();
    });

    const image = document.querySelector("img") as HTMLImageElement;
    expect(image).not.toBeNull();
    expect(image.src).toMatch(/picsum\.photos\/seed\/.*\/400\/200/);
  });
});
