import { useState, useMemo, useRef, useCallback } from 'react';
import { useLiveAPI } from '../useLiveAPI';
import { playStart, playClick } from '../utils/audio';

const ELEVENLABS_VOICES: Record<string, string> = {
  "Puck": "21m00Tcm4TlvDq8ikWAM",      // Rachel
  "Zephyr": "29vD33N1CtxCmqQRPOHJ",    // Drew
  "Charon": "2EiwXtPIg78QI4pfI8yw",    // Clyde
  "Fenrir": "TX38kiF68H5Ztx86Xmby",    // Mitch
  "Kore": "EXAVITg3911n7EtC453S",      // Bella
  "Aoede": "AZnzlk1XvdvUeBnXmlld",     // Dom
};

export const useSession = (
  mode: string,
  selectedRole: any,
  studentName: string,
  selectedTopic: any,
  selectedGrammarTopic: any,
  dailyChallenge: any
) => {
  const [elevenLabsMode, setElevenLabsMode] = useState(false);
  const [elevenLabsConnected, setElevenLabsConnected] = useState(false);
  const [elevenLabsLoading, setElevenLabsLoading] = useState(false);
  const [elevenMessages, setElevenMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [elevenWarning, setElevenWarning] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");

  const [showFeedback, setShowFeedback] = useState(false);
  const [ratingAI, setRatingAI] = useState(0);
  const [ratingTopic, setRatingTopic] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [sessionTime, setSessionTime] = useState(180);
  const [aiFeedbackReport, setAiFeedbackReport] = useState<string | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  const { isConnected, isConnecting, error, connect, disconnect, userTranscript, aiTranscript, requestFeedback, hasMicrophone, sendTextMessage } = useLiveAPI();

  const isSessionConnected = isConnected || elevenLabsConnected;
  const isSessionConnecting = isConnecting || elevenLabsLoading;

  const activeUserTranscript = useMemo(() => {
    if (elevenLabsMode) {
      const lastUser = elevenMessages.findLast(m => m.role === 'user');
      return lastUser ? lastUser.text : '';
    }
    return userTranscript;
  }, [userTranscript, elevenLabsMode, elevenMessages]);

  const activeAiTranscript = useMemo(() => {
    if (elevenLabsMode) {
      const lastAi = elevenMessages.findLast(m => m.role === 'model');
      return lastAi ? lastAi.text : '';
    }
    return aiTranscript;
  }, [aiTranscript, elevenLabsMode, elevenMessages]);

  const recognitionRef = useRef<any>(null);

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser doesn't support basic speech recognition. Please type instead.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setElevenMessages(prev => [...prev, { role: 'user', text: transcript }]);
        handleElevenMessage(transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleElevenMessage = async (text: string) => {
    if (!text.trim()) return;
    try {
      setElevenLabsLoading(true);
      const introPrompt = `You are playing the role of ${selectedRole.name}. ${selectedRole.description}. The user is the student ${studentName}. Have a conversation with them and naturally encourage them to win. Maintain this character deeply. Keep your responses short, natural, and friendly (1-2 sentences).`;

      const response = await fetch("/api/chat-roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_input: text,
          persona_prompt: introPrompt,
          voice_id: ELEVENLABS_VOICES[selectedRole.voice] || "21m00Tcm4TlvDq8ikWAM"
        })
      });

      const responseTextHeader = response.headers.get("x-response-text");
      const spokenText = responseTextHeader ? decodeURIComponent(responseTextHeader) : "";

      const isMissingKey = response.headers.get("x-elevenlabs-missing") === "true";
      const isError = response.headers.get("x-elevenlabs-error") === "true";

      let finalMsg = spokenText;

      if (isMissingKey || isError) {
        const data = await response.json();
        finalMsg = data.text || spokenText;
        if (isMissingKey) {
          setElevenWarning("Neural Voice fallback: Please configure ELEVEN_API_KEY to hear realistic characters.");
        }

        const synth = window.speechSynthesis;
        if (synth) {
          const utterance = new SpeechSynthesisUtterance(finalMsg);
          utterance.lang = "en-US";
          synth.speak(utterance);
        }
      } else {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
      }

      setElevenMessages(prev => [...prev, { role: 'model', text: finalMsg }]);
    } catch (e: any) {
      console.error(e);
    } finally {
      setElevenLabsLoading(false);
    }
  };

  const triggerAIFeedback = async (historyData: any[]) => {
    setIsGeneratingFeedback(true);
    setAiFeedbackReport(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: historyData,
          student_name: studentName,
          topic_title: (mode === 'student' || mode === 'beginner') ? selectedTopic.title : selectedGrammarTopic.title,
          grammar: (mode === 'student' || mode === 'beginner') ? selectedTopic.grammar : selectedGrammarTopic.grammar,
          vocabulary: (mode === 'student' || mode === 'beginner') ? selectedTopic.vocabulary : selectedGrammarTopic.vocabulary
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact feedback server.");
      }

      const data = await response.json();
      setAiFeedbackReport(data.feedback || "Unable to compile diagnostics report.");
    } catch (e: any) {
      console.error("AI feedback generation error:", e);
      setAiFeedbackReport("Failed to generate constructive report. Please ensure your GEMINI_API_KEY is configured.");
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleStart = async () => {
    if (mode === 'exercises') return;
    if (elevenLabsMode) {
      playStart();
      setElevenLabsConnected(true);
      setElevenLabsLoading(true);
      setElevenMessages([]);
      setElevenWarning(null);

      try {
        const introPrompt = `You are playing the role of ${selectedRole.name}. ${selectedRole.description}. Greet the student named ${studentName} very warmly inside your character context, introducing yourself in exactly 1-2 short sentences.`;

        const response = await fetch("/api/chat-roleplay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_input: "Hi! Greet me to begin our conversation.",
            persona_prompt: introPrompt,
            voice_id: ELEVENLABS_VOICES[selectedRole.voice] || "21m00Tcm4TlvDq8ikWAM"
          })
        });

        const responseTextHeader = response.headers.get("x-response-text");
        const spokenText = responseTextHeader ? decodeURIComponent(responseTextHeader) : "";

        const isMissingKey = response.headers.get("x-elevenlabs-missing") === "true";
        const isError = response.headers.get("x-elevenlabs-error") === "true";

        let finalMsg = spokenText;

        if (isMissingKey || isError) {
          const data = await response.json();
          finalMsg = data.text || spokenText;
          if (isMissingKey) {
            setElevenWarning("Neural Voice fallback: Please configure ELEVEN_API_KEY in server secrets to hear realistic characters.");
          }

          const synth = window.speechSynthesis;
          if (synth) {
            const utterance = new SpeechSynthesisUtterance(finalMsg);
            utterance.lang = "en-US";
            synth.speak(utterance);
          }
        } else {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          await audio.play();
        }

        setElevenMessages([{ role: 'model', text: finalMsg }]);
      } catch (e: any) {
        console.error(e);
        setElevenWarning("Failed to initialize modern neural roleplay. Standard speech fallback active.");
      } finally {
        setElevenLabsLoading(false);
      }
      return;
    }

    playStart();
    connect(
      studentName,
      (mode === 'student' || mode === 'beginner') ? selectedRole : null,
      (mode === 'student' || mode === 'beginner') ? selectedTopic : selectedGrammarTopic,
      (mode === 'beginner' ? 'student' : mode) as 'student' | 'teacher',
      dailyChallenge
    );
  };

  const handleStop = () => {
    playClick();

    const historyData = elevenLabsMode
      ? [...elevenMessages]
      : [
          ...(userTranscript ? [{ role: 'user', text: userTranscript }] : []),
          ...(aiTranscript ? [{ role: 'model', text: aiTranscript }] : [])
        ];

    if (elevenLabsMode) {
      setElevenLabsConnected(false);
    } else {
      disconnect();
    }

    setShowFeedback(true);

    if (historyData.length > 0) {
      triggerAIFeedback(historyData);
    } else {
      setAiFeedbackReport("No conversation turns occurred. Please speak or type to practice with your AI partner before generating feedback!");
    }
  };

  const handleRestart = () => {
    if (mode === 'exercises') return;
    if (elevenLabsMode) {
      handleStart();
      return;
    }
    playStart();
    disconnect();
    setTimeout(() => {
      connect(
        studentName,
        (mode === 'student' || mode === 'beginner') ? selectedRole : null,
        (mode === 'student' || mode === 'beginner') ? selectedTopic : selectedGrammarTopic,
        (mode === 'beginner' ? 'student' : mode) as 'student' | 'teacher',
        dailyChallenge
      );
    }, 500);
  };

  const handleSubmitFeedback = () => {
    const feedback = {
      date: new Date().toISOString(),
      student: mode === 'teacher' ? 'Joshimar (Teacher)' : studentName,
      role: selectedRole.name,
      topic: (mode === 'student' || mode === 'beginner') ? selectedTopic.title : selectedGrammarTopic.title,
      ratingAI,
      ratingTopic,
      comments: feedbackText,
      aiReport: aiFeedbackReport
    };

    const existing = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
    localStorage.setItem('linguaRole_feedback', JSON.stringify([...existing, feedback]));

    setShowFeedback(false);
    setRatingAI(0);
    setRatingTopic(0);
    setFeedbackText("");
    setAiFeedbackReport(null);
  };

  const handleElevenGetFeedback = async () => {
    if (elevenMessages.length === 0) return;

    setIsGeneratingFeedback(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: elevenMessages,
          student_name: studentName,
          topic_title: (mode === 'student' || mode === 'beginner') ? selectedTopic.title : selectedGrammarTopic.title,
          grammar: (mode === 'student' || mode === 'beginner') ? selectedTopic.grammar : selectedGrammarTopic.grammar,
          vocabulary: (mode === 'student' || mode === 'beginner') ? selectedTopic.vocabulary : selectedGrammarTopic.vocabulary
        })
      });

      if (!response.ok) throw new Error("Feedback fetch failed");

      const data = await response.json();
      const feedbackReport = data.feedback || "Unable to compile diagnostics report.";

      setAiFeedbackReport(feedbackReport);
      setShowFeedback(true);
    } catch (e: any) {
      console.error(e);
      setAiFeedbackReport("Failed to generate report.");
      setShowFeedback(true);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  return {
    elevenLabsMode, setElevenLabsMode,
    elevenLabsConnected, setElevenLabsConnected,
    elevenLabsLoading, setElevenLabsLoading,
    elevenMessages, setElevenMessages,
    isRecording, setIsRecording,
    elevenWarning, setElevenWarning,
    textInput, setTextInput,

    showFeedback, setShowFeedback,
    ratingAI, setRatingAI,
    ratingTopic, setRatingTopic,
    feedbackText, setFeedbackText,
    sessionTime, setSessionTime,
    aiFeedbackReport, setAiFeedbackReport,
    isGeneratingFeedback, setIsGeneratingFeedback,

    isSessionConnected, isSessionConnecting,
    activeUserTranscript, activeAiTranscript,
    error, hasMicrophone, sendTextMessage, requestFeedback,

    startVoiceInput, stopVoiceInput, handleElevenMessage,
    handleStart, handleStop, handleRestart, handleSubmitFeedback, handleElevenGetFeedback,
    triggerAIFeedback
  };
};
