import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, RotateCcw, Volume2, Sparkle, Trophy, Flame } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { EXERCISES } from '../data';
import { GothicSkullFlowerFrame } from './GothicSkullFlowerFrame';
import { playClick } from '../utils/audio';

export const GrammarExercises: React.FC<{
  currentExerciseIndex: number;
  setCurrentExerciseIndex: (v: number) => void;
  currentExercise: any;
  setCurrentExercise: (v: any) => void;
  isGeneratingExercise: boolean;
  selectedAnswer: number | null;
  setSelectedAnswer: (v: any) => void;
  exercisesCompleted: number;
  exerciseStyle: string;
  setExerciseStyle: (v: any) => void;
  spellInput: string;
  setSpellInput: (v: string) => void;
  spellHintTriggered: boolean;
  setSpellHintTriggered: (v: boolean) => void;
  unscrambleOptions: string[];
  unscrambleSelected: string[];
  setUnscrambleSelected: (v: any) => void;
  exerciseStreak: number;
  incorrectAttempts: Record<number, boolean>;
  setIncorrectAttempts: (v: any) => void;
  spellError: boolean;
  generateNewExercise: () => void;
  handleChoiceSelect: (idx: number) => void;
  verifyScribeAnswer: () => void;
  verifyUnscrambleAnswer: () => void;
  setUnscrambleOptions: (v: any) => void;
}> = ({
  currentExerciseIndex, setCurrentExerciseIndex, currentExercise, setCurrentExercise, isGeneratingExercise,
  selectedAnswer, setSelectedAnswer, exercisesCompleted, exerciseStyle, setExerciseStyle, spellInput,
  setSpellInput, spellHintTriggered, setSpellHintTriggered, unscrambleOptions,
  unscrambleSelected, setUnscrambleSelected, exerciseStreak, incorrectAttempts, setIncorrectAttempts,
  spellError, generateNewExercise, handleChoiceSelect, verifyScribeAnswer, verifyUnscrambleAnswer, setUnscrambleOptions
}) => {
  const { activeTheme } = useAppContext();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mt-8">
      <GothicSkullFlowerFrame title="Grammar Exercises" icon={<Briefcase size={20} className={activeTheme.activeIconColor} />} theme={activeTheme}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          <div className="md:col-span-4 space-y-6">
            <div className="p-5 bg-amber-950/20 rounded-2xl border border-amber-900/30">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Trophy size={16} /> Progress
                </h4>
                <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                  <Flame size={14} className={exerciseStreak > 0 ? "text-orange-500 animate-bounce" : "text-zinc-650"} />
                  <span className="text-xs font-bold text-zinc-300">Streak: {exerciseStreak}</span>
                </div>
              </div>
              <div className="text-3xl font-serif text-white mb-2">{exercisesCompleted} <span className="text-lg text-amber-200/50">mastered</span></div>
              <p className="text-xs text-amber-200/60 leading-relaxed">
                Complete grammar exercises to strengthen your core knowledge. The AI remembers what you practice here during your live roleplay sessions.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-500/80 uppercase tracking-widest px-2 mb-3">Exercise Type</h4>
              <button
                onClick={() => { playClick(); setExerciseStyle('choice'); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-bold ${exerciseStyle === 'choice' ? 'bg-amber-900/40 border-amber-500/50 text-amber-300' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
              >
                Divination (Multiple Choice)
              </button>
              <button
                onClick={() => { playClick(); setExerciseStyle('unscramble'); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-bold ${exerciseStyle === 'unscramble' ? 'bg-amber-900/40 border-amber-500/50 text-amber-300' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
              >
                Incantation (Unscramble)
              </button>
              <button
                onClick={() => { playClick(); setExerciseStyle('spell'); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-bold ${exerciseStyle === 'spell' ? 'bg-amber-900/40 border-amber-500/50 text-amber-300' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
              >
                Scribe Ritual (Fill in the Blank)
              </button>
            </div>

            <button
              onClick={() => { playClick(); generateNewExercise(); }}
              disabled={isGeneratingExercise}
              className="w-full mt-4 py-3.5 rounded-xl border border-amber-500/30 bg-black hover:bg-zinc-900 text-amber-400 transition-all flex justify-center items-center gap-2 font-bold uppercase tracking-widest text-sm disabled:opacity-50 group"
            >
              {isGeneratingExercise ? (
                <RotateCcw size={16} className="animate-spin" />
              ) : (
                <Sparkle size={16} className="group-hover:text-amber-300 transition-colors" />
              )}
              {isGeneratingExercise ? 'Conjuring...' : 'Generate AI Exercise'}
            </button>
          </div>

          <div className="md:col-span-8 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentExercise.question + exerciseStyle}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 bg-black/40 rounded-3xl border border-amber-900/40 p-6 sm:p-10 flex flex-col relative"
              >
                <div className="absolute top-6 right-6">
                  <span className="text-xs font-black tracking-widest uppercase bg-amber-950/60 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/30">
                    {currentExercise.topic}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full py-8">
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white leading-tight text-center mb-10 text-shadow-sm">
                    {currentExercise.question}
                  </h3>

                  <div className="w-full">
                    {exerciseStyle === 'choice' && (
                      <div className="grid grid-cols-1 gap-3">
                        {currentExercise.options.map((opt: string, idx: number) => {
                          const isSelected = selectedAnswer === idx;
                          const isCorrect = idx === currentExercise.answer;
                          const showCorrect = selectedAnswer !== null && isCorrect;
                          const wasWrong = incorrectAttempts[idx];

                          let btnClass = "bg-zinc-900/80 border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800 text-zinc-300";
                          if (showCorrect) btnClass = "bg-emerald-950/50 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-400 font-bold scale-[1.02]";
                          else if (isSelected && !isCorrect) btnClass = "bg-red-950/50 border-red-500 text-red-400 opacity-50";
                          else if (wasWrong) btnClass = "bg-red-950/20 border-red-900/50 text-red-500/50 opacity-40";

                          return (
                            <button
                              key={idx}
                              onClick={() => handleChoiceSelect(idx)}
                              disabled={selectedAnswer !== null || wasWrong}
                              className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group ${btnClass}`}
                            >
                              <span className="text-base sm:text-lg">{opt}</span>
                              <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center opacity-0 transition-opacity ${showCorrect ? 'opacity-100 border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'group-hover:opacity-100 border-amber-500/50 text-amber-500'}`}>
                                {showCorrect ? '✓' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {exerciseStyle === 'unscramble' && (
                      <div className="flex flex-col items-center gap-8">
                        <div className={`min-h-[80px] w-full bg-zinc-950/80 border-2 rounded-2xl p-4 flex flex-wrap gap-2 items-center justify-center transition-colors ${spellError ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : selectedAnswer !== null ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-zinc-800'}`}>
                          {unscrambleSelected.map((word, idx) => (
                            <motion.button
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              key={`sel-${idx}`}
                              onClick={() => {
                                if (selectedAnswer !== null) return;
                                playClick();
                                setUnscrambleSelected((prev: any) => prev.filter((_: any, i: number) => i !== idx));
                                setUnscrambleOptions((prev: any) => [...prev, word]);
                              }}
                              className="px-4 py-2 bg-blue-900/40 text-blue-200 font-bold border border-blue-500/50 rounded-lg shadow-md hover:bg-red-900/40 hover:border-red-500/50 hover:text-red-200 transition-colors"
                            >
                              {word}
                            </motion.button>
                          ))}
                          {unscrambleSelected.length === 0 && (
                            <span className="text-zinc-600 font-medium italic">Construct the correct answer...</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center">
                          {unscrambleOptions.map((word, idx) => (
                            <button
                              key={`opt-${idx}`}
                              onClick={() => {
                                if (selectedAnswer !== null) return;
                                playClick();
                                setUnscrambleOptions((prev: any) => prev.filter((_: any, i: number) => i !== idx));
                                setUnscrambleSelected((prev: any) => [...prev, word]);
                              }}
                              className="px-4 py-2 bg-zinc-900 text-zinc-300 font-bold border border-zinc-700 rounded-lg shadow-sm hover:bg-zinc-800 hover:border-amber-500/50 hover:text-amber-300 transition-all active:scale-95"
                            >
                              {word}
                            </button>
                          ))}
                        </div>

                        {unscrambleOptions.length === 0 && selectedAnswer === null && (
                          <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={verifyUnscrambleAnswer}
                            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all mt-4"
                          >
                            Verify Alignment
                          </motion.button>
                        )}
                      </div>
                    )}

                    {exerciseStyle === 'spell' && (
                      <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
                        <input
                          type="text"
                          value={spellInput}
                          onChange={(e) => setSpellInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && verifyScribeAnswer()}
                          disabled={selectedAnswer !== null}
                          placeholder="Type the missing word..."
                          className={`w-full bg-zinc-900 border-2 rounded-2xl px-6 py-4 text-center text-xl font-bold text-white outline-none transition-all ${spellError ? 'border-red-500 focus:border-red-500 bg-red-950/20' : selectedAnswer !== null ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' : 'border-zinc-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20'}`}
                          autoFocus
                        />

                        {selectedAnswer === null ? (
                          <div className="flex gap-3 w-full">
                            <button
                              onClick={() => {
                                playClick();
                                setSpellHintTriggered(true);
                              }}
                              disabled={spellHintTriggered}
                              className="flex-1 py-3 bg-zinc-900 text-zinc-400 font-bold rounded-xl border border-zinc-800 hover:text-zinc-200 disabled:opacity-50 transition-colors"
                            >
                              {spellHintTriggered ? (
                                (() => {
                                  const word = currentExercise.options[currentExercise.answer];
                                  if (word.length <= 2) return word[0] + '_';
                                  const first = word[0];
                                  const last = word[word.length - 1];
                                  const mid = word.slice(1, word.length - 1).split('').map((c: string) => c === ' ' ? ' ' : '_').join(' ');
                                  return `${first} ${mid} ${last}`;
                                })()
                              ) : 'Reveal Hint'}
                            </button>
                            <button
                              onClick={verifyScribeAnswer}
                              disabled={!spellInput.trim()}
                              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                              Inscribe
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {selectedAnswer !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      className="mt-6 p-5 bg-blue-950/30 border border-blue-900/50 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Wisdom Unveiled</span>
                        </div>
                        <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
                          {currentExercise.explanation}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          playClick();
                          const nextIndex = (currentExerciseIndex + 1) % EXERCISES.length;
                          setCurrentExerciseIndex(nextIndex);
                          setCurrentExercise(EXERCISES[nextIndex]);
                          setSelectedAnswer(null);
                          setSpellInput('');
                          setSpellHintTriggered(false);
                          setIncorrectAttempts({});
                        }}
                        className="px-6 py-3 bg-zinc-100 hover:bg-white text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] whitespace-nowrap"
                      >
                        Next Scroll →
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </GothicSkullFlowerFrame>
    </div>
  );
};
