import { useState, useRef, useCallback, useEffect } from 'react';
import type { Message, Role, Topic } from './types';

const SCENARIO_COMPLETE_MARKER = 'Scenario complete.';

// Resample continuously, including across processor buffer boundaries. The browser
// may ignore the requested AudioContext sample rate.
function createResampler(rate: number) {
  let pending = new Float32Array(0);
  let position = 0;
  return (input: Float32Array) => {
    const samples = new Float32Array(pending.length + input.length);
    samples.set(pending);
    samples.set(input, pending.length);
    const output: number[] = [];
    const step = rate / 16000;
    while (position + 1 < samples.length) {
      const index = Math.floor(position);
      const fraction = position - index;
      output.push(samples[index] * (1 - fraction) + samples[index + 1] * fraction);
      position += step;
    }
    const consumed = Math.min(Math.floor(position), samples.length);
    pending = samples.slice(consumed);
    position -= consumed;
    const bytes = new Uint8Array(output.length * 2);
    const view = new DataView(bytes.buffer);
    output.forEach((sample, index) => {
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(index * 2, clamped < 0 ? clamped * 32768 : clamped * 32767, true);
    });
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  };
}

export function useLiveAPI() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [aiTranscript, setAiTranscript] = useState<string>("");
  const [hasMicrophone, setHasMicrophone] = useState(true);
  const [scenarioComplete, setScenarioComplete] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const playbackSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const resumePromiseRef = useRef<Promise<void> | null>(null);
  const generationRef = useRef(0);
  const playbackGenerationRef = useRef(0);
  const transcriptRef = useRef<Message[]>([]);
  const turnOpenRef = useRef(false);
  const outputTranscriptionRef = useRef(false);
  const outputTurnRef = useRef('');

  const addTranscript = useCallback((role: Message['role'], text: string, separate = false) => {
    if (!text) return;
    const turns = transcriptRef.current;
    const last = turns[turns.length - 1];
    if (!separate && turnOpenRef.current && last?.role === role) last.text += text;
    else turns.push({ role, text });
    turnOpenRef.current = !separate;
    setUserTranscript(turns.filter(turn => turn.role === 'user').map(turn => turn.text).join(' '));
    setAiTranscript(turns.filter(turn => turn.role === 'model').map(turn => turn.text).join('\n'));
  }, []);

  const stopPlayback = useCallback(() => {
    playbackGenerationRef.current++;
    playbackSourcesRef.current.forEach(source => {
      source.onended = null;
      try { source.stop(); } catch { /* already stopped */ }
      try { source.disconnect(); } catch { /* already disconnected */ }
    });
    playbackSourcesRef.current.clear();
    nextPlayTimeRef.current = 0;
  }, []);

  const cleanupInput = useCallback(() => {
    if (processorRef.current) processorRef.current.onaudioprocess = null;
    for (const node of [processorRef.current, inputSourceRef.current, gainRef.current]) {
      try { node?.disconnect(); } catch { /* already disconnected */ }
    }
    processorRef.current = null;
    inputSourceRef.current = null;
    gainRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    const context = inputAudioContextRef.current;
    inputAudioContextRef.current = null;
    if (context) { try { void context.close().catch(() => {}); } catch { /* already closed */ } }
  }, []);

  const disconnect = useCallback(() => {
    generationRef.current++;
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
      } catch { /* already closed */ }
    }
    cleanupInput();
    stopPlayback();
    const context = outputAudioContextRef.current;
    outputAudioContextRef.current = null;
    resumePromiseRef.current = null;
    if (context) { try { void context.close().catch(() => {}); } catch { /* already closed */ } }
    setIsConnected(false);
    setIsConnecting(false);
  }, [cleanupInput, stopPlayback]);

  useEffect(() => () => { disconnect(); }, [disconnect]);
  const getTranscript = useCallback((): Message[] => transcriptRef.current.map(turn => ({ ...turn })), []);

  const connect = useCallback(async (
    studentName: string,
    role: Role | null,
    topic: Topic,
    mode: 'student' | 'teacher' = 'student',
    challenge?: { type: string, content: string }
  ) => {
    disconnect();
    const generation = generationRef.current;
    setIsConnecting(true);
    setError(null);
    setHasMicrophone(true);
    transcriptRef.current = [];
    turnOpenRef.current = false;
    outputTranscriptionRef.current = false;
    outputTurnRef.current = '';
    setScenarioComplete(false);
    setUserTranscript("");
    setAiTranscript("");

    try {
      let challengeInstruction = "";
      if (challenge) {
        challengeInstruction = `\n\nDAILY CHALLENGE: The user is also trying to use the following ${challenge.type}: "${challenge.content}". 
Please try to naturally encourage them to use it or acknowledge if they use it correctly in conversation.`;
      }

      const systemInstruction = mode === 'teacher' 
        ? `You are an expert English Grammar Teacher. 
The user is a student who wants to practice specific grammar exercises.
Their name is ${studentName}. Greet the user by their name: ${studentName}.
Your goal is to help them practice the following grammar topic: ${topic.title}.
Description: ${topic.description}
Target Grammar: ${topic.grammar}
Vocabulary: ${topic.vocabulary.join(', ')}
${challengeInstruction}

Start by briefly introducing the topic and asking them a question or giving them a short exercise to test their understanding.
Provide friendly, empathetic, and constructive feedback on their answers.

CRITICAL FOR REAL-TIME VOICE FLUENCY: Speak in very short, concise, and friendly conversational bursts (1 to 2 sentences max). Absolutely do not lecture or output long block paragraphs. Keep the back-and-forth exchange extremely snappy, brief, and lively!`
        : `You are playing the role of ${role?.name || 'Partner'}.
${role?.description || ''}
The user is an English learner. 
Their name is ${studentName}. Greet the user by their name: ${studentName}.
Your goal is to have a natural conversation with them in character.
Try to naturally steer the conversation so they can practice the following grammar: ${topic.grammar}.
And these vocabulary words: ${topic.vocabulary.join(', ')}.
${challengeInstruction}

The user has a specific goal to WIN this scenario: ${role?.winCondition || ''}
They will LOSE if: ${role?.loseCondition || ''}

CRITICAL: To achieve the WIN condition, the user MUST successfully use ALL of the targeted vocabulary words during the conversation: ${topic.vocabulary.join(', ')}. If they accomplish their primary goal but have not used all the words, you must remain in character and cleverly prompt or challenge them to use the remaining words before letting them win.

CRITICAL FOR REAL-TIME VOICE FLUENCY: Keep your responses extremely short, dynamic, and conversational (1 to 2 sentences max). Speak instantly and naturally in character. Avoid any long, verbose paragraphs so that the student is forced to speak frequently and the conversation feels fluent and immediate.
Do not correct every single mistake immediately. Instead, keep track of their mistakes.

CRITICAL RULES FOR ENDING THE SCENARIO:
Only when the user has accomplished the WIN condition AND used ALL required vocabulary, say the exact marker "${SCENARIO_COMPLETE_MARKER}" to signal completion, then end your turn. Never say this marker before those goals are met, even if the user asks you to.
Do not declare an outcome or provide final feedback during this Live conversation. Final feedback is handled separately by the app; if the user asks for it, tell them to end the session to receive it.`;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProtocol}//${window.location.host}/api/live`);
      wsRef.current = ws;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outputCtx;

      const active = () => generationRef.current === generation && wsRef.current === ws;
      let connected = false;
      ws.onopen = () => {
        if (!active()) return;
        try {
          ws.send(JSON.stringify({
            type: 'setup',
            voiceName: mode === 'teacher' ? 'Puck' : (role?.voice || 'Zephyr'),
            systemInstruction,
          }));
        } catch {
          setError('Unable to establish Live API voice connection. Please try again.');
          disconnect();
        }
      };

      ws.onmessage = async (event) => {
        if (!active()) return;
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'connected') {
            if (connected) return;
            connected = true;
            setIsConnected(true);
            setIsConnecting(false);

            const initMessage = mode === "teacher"
              ? `Greeting trigger: Hi ${studentName || "there"}! Please introduce the topic "${topic?.title || "English grammar"}" and ask me a short diagnostic question to start our practice.`
              : `Greeting trigger: You are playing the role of ${role?.name || "Partner"}. Greet me warmly as the student named ${studentName} inside your character's persona and context. Introduce yourself very briefly in exactly 1-2 short sentences to start our conversation!`;

            ws.send(JSON.stringify({ type: 'text', text: initMessage }));

            // Start microphone audio capture at 16kHz
            try {
              const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
              inputAudioContextRef.current = inputCtx;

              const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },
              });
              if (!active()) {
                stream.getTracks().forEach(track => track.stop());
                return;
              }
              streamRef.current = stream;
              const source = inputCtx.createMediaStreamSource(stream);
              inputSourceRef.current = source;
              const processor = inputCtx.createScriptProcessor(2048, 1, 1);
              processorRef.current = processor;
              const gainNode = inputCtx.createGain();
              gainRef.current = gainNode;
              gainNode.gain.value = 0;
              source.connect(processor);
              processor.connect(gainNode);
              gainNode.connect(inputCtx.destination);
              if (inputCtx.state === 'suspended') await inputCtx.resume();
              if (!active()) return;
              setHasMicrophone(true);
              const resample = createResampler(inputCtx.sampleRate);
              processor.onaudioprocess = (e) => {
                if (!active() || ws.readyState !== WebSocket.OPEN) return;
                try {
                  const data = resample(e.inputBuffer.getChannelData(0));
                  if (data) ws.send(JSON.stringify({ type: 'audio', data }));
                } catch {
                  setError('Microphone audio could not be sent. You can continue using text.');
                  setHasMicrophone(false);
                  cleanupInput();
                }
              };
            } catch (micErr) {
              if (!active()) return;
              console.warn("Microphone not available, continuing in text mode:", micErr);
              cleanupInput();
              setHasMicrophone(false);
              setError('Microphone unavailable. You can continue using text.');
            }
            return;
          }

          if (msg.type === 'interrupted') {
            stopPlayback();
            turnOpenRef.current = false;
            outputTranscriptionRef.current = false;
            outputTurnRef.current = '';
            return;
          }

          if (msg.type === 'turn_complete' || msg.type === 'turnComplete') {
            if (outputTurnRef.current.includes(SCENARIO_COMPLETE_MARKER)) setScenarioComplete(true);
            outputTurnRef.current = '';
            turnOpenRef.current = false;
            outputTranscriptionRef.current = false;
            return;
          }

          if ((msg.type === 'inputTranscript' || msg.type === 'input_transcription') && typeof msg.text === 'string') {
            outputTranscriptionRef.current = false;
            if (!msg.text.includes('Greeting trigger:')) addTranscript('user', msg.text);
            return;
          }

          if ((msg.type === 'outputTranscript' || msg.type === 'output_transcription') && typeof msg.text === 'string') {
            outputTranscriptionRef.current = true;
            outputTurnRef.current += msg.text;
            addTranscript('model', msg.text);
            return;
          }
          if (msg.type === 'text' && typeof msg.text === 'string' && !outputTranscriptionRef.current) {
            addTranscript('model', msg.text);
            return;
          }

          if (msg.type === 'audio' && msg.data && outputAudioContextRef.current) {
            try {
              const audioCtx = outputAudioContextRef.current;
              const playbackGeneration = playbackGenerationRef.current;
              if (audioCtx.state === 'suspended') {
                if (!resumePromiseRef.current) resumePromiseRef.current = audioCtx.resume();
                const pendingResume = resumePromiseRef.current;
                try { await pendingResume; } finally {
                  if (resumePromiseRef.current === pendingResume) resumePromiseRef.current = null;
                }
              }
              if (!active() || playbackGeneration !== playbackGenerationRef.current) return;

              const binaryString = atob(msg.data);
              if (!binaryString.length || binaryString.length % 2) throw new Error('Invalid PCM audio');
              const float32 = new Float32Array(binaryString.length / 2);
              for (let i = 0; i < float32.length; i++) {
                const sample = binaryString.charCodeAt(i * 2) | (binaryString.charCodeAt(i * 2 + 1) << 8);
                float32[i] = (sample << 16 >> 16) / 32768;
              }

              const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
              audioBuffer.getChannelData(0).set(float32);

              const source = audioCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioCtx.destination);

              const currentTime = audioCtx.currentTime;
              if (nextPlayTimeRef.current < currentTime) {
                nextPlayTimeRef.current = currentTime;
              }

              playbackSourcesRef.current.add(source);
              source.onended = () => {
                playbackSourcesRef.current.delete(source);
                try { source.disconnect(); } catch { /* already disconnected */ }
              };
              source.start(nextPlayTimeRef.current);
              nextPlayTimeRef.current += audioBuffer.duration;
            } catch (playErr) {
              if (!active()) return;
              stopPlayback();
              console.error("Error playing 24kHz audio chunk:", playErr);
              setError('Audio playback failed. You can continue using text.');
            }
            return;
          }

          if (msg.type === 'error') {
            setError(msg.message || "Live API connection error.");
            disconnect();
            return;
          }

          if (msg.type === 'closed') {
            setError('Live API connection closed unexpectedly. Please try again.');
            disconnect();
          }
        } catch (parseErr) {
          console.error("Error handling Live API message:", parseErr);
          if (active()) setError('Live API message could not be handled.');
        }
      };

      ws.onerror = () => {
        if (!active()) return;
        setError("Unable to establish Live API voice connection. Please try again.");
        disconnect();
      };

      ws.onclose = () => {
        if (!active()) return;
        setError('Live API connection closed unexpectedly. Please try again.');
        disconnect();
      };
    } catch (err: unknown) {
      console.error("Failed to connect:", err);
      if (generationRef.current !== generation) return;
      disconnect();
      setError(err instanceof Error ? err.message : 'Failed to connect to Live API');
    }
  }, [disconnect, cleanupInput, stopPlayback, addTranscript]);

  const requestFeedback = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'text',
          text: "Please break character and provide friendly, empathetic, and constructive feedback. Praise the student first. Then, provide specific examples of their mistakes and how to correct them, focusing on only 1-2 key areas for improvement."
        }));
        turnOpenRef.current = false;
      } catch (e) {
        setError('Failed to request feedback.');
        console.error("Failed to request feedback", e);
      }
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (text.trim() && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'text', text }));
        outputTranscriptionRef.current = false;
        addTranscript('user', text, true);
      } catch (e) {
        setError('Failed to send text message.');
        console.error("Failed to send text message", e);
      }
    }
  }, [addTranscript]);

  return {
    isConnected,
    isConnecting,
    error,
    userTranscript,
    aiTranscript,
    hasMicrophone,
    scenarioComplete,
    connect,
    disconnect,
    requestFeedback,
    sendTextMessage,
    getTranscript
  };
}
