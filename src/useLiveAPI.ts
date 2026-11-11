import { useState, useRef, useCallback } from 'react';

export function useLiveAPI() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [aiTranscript, setAiTranscript] = useState<string>("");
  const [hasMicrophone, setHasMicrophone] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const disconnect = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
        }
      } catch {
        // Ignore close errors
      }
      wsRef.current = null;
    }

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      processorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (inputAudioContextRef.current) {
      try {
        inputAudioContextRef.current.close();
      } catch {
        // Ignore close errors
      }
      inputAudioContextRef.current = null;
    }

    if (outputAudioContextRef.current) {
      try {
        outputAudioContextRef.current.close();
      } catch {
        // Ignore close errors
      }
      outputAudioContextRef.current = null;
    }

    nextPlayTimeRef.current = 0;
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connect = useCallback(async (
    studentName: string,
    role: any,
    topic: any,
    mode: 'student' | 'teacher' = 'student',
    challenge?: { type: string, content: string }
  ) => {
    disconnect();
    setIsConnecting(true);
    setError(null);
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
        : `You are playing the role of ${role.name}. 
${role.description}
The user is an English learner. 
Their name is ${studentName}. Greet the user by their name: ${studentName}.
Your goal is to have a natural conversation with them in character.
Try to naturally steer the conversation so they can practice the following grammar: ${topic.grammar}.
And these vocabulary words: ${topic.vocabulary.join(', ')}.
${challengeInstruction}

The user has a specific goal to WIN this scenario: ${role.winCondition}
They will LOSE if: ${role.loseCondition}

CRITICAL: To achieve the WIN condition, the user MUST successfully use ALL of the targeted vocabulary words during the conversation: ${topic.vocabulary.join(', ')}. If they accomplish their primary goal but have not used all the words, you must remain in character and cleverly prompt or challenge them to use the remaining words before letting them win.

CRITICAL FOR REAL-TIME VOICE FLUENCY: Keep your responses extremely short, dynamic, and conversational (1 to 2 sentences max). Speak instantly and naturally in character. Avoid any long, verbose paragraphs so that the student is forced to speak frequently and the conversation feels fluent and immediate.
Do not correct every single mistake immediately. Instead, keep track of their mistakes.

CRITICAL RULES FOR ENDING THE SCENARIO:
1. IF the user successfully accomplishes the WIN condition AND has used ALL the required vocabulary words, you MUST immediately tell them "Goal Accomplished Successfully!", break character, end the roleplay, and proceed directly to the feedback phase.
2. IF the user asks for feedback, or when you are prompted that 3 minutes have passed, you MUST break character, end the roleplay, and provide feedback.

FEEDBACK FORMAT:
Please format your feedback EXACTLY using the following Markdown structure:

### 🏆 Scenario Result
[Declare WON or LOST and explain why]

### 🌟 Highlights & Praise
[Highlight good parts of their performance and praise effort]

### 📚 Vocabulary Check
[Evaluate if they used the key vocabulary words: ${topic.vocabulary.join(', ')}]

### ✍️ Script Feedback & Corrections
| Your Mistake | The Right Way | Explanation |
| :--- | :--- | :--- |
| [Quote the mistake] | [Provide the correct structure] | [Brief explanation of the language focus] |`;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProtocol}//${window.location.host}/api/live`);
      wsRef.current = ws;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outputCtx;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'setup',
          voiceName: mode === 'teacher' ? 'Puck' : (role?.voice || 'Zephyr'),
          systemInstruction,
        }));
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'connected') {
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
              streamRef.current = stream;
              setHasMicrophone(true);

              const source = inputCtx.createMediaStreamSource(stream);
              const processor = inputCtx.createScriptProcessor(2048, 1, 1);
              processorRef.current = processor;

              source.connect(processor);

              const gainNode = inputCtx.createGain();
              gainNode.gain.value = 0;
              processor.connect(gainNode);
              gainNode.connect(inputCtx.destination);

              processor.onaudioprocess = (e) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
                }
                const buffer = new ArrayBuffer(pcm16.length * 2);
                const view = new DataView(buffer);
                for (let i = 0; i < pcm16.length; i++) {
                  view.setInt16(i * 2, pcm16[i], true);
                }
                const uint8 = new Uint8Array(buffer);
                let binary = "";
                for (let i = 0; i < uint8.length; i++) {
                  binary += String.fromCharCode(uint8[i]);
                }
                const base64 = btoa(binary);

                try {
                  wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
                } catch {
                  // Ignore transient socket send error
                }
              };
            } catch (micErr) {
              console.warn("Microphone not available, continuing in text mode:", micErr);
              setHasMicrophone(false);
            }

            // 3-minute feedback timer
            timerRef.current = setTimeout(() => {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  type: 'text',
                  text: "3 minutes have passed. Please break character and provide friendly, empathetic, and constructive feedback. Praise the student first. Then, provide specific examples of their mistakes and how to correct them, focusing on only 1-2 key areas for improvement."
                }));
                setAiTranscript(prev => prev + "\n\n--- FEEDBACK ---\n\n");
              }
            }, 3 * 60 * 1000);
            return;
          }

          if (msg.type === 'interrupted') {
            if (outputAudioContextRef.current) {
              nextPlayTimeRef.current = outputAudioContextRef.current.currentTime;
            }
            return;
          }

          if (msg.type === 'inputTranscript' && msg.text) {
            if (!msg.text.includes("Greeting trigger:")) {
              setUserTranscript(prev => (prev ? prev + " " + msg.text : msg.text));
            }
            return;
          }

          if ((msg.type === 'outputTranscript' || msg.type === 'text') && msg.text) {
            setAiTranscript(prev => prev + msg.text);
            return;
          }

          if (msg.type === 'audio' && msg.data && outputAudioContextRef.current) {
            try {
              const audioCtx = outputAudioContextRef.current;
              if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
              }

              const binaryString = atob(msg.data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const pcm16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(pcm16.length);
              for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / 32768;
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

              source.start(nextPlayTimeRef.current);
              nextPlayTimeRef.current += audioBuffer.duration;
            } catch (playErr) {
              console.error("Error playing 24kHz audio chunk:", playErr);
            }
            return;
          }

          if (msg.type === 'error') {
            setError(msg.message || "Live API connection error.");
            disconnect();
            return;
          }

          if (msg.type === 'closed') {
            disconnect();
          }
        } catch (parseErr) {
          console.error("Error handling Live API message:", parseErr);
        }
      };

      ws.onerror = () => {
        setError("Unable to establish Live API voice connection. Please try again.");
        disconnect();
      };

      ws.onclose = () => {
        disconnect();
      };
    } catch (err: any) {
      console.error("Failed to connect:", err);
      setError(err.message || "Failed to connect to Live API");
      setIsConnecting(false);
    }
  }, [disconnect]);

  const requestFeedback = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'text',
          text: "Please break character and provide friendly, empathetic, and constructive feedback. Praise the student first. Then, provide specific examples of their mistakes and how to correct them, focusing on only 1-2 key areas for improvement."
        }));
        setAiTranscript(prev => prev + "\n\n--- FEEDBACK ---\n\n");
      } catch (e) {
        console.error("Failed to request feedback", e);
      }
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'text',
          text,
        }));
        setUserTranscript(prev => (prev ? prev + " " + text : text));
      } catch (e) {
        console.error("Failed to send text message", e);
      }
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    userTranscript,
    aiTranscript,
    hasMicrophone,
    connect,
    disconnect,
    requestFeedback,
    sendTextMessage
  };
}
