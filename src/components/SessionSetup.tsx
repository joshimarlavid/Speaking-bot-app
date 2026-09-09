import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Sparkles, Search, X, Volume2, Trophy, AlertCircle, BookOpen } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useRoleFilters } from '../hooks/useRoleFilters';
import { getRoleLevel } from '../utils/roleLevel';
import { GothicSkullFlowerFrame } from './GothicSkullFlowerFrame';
import { ROLES, TOPICS, GRAMMAR_TOPICS } from '../data';
import { BEGINNER_DIALOGUES } from '../beginnerDialogues';
import { playClick } from '../utils/audio';

export const SessionSetup: React.FC<{
  elevenLabsMode: boolean;
  setElevenLabsMode: (v: boolean) => void;
  isSessionConnected: boolean;
  isSessionConnecting: boolean;
}> = ({ elevenLabsMode, setElevenLabsMode, isSessionConnected, isSessionConnecting }) => {
  const {
    mode, setMode, activeTheme, studentName, setStudentName, selectedRole, setSelectedRole,
    selectedTopic, setSelectedTopic, isPremium, selectedGrammarTopic, setSelectedGrammarTopic
  } = useAppContext();

  const {
    selectedLevelFilter, setSelectedLevelFilter, roleSearchQuery, setRoleSearchQuery, finalFilteredRoles
  } = useRoleFilters();

  return (
    <div className="lg:col-span-5 space-y-6">
      <GothicSkullFlowerFrame title="Session Setup" icon={<Settings size={20} className={activeTheme.activeIconColor} />} theme={activeTheme}>
        <div className="flex flex-col gap-5">
          {/* Main Navigation Tabs */}
          <div className="flex flex-wrap gap-2 p-1 bg-black/60 rounded-xl border border-zinc-900 shadow-inner">
            <button
              onClick={() => { playClick(); setMode('student'); }}
              disabled={isSessionConnected || isSessionConnecting}
              className={`flex-1 py-2 px-3 min-w-[80px] text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${mode === 'student' ? 'bg-blue-500 text-black shadow-[0_0_12px_rgba(59,130,246,0.5)] border border-blue-400/50' : 'text-blue-300/60 hover:text-blue-200 hover:bg-blue-500/10'} disabled:opacity-50`}
            >
              Student
            </button>
            <button
              onClick={() => { playClick(); setMode('teacher'); }}
              disabled={isSessionConnected || isSessionConnecting}
              className={`flex-1 py-2 px-3 min-w-[80px] text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${mode === 'teacher' ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)] border border-emerald-400/50' : 'text-emerald-300/60 hover:text-emerald-200 hover:bg-emerald-500/10'} disabled:opacity-50`}
            >
              Teacher
            </button>
            <button
              onClick={() => {
                playClick();
                setMode('beginner');
                const firstBeginner = ROLES.find(r => r.id in BEGINNER_DIALOGUES);
                if (firstBeginner) setSelectedRole(firstBeginner);
              }}
              disabled={isSessionConnected || isSessionConnecting}
              className={`flex-1 py-2 px-3 min-w-[90px] text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${mode === 'beginner' ? 'bg-purple-500 text-black shadow-[0_0_12px_rgba(139,92,246,0.5)] border border-purple-400/50' : 'text-purple-300/60 hover:text-purple-200 hover:bg-purple-500/10'} disabled:opacity-50`}
            >
              Beginner
            </button>
            <button
              onClick={() => { playClick(); setMode('exercises'); }}
              disabled={isSessionConnected || isSessionConnecting}
              className={`flex-1 py-2 px-3 min-w-[90px] text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${mode === 'exercises' ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-amber-400/50' : 'text-amber-300/60 hover:text-amber-200 hover:bg-amber-500/10'} disabled:opacity-50`}
            >
              Exercises
            </button>
            <button
              onClick={() => { playClick(); setMode('progress'); }}
              disabled={isSessionConnected || isSessionConnecting}
              className={`flex-1 py-2 px-3 min-w-[90px] text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${mode === 'progress' ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] border border-red-500/50' : 'text-red-400/60 hover:text-red-200 hover:bg-red-500/10'} disabled:opacity-50`}
            >
              Progress
            </button>
            <button
              onClick={() => { playClick(); setMode('flashcards'); }}
              disabled={isSessionConnected || isSessionConnecting}
              className={`flex-1 py-2 px-3 min-w-[100px] text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${mode === 'flashcards' ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)] border border-indigo-500/50' : 'text-indigo-400/60 hover:text-indigo-200 hover:bg-indigo-500/10'} disabled:opacity-50`}
            >
              Flashcards
            </button>
          </div>

          {(mode === 'student' || mode === 'beginner') ? (
            <>
              <div>
                <label className="block text-base font-bold tracking-widest uppercase text-blue-300/90 mb-2">Your Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  disabled={isSessionConnected || isSessionConnecting}
                  placeholder="Enter your name..."
                  className="w-full bg-zinc-900/80 border border-zinc-800/50 text-blue-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500 transition-all disabled:opacity-50 font-medium"
                />
              </div>

              {/* Premium Voice Engine selection */}
              <div className="p-4 bg-zinc-900/40 rounded-xl border border-blue-900/40 backdrop-blur-sm shadow-inner flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-fuchsia-400" />
                    Voice Architecture
                  </h4>
                  <p className="text-xs text-blue-300/60 leading-normal">
                    Choose between standard Live API or ultra high-fidelity neural voices.
                  </p>
                </div>
                <div className="flex bg-black/60 p-1 rounded-lg border border-zinc-800/50">
                  <button
                    type="button"
                    disabled={isSessionConnected || isSessionConnecting}
                    onClick={() => { playClick(); setElevenLabsMode(false); }}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${!elevenLabsMode ? 'bg-blue-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'text-blue-400/60 hover:text-blue-300'} disabled:opacity-50`}
                  >
                    Gemini Live
                  </button>
                  <button
                    type="button"
                    disabled={isSessionConnected || isSessionConnecting}
                    onClick={() => { playClick(); setElevenLabsMode(true); }}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${elevenLabsMode ? 'bg-fuchsia-500 text-white shadow-[0_0_8px_rgba(217,70,239,0.4)]' : 'text-fuchsia-400/60 hover:text-fuchsia-300'} disabled:opacity-50`}
                  >
                    ElevenLabs Pro
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-base font-bold tracking-widest uppercase text-blue-300/90">
                    {mode === 'beginner' ? 'Beginner Partner' : 'Role Play Partner'}
                  </label>
                  <span className="text-xs font-mono text-blue-300/60 font-bold bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800/60">
                    {finalFilteredRoles.length} Available
                  </span>
                </div>

                {/* Search & Difficulty Filter Widgets */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                    <input
                      type="text"
                      placeholder="Search names, topics, or goals..."
                      value={roleSearchQuery}
                      onChange={(e) => setRoleSearchQuery(e.target.value)}
                      disabled={isSessionConnected || isSessionConnecting}
                      className="w-full bg-zinc-950/80 border border-zinc-850 text-blue-200 rounded-xl pl-11 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder-blue-500/25 disabled:opacity-50 font-medium"
                    />
                    {roleSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setRoleSearchQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-300 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Level Filter Tabs */}
                  <div className="flex bg-black/40 p-1 rounded-xl border border-zinc-900 overflow-x-auto gap-1 custom-scrollbar">
                    {(['all', 'A1', 'A2', 'B1_B2', 'C1'] as const).map((lvl) => {
                      const labels = {
                        all: 'All Levels',
                        A1: 'A1',
                        A2: 'A2',
                        B1_B2: 'B1/B2',
                        C1: 'C1'
                      };
                      return (
                        <button
                          key={lvl}
                          type="button"
                          disabled={isSessionConnected || isSessionConnecting}
                          onClick={() => { playClick(); setSelectedLevelFilter(lvl); }}
                          className={`flex-1 py-1.5 px-3 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${
                            selectedLevelFilter === lvl
                              ? 'bg-blue-500/25 text-blue-300 border border-blue-500/35 shadow-[0_0_8px_rgba(59,130,246,0.1)]'
                              : 'text-zinc-500 hover:text-blue-400/80'
                          } disabled:opacity-50`}
                        >
                          {labels[lvl]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Card List */}
                <div className="max-h-[260px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                  {finalFilteredRoles.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 text-sm border border-dashed border-zinc-850 rounded-2xl">
                      No matching partners found. Try another term.
                    </div>
                  ) : (
                    finalFilteredRoles.map((role) => {
                      const isSelected = selectedRole.id === role.id;
                      const isRolePremium = mode !== 'beginner' && ROLES.findIndex(r => r.id === role.id) >= 5;
                      const displayLevel = getRoleLevel(role.id, role.name);

                      const levelBadgeColors: Record<string, string> = {
                        "A1": "bg-green-500/10 text-green-400 border-green-500/20",
                        "A2": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        "A1/A2": "bg-teal-500/10 text-teal-400 border-teal-500/20",
                        "B1": "bg-blue-500/10 text-blue-400 border-blue-500/20",
                        "B2": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                        "B2/C1": "bg-violet-500/10 text-violet-400 border-violet-500/20",
                        "C1": "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
                      };

                      return (
                        <button
                          key={role.id}
                          type="button"
                          disabled={isSessionConnected || isSessionConnecting}
                          onClick={() => {
                            playClick();
                            setSelectedRole(role);
                            localStorage.setItem('linguaRole_role', role.id);
                            if (role.topicId) {
                              const topic = TOPICS.find(t => t.id === role.topicId);
                              if (topic) {
                                setSelectedTopic(topic);
                                localStorage.setItem('linguaRole_topic', topic.id);
                              }
                            }
                          }}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-2 relative overflow-hidden ${
                            isSelected
                              ? 'bg-blue-950/25 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.12)] ring-1 ring-blue-500/25'
                              : 'bg-zinc-950/45 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/15'
                          } disabled:opacity-50`}
                        >
                          {isSelected && (
                            <div className="absolute right-0 top-0 h-2 w-2 rounded-bl-xl bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                          )}

                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-sm text-blue-100 flex items-center gap-1.5 leading-snug">
                              {role.name}
                              {isRolePremium && (
                                <Sparkles size={12} className="text-amber-400 animate-pulse shrink-0" />
                              )}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${levelBadgeColors[displayLevel] || "bg-zinc-800/50 text-zinc-400 border-zinc-700/50"}`}>
                              {displayLevel}
                            </span>
                          </div>

                          <p className="text-xs text-blue-300/60 line-clamp-2 leading-relaxed">
                            {role.description}
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            <Volume2 size={13} className="text-blue-500/50" />
                            <span className="text-[11px] text-zinc-500 font-bold tracking-wider uppercase font-mono">Profile: {role.voice}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Info Cards Panel */}
                {selectedRole && (
                  <div className="mt-4 space-y-3.5">
                    <div className="p-4 bg-zinc-900/55 rounded-2xl border border-blue-900/30 shadow-inner">
                      <p className="text-sm text-blue-300/80 leading-relaxed font-semibold">
                        {selectedRole.description}
                      </p>
                    </div>
                    {mode !== 'beginner' && (
                      <>
                        <div className="p-4 bg-blue-950/20 rounded-2xl border border-blue-900/40 shadow-inner">
                          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Trophy size={14} className="text-yellow-400" />
                            Win Condition
                          </h4>
                          <p className="text-sm text-blue-200/80 leading-relaxed font-semibold">
                            {selectedRole.winCondition}
                          </p>
                        </div>
                        <div className="p-4 bg-red-950/25 rounded-2xl border border-red-900/20 shadow-inner">
                          <h4 className="text-xs font-bold text-red-400/80 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <AlertCircle size={14} className="text-red-500" />
                            Lose Condition
                          </h4>
                          <p className="text-sm text-red-300/80 leading-relaxed font-semibold">
                            {selectedRole.loseCondition}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : mode === 'teacher' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-base font-bold tracking-widest uppercase text-emerald-300/90 mb-2">Practice Focus</label>
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 text-emerald-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50"
                  value={selectedGrammarTopic.id}
                  onChange={(e) => {
                    playClick();
                    const topic = GRAMMAR_TOPICS.find(t => t.id === e.target.value);
                    if (topic) setSelectedGrammarTopic(topic);
                  }}
                  disabled={isSessionConnected || isSessionConnecting}
                >
                  {GRAMMAR_TOPICS.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.title}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-zinc-900/50 rounded-2xl border border-emerald-900/30">
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <BookOpen size={16} /> Grammar Focus
                </h4>
                <p className="text-sm text-emerald-100/80">{selectedGrammarTopic.grammar}</p>
              </div>
            </div>
          ) : null}
        </div>
      </GothicSkullFlowerFrame>
    </div>
  );
};
