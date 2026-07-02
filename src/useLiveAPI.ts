import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

export function useLiveAPI() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [aiTranscript, setAiTranscript] = useState<string>("");
  const [hasMicrophone, setHasMicrophone] = useState(true);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async (
    studentName: string,
    role: any,
    topic: any,
    mode: 'student' | 'teacher' = 'student',
    challenge?: { type: string, content: string }
  ) => {
    setIsConnecting(true);
    setError(null);
    setUserTranscript("");
    setAiTranscript("");

    try {
            const ai = new GoogleGenAI({
        apiKey: 'proxy', // Dummy key to pass validation; actual key is appended by proxy
        httpOptions: {
          baseUrl: window.location.protocol + '//' + window.location.host + '/api/gemini'
        }
      });
      
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

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: mode === 'teacher' ? 'Puck' : role.voice } },
          },
          systemInstruction,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: async () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            // Send initial trigger so AI starts the conversation
            sessionPromise.then((session) => {
              try {
                let initMessage = "";
                if (mode === "teacher") {
                  initMessage = `Greeting trigger: Hi ${studentName || "there"}! Please introduce the topic "${topic?.title || "English grammar"}" and ask me a short diagnostic question to start our practice.`;
                } else {
                  initMessage = `Greeting trigger: You are playing the role of ${role?.name || "Partner"}. Greet me warmly as the student named ${studentName} inside your character's persona and context. Introduce yourself very briefly in exactly 1-2 short sentences to start our conversation!`;
                }
                session.sendRealtimeInput({
                  text: initMessage
                });
              } catch (e) {
                console.error("Failed to send initial greeting trigger:", e);
              }
            });

            // Start audio capture
            try {
              const audioContext = new AudioContext({ sampleRate: 16000 });
              audioContextRef.current = audioContext;
              
              const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true
                } 
              });
              streamRef.current = stream;
              setHasMicrophone(true);
              
              const source = audioContext.createMediaStreamSource(stream);
              const processor = audioContext.createScriptProcessor(2048, 1, 1);
              processorRef.current = processor;
              
              source.connect(processor);
              
              // Create a gain node set to 0 to keep the processor active without echoing
              const gainNode = audioContext.createGain();
              gainNode.gain.value = 0;
              processor.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              processor.onaudioprocess = (e) => {
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
                const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
                
                if (sessionRef.current) {
                  try {
                    sessionRef.current.sendRealtimeInput({
                      audio: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64
                      }
                    });
                  } catch (err) {
                    console.error("Error sending realtime audio direct:", err);
                  }
                } else {
                  sessionPromise.then((session) => {
                    try {
                      session.sendRealtimeInput({
                        audio: {
                          mimeType: 'audio/pcm;rate=16000',
                          data: base64
                        }
                      });
                    } catch (err) {
                      console.error("Error sending realtime audio via promise:", err);
                    }
                  });
                }
              };

              // 3-minute feedback timer
              timerRef.current = setTimeout(() => {
                sessionPromise.then((session) => {
                  try {
                    session.sendRealtimeInput({
                      text: "3 minutes have passed. Please break character and provide friendly, empathetic, and constructive feedback. Praise the student first. Then, provide specific examples of their mistakes and how to correct them, focusing on only 1-2 key areas for improvement."
                    });
                    setAiTranscript(prev => prev + "\n\n--- FEEDBACK ---\n\n");
                  } catch (e) {
                    console.error("Failed to send feedback prompt", e);
                  }
                });
              }, 3 * 60 * 1000); // 3 minutes

            } catch (err: any) {
              console.warn("Microphone not found, falling back to text mode:", err);
              setHasMicrophone(false);
              // Do not disconnect, allow text mode
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.interrupted) {
              // Clear audio queue if interrupted
              if (audioContextRef.current) {
                nextPlayTimeRef.current = audioContextRef.current.currentTime;
              }
            }

            // Handle Transcriptions
            // @ts-ignore
            if (message.serverContent?.modelTurn?.parts) {
              // @ts-ignore
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.text) {
                  setAiTranscript(prev => prev + part.text);
                }
              }
            }
            
            // @ts-ignore
            if (message.clientContent?.turnComplete) {
              // Sometimes input transcription comes differently, but we'll try to catch what we can
            }
            
            // @ts-ignore
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              // This is audio
            }

            // @ts-ignore
            if (message.clientContent?.turnComplete) {
              // Not reliable for text
            }

            // @ts-ignore
            if (message.serverContent?.turnComplete) {
              // Turn complete
            }

            // Let's check for inputTranscription and outputTranscription as per docs
            // @ts-ignore
            if (message.serverContent?.modelTurn?.parts) {
               // already handled above
            }
            
            // @ts-ignore
            if (message.serverContent?.clientContent?.turns) {
              // @ts-ignore
              for (const turn of message.serverContent.clientContent.turns) {
                for (const part of turn.parts) {
                  if (part.text && !part.text.includes("Greeting trigger:")) {
                    setUserTranscript(prev => prev + " " + part.text);
                  }
                }
              }
            }

            // @ts-ignore
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              if (audioContextRef.current) {
                try {
                const audioContext = audioContextRef.current;
                const binaryString = atob(base64Audio);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const pcm16 = new Int16Array(bytes.buffer);
                const float32 = new Float32Array(pcm16.length);
                for (let i = 0; i < pcm16.length; i++) {
                  float32[i] = pcm16[i] / 32768;
                }
                
                const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
                audioBuffer.getChannelData(0).set(float32);
                
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                
                const currentTime = audioContext.currentTime;
                if (nextPlayTimeRef.current < currentTime) {
                  nextPlayTimeRef.current = currentTime;
                }
                
                source.start(nextPlayTimeRef.current);
                nextPlayTimeRef.current += audioBuffer.duration;
              } catch (e) {
                console.error("Error playing audio chunk", e);
              }
            }
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error occurred.");
            disconnect();
          },
          onclose: () => {
            disconnect();
          }
        }
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (err: any) {
      console.error("Failed to connect:", err);
      setError(err.message || "Failed to connect to Live API");
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (sessionRef.current) {
      // The SDK might not have a public close method, but we can try
      try {
        // @ts-ignore
        if (typeof sessionRef.current.close === 'function') {
          // @ts-ignore
          sessionRef.current.close();
        }
      } catch (e) {}
      sessionRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const requestFeedback = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.sendRealtimeInput({
          text: "Please break character and provide friendly, empathetic, and constructive feedback. Praise the student first. Then, provide specific examples of their mistakes and how to correct them, focusing on only 1-2 key areas for improvement."
        });
        setAiTranscript(prev => prev + "\n\n--- FEEDBACK ---\n\n");
      } catch (e) {
        console.error("Failed to request feedback", e);
      }
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (sessionRef.current) {
      try {
        sessionRef.current.sendRealtimeInput({
          text
        });
        setUserTranscript(prev => prev + " " + text);
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
