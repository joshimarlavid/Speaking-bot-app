import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, AlertCircle, Check, X, BookOpen, Clock, ChevronDown } from 'lucide-react';
import { ENGLISH_TENSES, TenseData } from '../grammarTenses';

export const GrammarTensesReference: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeline, setSelectedTimeline] = useState<string>('All');
  const [expandedTenseId, setExpandedTenseId] = useState<string | null>(null);

  const timelines = useMemo(() => {
    const raw = ENGLISH_TENSES.map(t => t.timeline);
    // Categorize to clean values for filtering
    return ['All', 'Present', 'Past', 'Future'];
  }, []);

  const filteredTenses = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const lowerTimeline = selectedTimeline.toLowerCase();
    return ENGLISH_TENSES.filter(tense => {
      const matchesSearch = 
        tense.name.toLowerCase().includes(lowerQuery) ||
        tense.useCase.toLowerCase().includes(lowerQuery) ||
        tense.rules.toLowerCase().includes(lowerQuery);
      
      const matchesTimeline = 
        selectedTimeline === 'All' || 
        tense.timeline.toLowerCase().includes(lowerTimeline);

      return matchesSearch && matchesTimeline;
    });
  }, [searchQuery, selectedTimeline]);

  const toggleExpand = (id: string) => {
    if (expandedTenseId === id) {
      setExpandedTenseId(null);
    } else {
      setExpandedTenseId(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-blue-900/30 pb-3">
        <div>
          <h3 className="text-lg font-display tracking-widest text-blue-200 uppercase flex items-center gap-2">
            <BookOpen size={18} className="text-blue-500" />
            Tense & Structure Desk
          </h3>
          <p className="text-xs text-blue-300/70 mt-0.5">Learn & teach English structural formulas securely.</p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
          {filteredTenses.length} TENSES
        </span>
      </div>

      {/* Constraints & Search bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <input
            type="text"
            placeholder="Search tenses or formula rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-zinc-800/80 text-blue-200 placeholder-zinc-500 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/80 transition-all font-medium"
          />
          <Search size={14} className="absolute left-3 top-3.5 text-zinc-500" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-zinc-500 hover:text-blue-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Timeline chips */}
        <div className="md:col-span-6 flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {timelines.map(tl => (
            <button
              key={tl}
              onClick={() => setSelectedTimeline(tl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${
                selectedTimeline === tl
                  ? 'bg-blue-500 text-black shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                  : 'bg-zinc-900/60 text-blue-300/70 border border-zinc-800/50 hover:text-blue-200'
              }`}
            >
              {tl}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredTenses.map((tense) => {
            const isExpanded = expandedTenseId === tense.id;
            return (
              <motion.div
                key={tense.id}
                layout="position"
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded 
                    ? 'bg-black border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                    : 'bg-zinc-950/45 border-zinc-800/60 hover:bg-zinc-900/40 hover:border-zinc-700/60'
                }`}
              >
                {/* Header click */}
                <button
                  onClick={() => toggleExpand(tense.id)}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-base text-white tracking-wider">
                        {tense.name}
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-400 border border-blue-900/50 flex items-center gap-1">
                        <Clock size={10} />
                        {tense.timeline}
                      </span>
                    </div>
                    <p className="text-xs text-blue-300/80 line-clamp-1">
                      {tense.useCase}
                    </p>
                  </div>
                  <div className={`p-1.5 rounded-lg bg-zinc-900 border border-zinc-800/60 text-zinc-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-400 border-blue-500/30' : ''}`}>
                    <ChevronDown size={14} />
                  </div>
                </button>

                {/* Collapsible content */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="border-t border-zinc-900 bg-black/60 px-4 pb-5 pt-3 space-y-4"
                  >
                    {/* General Usage & Rules */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Description & Rules</span>
                      <p className="text-sm text-blue-200/90 leading-relaxed bg-zinc-900/40 p-3 rounded-xl border border-blue-950/40 font-medium">
                        {tense.rules}
                      </p>
                    </div>

                    {/* Structures Table */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles size={11} className="text-blue-400" />
                        Sentence Structures
                      </span>

                      <div className="grid grid-cols-1 gap-3">
                        {/* Affirmative */}
                        <div className="bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase tracking-wider">
                              Affirmative (+)
                            </span>
                            <span className="text-xs font-mono text-zinc-400 leading-none">
                              {tense.affirmative.formula}
                            </span>
                          </div>
                          <p className="text-sm text-white italic font-medium pl-2 border-l-2 border-blue-500">
                            &ldquo;{tense.affirmative.example}&rdquo;
                          </p>
                        </div>

                        {/* Negative */}
                        <div className="bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-bold uppercase tracking-wider">
                              Negative (-)
                            </span>
                            <span className="text-xs font-mono text-zinc-400 leading-none mr-auto">
                              {tense.negative.formula}
                            </span>
                          </div>
                          <p className="text-sm text-white italic font-medium pl-2 border-l-2 border-red-500">
                            &ldquo;{tense.negative.example}&rdquo;
                          </p>
                        </div>

                        {/* Question */}
                        <div className="bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-wider">
                              Question (?)
                            </span>
                            <span className="text-xs font-mono text-zinc-400 leading-none">
                              {tense.question.formula}
                            </span>
                          </div>
                          <p className="text-sm text-white italic font-medium pl-2 border-l-2 border-amber-500">
                            &ldquo;{tense.question.example}&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Common Mistake Correction Block */}
                    <div className="pt-2 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl flex gap-2.5">
                        <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="block text-[10px] font-bold text-red-400 uppercase tracking-widest leading-none">Common Mistake</span>
                          <span className="text-xs text-red-200 line-through italic font-mono">
                            {tense.commonMistake}
                          </span>
                        </div>
                      </div>

                      <div className="bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl flex gap-2.5">
                        <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Correct Usage</span>
                          <span className="text-xs text-emerald-200 font-mono">
                            {tense.correctVersion}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {filteredTenses.length === 0 && (
            <div className="text-center py-10 bg-zinc-900/20 border border-zinc-800/80 rounded-2xl">
              <AlertCircle size={32} className="text-zinc-500 mx-auto mb-2" />
              <p className="text-blue-300/70 text-sm font-medium">No tenses found matching "{searchQuery}"</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
