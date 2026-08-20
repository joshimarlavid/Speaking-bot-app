import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Mic, MicOff, MessageSquare, AlertCircle, Play, Square, Star, EyeOff, Eye, Check, RefreshCw, Send, Mail, BookOpen } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { BEGINNER_DIALOGUES } from '../beginnerDialogues';
import { GrammarTensesReference } from './GrammarTensesReference';

export const InteractiveSession: React.FC<{
  isSessionConnected: boolean;
  isSessionConnecting: boolean;
  handleStart: () => void;
  handleStop: () => void;
  handleRestart: () => void;
  elevenLabsMode: boolean;
  setElevenLabsMode: (v: boolean) => void;
  elevenMessages: any[];
  setElevenMessages: (v: any) => void;
  elevenWarning: string | null;
  activeUserTranscript: string;
  activeAiTranscript: string;
  error: string | null;
  isRecording: boolean;
  startVoiceInput: () => void;
  stopVoiceInput: () => void;
  textInput: string;
  setTextInput: (v: string) => void;
  handleElevenMessage: (msg: string) => void;
  sendTextMessage: (msg: string) => void;
  hasMicrophone: boolean;
  showFeedback: boolean;
  setShowFeedback: (v: boolean) => void;
  isGeneratingFeedback: boolean;
  aiFeedbackReport: string | null;
  ratingAI: number;
  setRatingAI: (v: number) => void;
  ratingTopic: number;
  setRatingTopic: (v: number) => void;
  feedbackText: string;
  setFeedbackText: (v: string) => void;
  handleSubmitFeedback: () => void;
}> = ({
  isSessionConnected, isSessionConnecting, handleStart, handleStop, handleRestart,
  elevenLabsMode, elevenMessages, setElevenMessages, elevenWarning, activeUserTranscript, activeAiTranscript,
  error, isRecording, startVoiceInput, stopVoiceInput, textInput, setTextInput,
  handleElevenMessage, sendTextMessage, hasMicrophone, showFeedback, setShowFeedback,
  isGeneratingFeedback, aiFeedbackReport, ratingAI, setRatingAI, ratingTopic, setRatingTopic,
  feedbackText, setFeedbackText, handleSubmitFeedback
}) => {
  const {
    mode, activeTheme, selectedRole, isPremium, selectedTopic, selectedGrammarTopic, showDialogue, setShowDialogue
  } = useAppContext();

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !isSessionConnected) return;

    if (elevenLabsMode) {
      setElevenMessages((prev: any) => [...prev, { role: 'user', text: textInput }]);
      handleElevenMessage(textInput);
    } else {
      sendTextMessage(textInput);
    }
    setTextInput("");
  };

  const isRolePremium = mode !== 'beginner' && mode !== 'teacher' && selectedRole && selectedRole.id !== 'joshimar_custom' && !isPremium && false;

  return (
    <div className="lg:col-span-7 space-y-6">
      <div className={`glass-panel p-6 sm:p-8 rounded-[2rem] border-[6px] border-double ${activeTheme.borderDouble} relative bg-black/75 shadow-2xl backdrop-blur-xl transition-all duration-500 min-h-[500px] flex flex-col`}>
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${isSessionConnected ? 'bg-green-500' : isSessionConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
              {isSessionConnected && (
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50" />
              )}
            </div>
            <span className={`text-sm font-bold tracking-widest uppercase ${isSessionConnected ? 'text-green-400' : isSessionConnecting ? 'text-yellow-400' : 'text-red-400'}`}>
              {isSessionConnecting ? 'Summoning...' : isSessionConnected ? 'Channel Open' : 'Offline'}
            </span>
            {elevenLabsMode && isSessionConnected && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-400 px-2 py-0.5 rounded-md border border-fuchsia-500/30 ml-2">
                ElevenLabs Neural Active
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!isSessionConnected && !isSessionConnecting && (
              <button
                onClick={handleStart}
                className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTheme.accentBtn}`}
              >
                <Play size={18} />
                <span className="hidden sm:inline">Start</span>
              </button>
            )}
            {(isSessionConnected || isSessionConnecting) && (
              <>
                <button
                  onClick={handleRestart}
                  className="px-4 py-2.5 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all flex items-center gap-2 border border-zinc-700"
                  title="Restart Session"
                >
                  <RefreshCw size={18} />
                </button>
                <button
                  onClick={handleStop}
                  className="px-4 sm:px-6 py-2.5 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] flex items-center gap-2"
                >
                  <Square size={18} fill="currentColor" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center py-4 sm:py-8 min-h-[300px]">
          {error && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl flex items-center gap-2 text-sm z-50 backdrop-blur-md">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {elevenWarning && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-2 rounded-xl flex items-center gap-2 text-sm z-50 backdrop-blur-md w-full max-w-sm text-center">
              <AlertCircle size={16} className="shrink-0" />
              {elevenWarning}
            </div>
          )}

          <div className="relative w-full max-w-sm mx-auto flex flex-col items-center justify-center">
            {isSessionConnected && (
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[60px] animate-pulse" />
            )}

            <div className={`relative z-10 w-40 h-40 sm:w-56 sm:h-56 rounded-full border-4 ${isSessionConnected ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)]' : 'border-zinc-800'} overflow-hidden transition-all duration-700 bg-zinc-900 flex items-center justify-center`}>
              {(mode === 'student' || mode === 'beginner') ? (
                selectedRole.imageUrl ? (
                  <img
                    src={selectedRole.imageUrl}
                    alt={selectedRole.name}
                    className={`w-full h-full object-cover transition-transform duration-[3s] ${isSessionConnected ? 'scale-110' : 'scale-100 grayscale-[0.5]'}`}
                  />
                ) : (
                  <MessageSquare size={64} className="text-zinc-700" />
                )
              ) : mode === 'teacher' ? (
                <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-emerald-950 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                    <span className="text-3xl">👨‍🏫</span>
                  </div>
                  <span className="text-emerald-400 font-black tracking-widest text-sm sm:text-base">EL TEACHER</span>
                </div>
              ) : null}

              {isSessionConnected && (
                <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end items-center pb-4 sm:pb-6">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-blue-400 rounded-full animate-waveform"
                        style={{
                          height: `${Math.random() * 24 + 8}px`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-widest mt-3 px-3 py-1 bg-black/50 rounded-full border border-blue-500/30">
                    Live Roleplay
                  </span>
                </div>
              )}
            </div>

            <div className="w-full mt-8 sm:mt-12 h-32 relative">
              <AnimatePresence mode="wait">
                {activeAiTranscript && (
                  <motion.div
                    key={`ai-${activeAiTranscript}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <p className={`text-base sm:text-lg md:text-xl font-medium text-center leading-relaxed drop-shadow-md px-4 ${mode === 'teacher' ? 'text-emerald-100' : 'text-blue-100'}`}>
                      "{activeAiTranscript}"
                    </p>
                  </motion.div>
                )}
                {activeUserTranscript && !activeAiTranscript && (
                  <motion.div
                    key={`user-${activeUserTranscript}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <p className="text-base sm:text-lg md:text-xl font-medium text-center text-zinc-400 leading-relaxed drop-shadow-md px-4">
                      "{activeUserTranscript}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          {mode === 'teacher' && !isSessionConnected && (
            <div className="mb-6 p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
              <GrammarTensesReference />
            </div>
          )}

          {isSessionConnected && (
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {elevenLabsMode && (
                <div className="flex-1">
                  <form onSubmit={handleTextSubmit} className="relative flex items-center">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type a message or use voice..."
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim()}
                      className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:bg-zinc-700"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}

              <button
                onMouseDown={startVoiceInput}
                onMouseUp={stopVoiceInput}
                onTouchStart={startVoiceInput}
                onTouchEnd={stopVoiceInput}
                disabled={!isSessionConnected}
                className={`
                  flex-1 sm:flex-none relative overflow-hidden group
                  flex items-center justify-center gap-3 py-4 sm:py-0 sm:px-8 rounded-xl font-bold transition-all duration-300 min-h-[56px]
                  ${isRecording
                    ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-[0.98]'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                  }
                  ${!hasMicrophone && !elevenLabsMode ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isRecording ? (
                  <>
                    <Mic size={24} className="animate-pulse" />
                    <span className="text-lg tracking-widest uppercase">Listening...</span>
                    <div className="absolute inset-0 border-2 border-white/50 rounded-xl animate-ping opacity-20" />
                  </>
                ) : (
                  <>
                    <MicOff size={24} className="text-zinc-400 group-hover:text-white transition-colors" />
                    <span className="text-lg tracking-widest uppercase text-zinc-400 group-hover:text-white transition-colors">
                      {elevenLabsMode ? 'Hold to Speak' : 'Hold to Speak (Gemini)'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {mode === 'beginner' && isSessionConnected && showDialogue && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 glass-panel p-6 rounded-2xl border border-fuchsia-500/30 relative bg-black/60 shadow-[0_0_15px_rgba(217,70,239,0.15)]"
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setShowDialogue(false)}
              className="text-fuchsia-300/50 hover:text-fuchsia-300 transition-colors bg-fuchsia-950/30 p-2 rounded-lg border border-fuchsia-500/20"
              title="Hide English Translation"
            >
              <EyeOff size={18} />
            </button>
          </div>
          <h3 className="text-xl font-bold text-fuchsia-400 mb-4 flex items-center gap-2 border-b border-fuchsia-500/20 pb-3">
            <BookOpen size={20} /> Supported Dialogue: {selectedTopic.title}
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {((BEGINNER_DIALOGUES[selectedRole.id]?.[selectedTopic.id] as unknown) as any[])?.map((line: any, idx: number) => (
              <div key={idx} className={`p-4 rounded-xl border ${line.speaker === 'user' ? 'bg-blue-950/20 border-blue-900/30 ml-4 sm:ml-8' : 'bg-fuchsia-950/20 border-fuchsia-900/30 mr-4 sm:mr-8'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${line.speaker === 'user' ? 'text-blue-400' : 'text-fuchsia-400'}`}>
                    {line.speaker === 'user' ? 'You say:' : `${selectedRole.name} says:`}
                  </span>
                </div>
                <p className={`text-lg font-medium mb-1 ${line.speaker === 'user' ? 'text-blue-100' : 'text-fuchsia-100'}`}>{line.en}</p>
                <p className={`text-sm italic opacity-70 ${line.speaker === 'user' ? 'text-blue-200' : 'text-fuchsia-200'}`}>{line.es}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {mode === 'beginner' && isSessionConnected && !showDialogue && (
        <button
          onClick={() => setShowDialogue(true)}
          className="mt-6 w-full py-3 rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/20 text-fuchsia-300 hover:bg-fuchsia-900/40 hover:text-fuchsia-200 transition-all flex justify-center items-center gap-2 font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(217,70,239,0.1)]"
        >
          <Eye size={18} /> Show English Support Dialogue
        </button>
      )}

      {selectedTopic && !isSessionConnected && mode !== 'teacher' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left opacity-50 pointer-events-none">
          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-blue-900/30">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <BookOpen size={14} /> Topic Focus
            </h4>
            <div className="text-sm font-bold text-blue-100 mb-1">
              {mode === 'student' || mode === 'beginner' ? selectedTopic.title : selectedGrammarTopic.title}
            </div>
            <p className="text-xs text-blue-200/60 leading-relaxed mb-3">
              {mode === 'student' || mode === 'beginner' ? selectedTopic.description : selectedGrammarTopic.description}
            </p>
            <p className="text-blue-200 font-medium">{mode === 'student' || mode === 'beginner' ? selectedTopic.grammar : selectedGrammarTopic.grammar}</p>
          </div>
          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-blue-900/30">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <MessageSquare size={14} /> Vocabulary & Goals
            </h4>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(mode === 'student' || mode === 'beginner' ? selectedTopic.vocabulary : selectedGrammarTopic.vocabulary).map((word: string, i: number) => (
                <span key={i} className="text-[10px] bg-blue-950/40 text-blue-300 px-2 py-1 rounded-md border border-blue-900/50">
                  {word}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              {(mode === 'student' || mode === 'beginner' ? selectedTopic.goals : selectedGrammarTopic.goals).map((goal: string, i: number) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-blue-200/70">
                  <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{goal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isGeneratingFeedback && setShowFeedback(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`relative w-full max-w-2xl bg-zinc-950 border-2 ${activeTheme.borderSingle} rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
          >
            <div className={`p-6 border-b ${activeTheme.borderSingle} bg-black/40`}>
              <h2 className={`text-2xl font-bold ${activeTheme.textPrimary} flex items-center gap-3`}>
                <Star className="fill-current" />
                Session Debrief
              </h2>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isGeneratingFeedback ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 border-4 border-zinc-800 border-t-cyan-500 rounded-full animate-spin mb-6" />
                  <h3 className="text-xl font-bold text-cyan-400 mb-2">Analyzing Performance...</h3>
                  <p className="text-zinc-400">The AI is reviewing your grammar, vocabulary, and fluency.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {aiFeedbackReport && (
                    <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                      <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                        <MessageSquare size={18} />
                        AI Tutor Analysis
                      </h3>
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 custom-scrollbar">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {aiFeedbackReport}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-zinc-300">Fluency & Pronunciation</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRatingAI(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              size={28}
                              className={`${star <= ratingAI ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-zinc-700'} transition-all`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-zinc-300">Vocabulary Usage</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRatingTopic(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              size={28}
                              className={`${star <= ratingTopic ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-zinc-700'} transition-all`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-zinc-300">Personal Notes & Reflections</label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="What did you learn? What do you want to improve next time?"
                      className="w-full h-32 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className={`p-6 border-t ${activeTheme.borderSingle} bg-black/40 flex justify-end gap-3`}>
              <button
                onClick={() => {
                  if (ratingAI === 0 && ratingTopic === 0 && !feedbackText) {
                    setShowFeedback(false);
                    return;
                  }
                  handleSubmitFeedback();
                }}
                disabled={isGeneratingFeedback}
                className="px-6 py-2.5 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-all disabled:opacity-50"
              >
                Skip saving
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={isGeneratingFeedback || (ratingAI === 0 && ratingTopic === 0 && !feedbackText && !aiFeedbackReport)}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 ${activeTheme.accentBtn}`}
              >
                <Check size={18} /> Save Progress
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
