import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Sparkles, Volume2, RotateCcw, Check, X, 
  ChevronRight, ChevronLeft, Play, Pause, Trash2, 
  RefreshCw, Award, HelpCircle, GraduationCap, ArrowRight
} from 'lucide-react';
import { TOPICS, GRAMMAR_TOPICS } from '../data';
import { AppTheme } from '../App';

interface InteractiveFlashcardsProps {
  theme: AppTheme;
  playClick: () => void;
  playReward: () => void;
}

interface FlashcardData {
  vocab: string;
  definitionEn: string;
  definitionEs: string;
  ipa: string;
  partOfSpeech: string;
  exampleEn: string;
  exampleEs: string;
  syllables: string;
  tips: string;
}

interface Deck {
  id: string;
  title: string;
  vocabulary: string[];
  type: 'conversational' | 'grammar';
  grammarDescription?: string;
}

export function InteractiveFlashcards({ theme, playClick, playReward }: InteractiveFlashcardsProps) {
  // Combine topics into rich study decks
  const decks = useMemo((): Deck[] => {
    const conversationalDecks: Deck[] = TOPICS.map(t => ({
      id: t.id,
      title: t.title,
      vocabulary: t.vocabulary || [],
      type: 'conversational',
      grammarDescription: t.grammar
    }));

    const grammarDecks: Deck[] = GRAMMAR_TOPICS.map(g => ({
      id: g.id,
      title: `Grammar: ${g.title}`,
      vocabulary: g.vocabulary || [],
      type: 'grammar',
      grammarDescription: g.grammar
    }));

    return [...conversationalDecks, ...grammarDecks];
  }, []);

  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || "t_supermarket");
  const activeDeck = decks.find(d => d.id === selectedDeckId) || decks[0];

  // Card index status
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentWord = activeDeck.vocabulary[currentIndex] || "";

  // Card interaction states
  const [isRevealed, setIsRevealed] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizIsCorrect, setQuizIsCorrect] = useState(false);

  // Dynamic API retrieval states
  const [enrichmentData, setEnrichmentData] = useState<Record<string, FlashcardData>>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Spaced Repetition persistence (localStorage mapping)
  const [masteredWords, setMasteredWords] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('linguaRole_mastered_words');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save mastered words when modified
  const markMastery = useCallback((word: string, isMastered: boolean) => {
    setMasteredWords(prev => {
      const updated = { ...prev, [word]: isMastered };
      localStorage.setItem('linguaRole_mastered_words', JSON.stringify(updated));
      return updated;
    });
    if (isMastered) {
      playReward();
    } else {
      playClick();
    }
  }, [playReward, playClick]);

  // Clean / Reset deck progress
  const resetDeckProgress = () => {
    playClick();
    if (!window.confirm("Are you sure you want to revive all cards in this deck?")) return;
    setMasteredWords(prev => {
      const updated = { ...prev };
      activeDeck.vocabulary.forEach(w => {
        delete updated[w];
      });
      localStorage.setItem('linguaRole_mastered_words', JSON.stringify(updated));
      return updated;
    });
  };

  // Auto-play state
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  // Speak terms client-side TTS
  const speakText = useCallback((text: string, lang = 'en-US') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop talking before beginning new text
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    
    // Choose high quality English voices if available
    const voices = window.speechSynthesis.getVoices();
    if (lang.startsWith('en')) {
      const ukVoice = voices.find(v => v.lang.includes('GB') || v.lang.includes('UK'));
      const usVoice = voices.find(v => v.lang.includes('US') && v.name.includes('Natural'));
      if (ukVoice) utterance.voice = ukVoice;
      else if (usVoice) utterance.voice = usVoice;
    } else if (lang.startsWith('es')) {
      const esVoice = voices.find(v => v.lang.includes('ES') || v.lang.includes('MX'));
      if (esVoice) utterance.voice = esVoice;
    }
    
    utterance.rate = 0.9; // Slightly slower for language learners
    window.speechSynthesis.speak(utterance);
  }, []);

  // Fetch enrichment meta from dynamic Gemini Endpoint
  const fetchCardEnrichment = useCallback(async (word: string) => {
    if (!word) return;
    if (enrichmentData[word]) return; // Already cached

    setIsLoadingDetails(true);
    try {
      const response = await fetch('/api/flashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocab: word, topic: activeDeck.title })
      });
      
      if (!response.ok) throw new Error('API failed');
      const data = await response.json();
      setEnrichmentData(prev => ({
        ...prev,
        [word]: {
          vocab: word,
          definitionEn: data.definitionEn || "Meaning in practice.",
          definitionEs: data.definitionEs || "Significado práctico.",
          ipa: data.ipa || "/.../",
          partOfSpeech: data.partOfSpeech || "term",
          exampleEn: data.exampleEn || `Let's use "${word}" in our next roleplay.`,
          exampleEs: data.exampleEs || `Usemos "${word}" en nuestro siguiente juego de rol.`,
          syllables: data.syllables || word,
          tips: data.tips || "No special grammatical warnings."
        }
      }));
    } catch (e) {
      console.error("Failed to load flashcard meta description:", e);
      // set resilient safe feedback values
      setEnrichmentData(prev => ({
        ...prev,
        [word]: {
          vocab: word,
          definitionEn: "Click to explore this vocabulary in context with the interactive tutor.",
          definitionEs: "Haz clic para explorar este vocabulario en contexto con el tutor interactivo.",
          ipa: "/example/",
          partOfSpeech: "phrase",
          exampleEn: `We should practice using "${word}" in a daily conversation.`,
          exampleEs: `Deberíamos practicar usando "${word}" en una conversación cotidiana.`,
          syllables: word,
          tips: "Try spelling and pronouncing this term out loud three times to improve your fluency!"
        }
      }));
    } finally {
      setIsLoadingDetails(false);
    }
  }, [enrichmentData, activeDeck, setEnrichmentData]);

  // Sync API details when word changes
  useEffect(() => {
    setIsRevealed(false);
    setQuizSubmitted(false);
    setQuizAnswer("");
    if (currentWord) {
      fetchCardEnrichment(currentWord);
    }
  }, [currentIndex, currentWord, fetchCardEnrichment]);

  // Clean-up loop on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, []);

  // Handle deck change
  const handleDeckChange = (deckId: string) => {
    playClick();
    setSelectedDeckId(deckId);
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsQuizMode(false);
    setQuizSubmitted(false);
    setQuizAnswer("");
    setIsAutoPlaying(false);
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
    }
  };

  // Navigations
  const handleNext = useCallback(() => {
    playClick();
    if (activeDeck.vocabulary.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % activeDeck.vocabulary.length);
  }, [activeDeck, playClick]);

  const handlePrev = useCallback(() => {
    playClick();
    if (activeDeck.vocabulary.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + activeDeck.vocabulary.length) % activeDeck.vocabulary.length);
  }, [activeDeck, playClick]);

  // Auto-learner cycle loop
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimer.current = setInterval(() => {
        setIsRevealed(f => {
          if (!f) {
            // Pronounce word when flipping to the back
            if (currentWord) {
              speakText(currentWord);
            }
            return true;
          } else {
            // Move to next word when flipping back up
            handleNext();
            return false;
          }
        });
      }, 5000);
    } else {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
      }
    }
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [isAutoPlaying, currentIndex, currentWord, handleNext, speakText]);

  // Submit Quiz/Self-test
  const onSubmitQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    if (!quizAnswer.trim()) return;
    
    // Loose checker comparing trimmed lower case
    const isCorrect = quizAnswer.trim().toLowerCase() === currentWord.toLowerCase().replace(/[()]/g, "").trim();
    setQuizIsCorrect(isCorrect);
    setQuizSubmitted(true);
    if (isCorrect) {
      playReward();
      markMastery(currentWord, true);
    }
  };

  // Quick statistics calculation
  const masteredCountInDeck = activeDeck.vocabulary.filter(w => masteredWords[w]).length;
  const progressPercent = activeDeck.vocabulary.length > 0 
    ? Math.round((masteredCountInDeck / activeDeck.vocabulary.length) * 100) 
    : 0;

  const currentMeta = enrichmentData[currentWord];

  return (
    <div className="space-y-6">
      
      {/* Top Deck Info and Selection row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900 shadow-inner">
        <div className="space-y-1">
          <label className="text-[10px] font-black tracking-widest uppercase text-indigo-400">Current Deck Ritual</label>
          <div className="relative">
            <select
              value={selectedDeckId}
              onChange={(e) => handleDeckChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-blue-100 rounded-xl px-3 py-2 text-sm outline-none font-bold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <optgroup label="Situational Spoken Vocab Lists" className="bg-zinc-950 text-indigo-300">
                {decks.filter(d => d.type === 'conversational').map(deck => (
                  <option key={deck.id} value={deck.id}>{deck.title} ({deck.vocabulary.length} words)</option>
                ))}
              </optgroup>
              <optgroup label="Grammar Focus Vocabulary" className="bg-zinc-950 text-indigo-300">
                {decks.filter(d => d.type === 'grammar').map(deck => (
                  <option key={deck.id} value={deck.id}>{deck.title} ({deck.vocabulary.length} words)</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Level Statistics Meter */}
        <div className="flex items-center gap-4 bg-zinc-950 p-2.5 rounded-xl border border-zinc-900">
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-12 h-12 transform -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="#18181b" strokeWidth="4" fill="transparent" />
              <circle 
                cx="24" 
                cy="24" 
                r="20" 
                stroke="#6366f1" 
                strokeWidth="4" 
                fill="transparent" 
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * progressPercent) / 100}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute text-[10px] font-black font-mono text-indigo-300">{progressPercent}%</span>
          </div>
          <div className="text-left space-y-0.5">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Soul's Integration</h4>
            <p className="text-[10px] text-indigo-300/60 font-medium">
              Absorbed: <span className="text-white font-bold">{masteredCountInDeck}</span> / {activeDeck.vocabulary.length} Runes
            </p>
          </div>
        </div>
      </div>

      {/* Grammar Context Tip Indicator */}
      {activeDeck.grammarDescription && (
        <div className="bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-xl flex items-start gap-2.5 text-left shadow-sm">
          <GraduationCap className="text-indigo-400 shrink-0 mt-0.5" size={16} />
          <div>
            <h5 className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Grammar Connection</h5>
            <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
              {activeDeck.grammarDescription}
            </p>
          </div>
        </div>
      )}

      {/* Core Mode Selectors Container */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          {/* Flip Mode Button */}
          <button
            type="button"
            onClick={() => { playClick(); setIsQuizMode(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${
              !isQuizMode 
                ? 'bg-indigo-950 border-indigo-500/50 text-indigo-300 font-black' 
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            🎴 Flip Cards
          </button>
          
          {/* Quiz Mode Button */}
          <button
            type="button"
            onClick={() => { playClick(); setIsQuizMode(true); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${
              isQuizMode 
                ? 'bg-indigo-950 border-indigo-500/50 text-indigo-300 font-black' 
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            🧠 Memory Quiz
          </button>
        </div>

        {/* Auto Play controls */}
        <button
          type="button"
          onClick={() => { playClick(); setIsAutoPlaying(!isAutoPlaying); }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            isAutoPlaying 
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 animate-pulse' 
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {isAutoPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
          <span>{isAutoPlaying ? "Auto Off" : "Auto Study"}</span>
        </button>
      </div>

      {activeDeck.vocabulary.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-3xl">
          This spectral list contains no items. Try picking another deck.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 text-center">

          {/* Interactive Card Stage */}
          <div className="relative w-full max-w-[420px] h-[400px]">
            <div className="relative w-full h-full select-none">
              
              {/* CARD FRONT SIDE */}
              {!isRevealed && (
              <div 
                onClick={() => { if (!isQuizMode && !isLoadingDetails) { playClick(); setIsRevealed(true); } }}
                className="absolute inset-0 w-full h-full glass-panel bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-indigo-950/20 p-6 sm:p-8 rounded-3xl border-3 border-zinc-800/80 flex flex-col items-center justify-between cursor-pointer hover:border-indigo-500/40 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
              >
                {/* Got It checkmark label */}
                <div className="w-full flex items-center justify-between relative">
                  <span className="text-[10px] font-black font-mono uppercase tracking-widest text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-900/30">
                    Word {currentIndex + 1} of {activeDeck.vocabulary.length}
                  </span>
                  {masteredWords[currentWord] && (
                    <span className="flex items-center gap-1.5 text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full uppercase tracking-wider">
                      <Check size={11} className="stroke-[3]" /> Mastered
                    </span>
                  )}
                </div>

                {isLoadingDetails ? (
                  <div className="space-y-4">
                    <div className="relative w-12 h-12 mx-auto">
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-full h-full rounded-full border-t-2 border-r-2 border-indigo-500 border-b-transparent border-l-transparent"
                      />
                      <Sparkles size={16} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
                    </div>
                    <span className="text-xs font-mono text-indigo-300 animate-pulse tracking-widest uppercase">Whispering Runes...</span>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    {/* The Word is hidden in memory quiz mode */}
                    {isQuizMode ? (
                      <div className="space-y-3 p-4 bg-zinc-950/60 rounded-2xl border border-zinc-900/60">
                        <span className="text-xs font-black uppercase text-indigo-400/80 tracking-widest block">Quiz Clue</span>
                        <p className="text-sm font-semibold text-zinc-300 leading-relaxed italic">
                          "{currentMeta?.definitionEn || 'Enter English translation for this topic vocabulary'}"
                        </p>
                        <p className="text-xs text-indigo-400/60 leading-relaxed font-semibold italic">
                          "{currentMeta?.definitionEs || 'Adivina esta palabra o expresión'}"
                        </p>
                        <span className="text-[11px] text-zinc-500 font-bold tracking-widest font-mono block uppercase">
                          Syllables: {currentMeta?.syllables || "???"}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-full h-32 mb-4 rounded-xl overflow-hidden border border-zinc-800 relative bg-zinc-900 flex items-center justify-center">
                          <img
                            src={`https://picsum.photos/seed/${currentWord}/400/200`}
                            alt={currentWord}
                            className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-500"
                          />
                        </div>
                        <h2 className="text-2xl sm:text-3.5xl font-extrabold text-white tracking-wide border-b border-zinc-800/40 pb-4 leading-tight break-all">
                          {currentWord}
                        </h2>

                        {currentMeta && (
                          <div className="space-y-2 mt-2">
                            <div className="flex items-center justify-center gap-2">
                              {currentMeta.ipa && (
                                <span className="text-emerald-400 font-mono text-xs sm:text-sm bg-emerald-500/5 px-2.5 py-0.5 rounded border border-emerald-500/10">
                                  {currentMeta.ipa}
                                </span>
                              )}
                              {currentMeta.partOfSpeech && (
                                <span className="text-[10px] text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                  {currentMeta.partOfSpeech}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono text-zinc-500 block">
                              Syllable drift: {currentMeta.syllables}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Card footer instruction */}
                <div className="w-full text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  {isQuizMode 
                    ? "RECALL THE TARGET EN-WORD BELOW" 
                    : "CLICK CARD TO ROTATE AND VIEW DETAILS"
                  }
                </div>

              </div>



              )}

              {/* CARD BACK SIDE */}
              {isRevealed && (
              <div 
                className="absolute inset-0 w-full h-full glass-panel bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-900/30 p-5 sm:p-7 rounded-3xl border-3 border-indigo-950 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-left overflow-y-auto custom-scrollbar"
              >
                {/* Header status */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black font-mono text-indigo-400 uppercase tracking-widest">Meaning & Usage</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsRevealed(false); }}
                    className="text-xs font-black text-indigo-400 bg-indigo-950 border border-indigo-900/40 px-2 py-1 rounded-lg uppercase tracking-wider hover:bg-indigo-900 transition-colors"
                  >
                    ⬅ Rotate Back
                  </button>
                </div>

                {/* Substantive vocabulary content */}
                {currentMeta && (
                  <div className="space-y-4 my-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Definition</h3>
                        <span className="text-[10px] text-indigo-300 font-black font-mono italic">EN/ES</span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-semibold mt-0.5">{currentMeta.definitionEn}</p>
                      <p className="text-xs text-indigo-300/80 leading-relaxed font-medium italic mt-1 bg-black/25 p-2 rounded-lg border border-indigo-950/20">{currentMeta.definitionEs}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Contextual Echo</h3>
                        <button
                          type="button"
                          onClick={() => speakText(currentMeta.exampleEn)}
                          className="p-1 rounded-md text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all flex items-center gap-1 text-[10px] font-bold"
                          title="Speak Example Sentence"
                        >
                          <Volume2 size={12} /> Listen
                        </button>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed mt-1 font-semibold">"{currentMeta.exampleEn}"</p>
                      <p className="text-xs text-indigo-300/70 leading-relaxed italic mt-0.5">"{currentMeta.exampleEs}"</p>
                    </div>

                    {currentMeta.tips && (
                      <div className="text-[11px] leading-relaxed bg-zinc-950 p-2 py-2.5 rounded-xl border border-zinc-900 text-zinc-400 flex items-start gap-1.5">
                        <Sparkles size={12} className="text-indigo-400 mt-0.5 shrink-0" />
                        <span>{currentMeta.tips}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action panel underneath back card */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => speakText(currentWord)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-emerald-400 rounded-xl hover:text-emerald-300 hover:bg-zinc-800 text-xs font-black uppercase tracking-wider"
                  >
                    <Volume2 size={13} /> Speak
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => markToPractice()}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-colors ${
                        !masteredWords[currentWord] 
                          ? 'bg-rose-950/40 border-rose-900/30 text-rose-400' 
                          : 'text-zinc-500 border-zinc-900 hover:bg-rose-900/10'
                      }`}
                    >
                      <X size={12} className="inline mr-1 stroke-[3]" /> Practice
                    </button>
                    <button
                      type="button"
                      onClick={() => markAsGotIt()}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-colors ${
                        masteredWords[currentWord] 
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-emerald-900/20 hover:text-emerald-300'
                      }`}
                    >
                      <Check size={12} className="inline mr-1 stroke-[3]" /> Got It!
                    </button>
                  </div>
                </div>

              </div>

              )}
            </div>
          </div>

          {/* Quiz Action Form */}
          {isQuizMode && (
            <div className="w-full max-w-[420px] transition-all duration-300 bg-zinc-950/30 p-4 border border-zinc-900 rounded-2xl">
              {!quizSubmitted ? (
                <form onSubmit={onSubmitQuiz} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type the English term..."
                      value={quizAnswer}
                      onChange={(e) => setQuizAnswer(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm font-bold placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!quizAnswer.trim()}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Test
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      // Reveal correct answers directly
                      setQuizAnswer(currentWord.replace(/[()]/g, ""));
                    }}
                    className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors"
                  >
                    💡 Help / Reveal
                  </button>
                </form>
              ) : (
                <div className="text-left space-y-3 p-1">
                  <div className="flex items-center gap-2">
                    {quizIsCorrect ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <Check size={13} className="stroke-[3]" /> Perfect Recalled!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        <X size={13} className="stroke-[3]" /> Spectral Fracture
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Answer Details</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-400 font-medium font-mono">Your guess:</span>
                      <span className={`text-xs font-bold leading-normal ${quizIsCorrect ? 'text-emerald-400' : 'text-rose-400 line-through'}`}>{quizAnswer}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Correct Spelling:</span>
                      <span className="text-sm font-extrabold text-white leading-normal underline decoration-indigo-500">{currentWord}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setQuizSubmitted(false);
                        setQuizAnswer("");
                      }}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-855 text-zinc-300 font-black text-[11px] uppercase tracking-wider rounded-xl border border-zinc-800"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleNext();
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1"
                    >
                      Next Card <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation and state controller row */}
          <div className="flex items-center gap-4 bg-zinc-950 p-2.5 rounded-2xl border border-zinc-900 w-full max-w-[420px] justify-between">
            <button
              onClick={handlePrev}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all border border-zinc-800 flex items-center justify-center cursor-pointer"
              title="Previous Word"
            >
              <ChevronLeft size={16} className="stroke-[3]" />
            </button>

            <div className="text-center">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                {currentIndex + 1} / {activeDeck.vocabulary.length} Runes
              </span>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">{currentWord}</p>
            </div>

            <button
              onClick={handleNext}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all border border-zinc-800 flex items-center justify-center cursor-pointer"
              title="Next Word"
            >
              <ChevronRight size={16} className="stroke-[3]" />
            </button>
          </div>

          {/* Bottom Settings Utilities Panel */}
          <div className="flex items-center justify-center gap-3 w-full border-t border-zinc-900/60 pt-4">
            <button
              onClick={resetDeckProgress}
              className="flex items-center gap-1.5 text-[10px] font-black text-rose-500 hover:text-rose-450 uppercase tracking-widest bg-rose-950/10 hover:bg-rose-950/20 px-3 py-1.5 border border-rose-900/20 rounded-xl transition-colors"
              title="Revive Mastery Progress"
            >
              <Trash2 size={12} /> Clear Mastery
            </button>
            
            <button
              onClick={() => {
                playClick();
                if (currentMeta) {
                  speakText(`The English word is ${currentWord}. The description states: ${currentMeta.definitionEn}. Here is a real-world example: ${currentMeta.exampleEn}`);
                } else {
                  speakText(currentWord);
                }
              }}
              className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 hover:text-indigo-350 uppercase tracking-widest bg-indigo-950/20 hover:bg-indigo-950/30 px-3 py-1.5 border border-indigo-900/20 rounded-xl transition-colors"
            >
              <GraduationCap size={12} /> Read Aloud (Full Guide)
            </button>
          </div>

        </div>
      )}

    </div>
  );

  // Mark status helper functions
  function markToPractice() {
    markMastery(currentWord, false);
    setIsRevealed(false);
  }

  function markAsGotIt() {
    markMastery(currentWord, true);
    setIsRevealed(false);
  }
}
