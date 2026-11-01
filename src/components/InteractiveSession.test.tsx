import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InteractiveSession } from './InteractiveSession';
import { Message } from '../types';

// Mock useAppContext
vi.mock('../contexts/AppContext', () => ({
  useAppContext: () => ({
    mode: 'student',
    activeTheme: {
      borderDouble: 'border-cyan-350',
      borderSingle: 'border-cyan-900',
      accentBtn: 'bg-cyan-500',
      textPrimary: 'text-cyan-400',
    },
    selectedRole: {
      id: 'interviewer',
      name: 'Tech Recruiter',
      description: 'Job interview roleplay',
      imageUrl: '',
      voice: 'Puck'
    },
    isPremium: true,
    selectedTopic: {
      id: 'job_interview',
      title: 'Job Interview',
      description: 'Practice answering interview questions',
      grammar: 'Past and Present Perfect',
      vocabulary: ['experience', 'strengths', 'weaknesses'],
      goals: ['Introduce yourself', 'Highlight achievements']
    },
    selectedGrammarTopic: null,
    showDialogue: false,
    setShowDialogue: vi.fn(),
  })
}));

describe('InteractiveSession Component', () => {
  it('renders successfully with typed Message array and handles message submission', () => {
    const mockMessages: Message[] = [
      { role: 'model', text: 'Hello! Tell me about yourself.' }
    ];
    const setElevenMessages = vi.fn();
    const handleElevenMessage = vi.fn();
    const setTextInput = vi.fn();

    render(
      <InteractiveSession
        isSessionConnected={true}
        isSessionConnecting={false}
        handleStart={vi.fn()}
        handleStop={vi.fn()}
        handleRestart={vi.fn()}
        elevenLabsMode={true}
        setElevenLabsMode={vi.fn()}
        elevenMessages={mockMessages}
        setElevenMessages={setElevenMessages}
        elevenWarning={null}
        activeUserTranscript="My active transcript"
        activeAiTranscript="Hello! Tell me about yourself."
        error={null}
        isRecording={false}
        startVoiceInput={vi.fn()}
        stopVoiceInput={vi.fn()}
        textInput="I have 5 years of software engineering experience."
        setTextInput={setTextInput}
        handleElevenMessage={handleElevenMessage}
        sendTextMessage={vi.fn()}
        hasMicrophone={true}
        showFeedback={false}
        setShowFeedback={vi.fn()}
        isGeneratingFeedback={false}
        aiFeedbackReport={null}
        ratingAI={0}
        setRatingAI={vi.fn()}
        ratingTopic={0}
        setRatingTopic={vi.fn()}
        feedbackText=""
        setFeedbackText={vi.fn()}
        handleSubmitFeedback={vi.fn()}
      />
    );

    // Verify channel open and transcript display
    expect(screen.getByText('Channel Open')).toBeDefined();
    expect(screen.getByText('ElevenLabs Neural Active')).toBeDefined();
    expect(screen.getByText('"Hello! Tell me about yourself."')).toBeDefined();

    // Verify form submission in elevenLabsMode
    const input = screen.getByPlaceholderText('Type a message or use voice...');
    const form = input.closest('form');
    expect(form).toBeDefined();

    if (form) {
      fireEvent.submit(form);
      expect(handleElevenMessage).toHaveBeenCalledWith('I have 5 years of software engineering experience.');
      expect(setElevenMessages).toHaveBeenCalledTimes(1);

      // Verify the updater passed to setElevenMessages accepts previous Message[]
      const updater = setElevenMessages.mock.calls[0][0];
      const nextMessages = updater(mockMessages);
      expect(nextMessages).toEqual([
        { role: 'model', text: 'Hello! Tell me about yourself.' },
        { role: 'user', text: 'I have 5 years of software engineering experience.' }
      ]);
      expect(setTextInput).toHaveBeenCalledWith('');
    }
  });
});
