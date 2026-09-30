import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Download, ChevronRight } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { GothicSkullFlowerFrame } from './GothicSkullFlowerFrame';
import { generatePDFSummary } from '../utils/pdfGenerator';
import { playClick } from '../utils/audio';

export const ProgressLedger: React.FC<{
  exercisesCompleted: number;
  exerciseStreak: number;
}> = ({ exercisesCompleted, exerciseStreak }) => {
  const { activeTheme, studentName } = useAppContext();
  const [expandedLogIndex, setExpandedLogIndex] = useState<number | null>(null);

  const logs = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mt-8">
      <GothicSkullFlowerFrame title="Gothic Progress Ledger" icon={<Trophy size={20} className="text-red-500" />} theme={activeTheme}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-red-950/20 rounded-2xl border border-red-900/30 flex flex-col items-center justify-center text-center">
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2">Spells Mastered</h4>
            <span className="text-5xl font-serif text-white">{exercisesCompleted}</span>
            <p className="text-xs text-red-300/60 mt-2">Exercises completed correctly</p>
          </div>
          <div className="p-6 bg-red-950/20 rounded-2xl border border-red-900/30 flex flex-col items-center justify-center text-center">
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2">Arcane Runes</h4>
            <span className="text-5xl font-serif text-white">
              {((exercisesCompleted * 150) + 1200).toLocaleString()}
            </span>
            <p className="text-xs text-red-300/60 mt-2">Level {Math.floor(((exercisesCompleted * 150) + 1200) / 1000)} Shadow Scholar</p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => generatePDFSummary(studentName, exercisesCompleted, exerciseStreak, logs)}
            className="px-8 py-4 bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-500/50 rounded-xl font-bold transition-all flex items-center gap-3 uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
          >
            <Download size={18} /> Download Grimoire Ledger (PDF)
          </button>
        </div>

        <div className="mt-12">
          <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2 border-b border-red-900/50 pb-3">
            <Trophy size={20} /> Prophecy Archive
          </h3>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-zinc-500 italic text-center py-8">No prophecies recorded yet. Complete a roleplay session or exercise.</p>
            ) : (
              logs.slice().reverse().map((log: any, idx: number) => {
                const isExpanded = expandedLogIndex === idx;
                return (
                  <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden transition-all">
                    <button
                      onClick={() => {
                        playClick();
                        setExpandedLogIndex(isExpanded ? null : idx);
                      }}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-red-300">{log.role}</span>
                          <span className="text-xs text-zinc-500 bg-black/50 px-2 py-0.5 rounded-full border border-zinc-800">
                            {new Date(log.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 truncate max-w-md">{log.topic}</p>
                      </div>
                      <ChevronRight
                        size={20}
                        className={`text-zinc-600 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-red-400' : ''}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-zinc-800 bg-black/40"
                        >
                          <div className="p-4 sm:p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800 text-center">
                                <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Fluency</span>
                                <span className="font-bold text-amber-400">{log.ratingAI}/5</span>
                              </div>
                              <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800 text-center">
                                <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Accuracy</span>
                                <span className="font-bold text-amber-400">{log.ratingTopic}/5</span>
                              </div>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Personal Reflection</span>
                              <p className="text-sm text-zinc-300 leading-relaxed italic bg-zinc-900/50 p-4 rounded-lg border-l-2 border-red-500">
                                "{log.comments}"
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </GothicSkullFlowerFrame>
    </div>
  );
};
