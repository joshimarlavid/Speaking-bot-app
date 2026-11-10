import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Mic, MicOff, Dices, User, Briefcase, MessageSquare, AlertCircle, Play, Square, Settings, RefreshCw, Star, Lock, Mail, Trophy, Zap, BookOpen, Sparkles, Eye, EyeOff, Check, X, Volume2, HelpCircle, ChevronRight, Flame, RotateCcw, Sparkle, Download, Search } from 'lucide-react';
import { ROLES, TOPICS, GRAMMAR_TOPICS, EXERCISES } from './data';
import { BEGINNER_DIALOGUES } from './beginnerDialogues';
import { GrammarTensesReference } from './components/GrammarTensesReference';
import { BotanicalBackdrop, BotanicalDivider, BotanicalEmblem, GildedFrame, LeafSprig } from './components/BotanicalOrnaments';
import { jsPDF } from 'jspdf';

import { useLiveAPI } from './useLiveAPI';
import { Message } from './types';
import { playClick, playStart, playReward } from './utils/audio';
import { InteractiveFlashcards } from './components/InteractiveFlashcards';
import { FeedbackLog } from './types';

type MenuMode = 'student' | 'teacher' | 'exercises' | 'beginner' | 'progress' | 'flashcards';

export type DifficultyId = 'seedling' | 'bloom' | 'nightshade';

export const DIFFICULTIES: {
  id: DifficultyId;
  name: string;
  levels: string;
  note: string;
  directive: string;
}[] = [
  {
    id: 'seedling',
    name: 'Seedling',
    levels: 'A1 · A2',
    note: 'Short, gentle sentences. Everyday words, present and past simple.',
    directive: 'Difficulty: Seedling (A1-A2). Speak slowly and warmly in short, simple sentences using very common words and simple tenses. Offer a gentle hint if the learner hesitates.'
  },
  {
    id: 'bloom',
    name: 'Bloom',
    levels: 'B1 · B2',
    note: 'Natural pace. Comparatives, connectors, richer small talk.',
    directive: 'Difficulty: Bloom (B1-B2). Speak at a natural conversational pace with a broader vocabulary, comparatives and connecting words. Gently nudge the learner beyond simple tenses.'
  },
  {
    id: 'nightshade',
    name: 'Nightshade',
    levels: 'C1',
    note: 'Idioms, complex clauses, a beautiful menace in the language.',
    directive: 'Difficulty: Nightshade (C1). Speak with idiomatic, richly descriptive and faintly unsettling language, using complex clauses and less common vocabulary. Expect the learner to keep up.'
  }
];

export interface AppTheme {
  primary: string;           
  textPrimary: string;       
  textLight: string;         
  textMedium: string;        
  textMuted: string;         
  badgeBg: string;           
  borderDouble: string;      
  borderSingle: string;      
  accentBtn: string;         
  accentBtnDisabled: string; 
  shadowGlow: string;        
  glowHex: string;           
  bgGradient: string;        
  glowClass: string;         
  activeIconColor: string;   
  svgPrimary: string;        
  svgSecondary: string;      
}

export const THEMES: Record<MenuMode, AppTheme> = {
  student: {
    primary: 'leaf',
    textPrimary: 'text-amber-300',
    textLight: 'text-amber-100',
    textMedium: 'text-amber-200',
    textMuted: 'text-amber-300/60',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    borderDouble: 'border-amber-300/45',
    borderSingle: 'border-amber-900/45',
    accentBtn: 'bg-amber-400 hover:bg-amber-300 text-black font-extrabold',
    accentBtnDisabled: 'disabled:bg-amber-950/60 disabled:text-amber-300/40',
    shadowGlow: 'shadow-[0_0_18px_rgba(201,162,75,0.35)]',
    glowHex: '#c9a24b',
    bgGradient: 'from-rose-950/25 via-zinc-950/60 to-black/90',
    glowClass: 'hover:shadow-[0_0_38px_rgba(201,162,75,0.28)]',
    activeIconColor: 'text-amber-300',
    svgPrimary: '#c9a24b',
    svgSecondary: '#e8c97c'
  },
  teacher: {
    primary: 'moss',
    textPrimary: 'text-emerald-300',
    textLight: 'text-emerald-100',
    textMedium: 'text-emerald-200',
    textMuted: 'text-emerald-300/60',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    borderDouble: 'border-emerald-300/40',
    borderSingle: 'border-emerald-900/45',
    accentBtn: 'bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold',
    accentBtnDisabled: 'disabled:bg-emerald-950/60 disabled:text-emerald-300/40',
    shadowGlow: 'shadow-[0_0_18px_rgba(147,174,148,0.32)]',
    glowHex: '#93ae94',
    bgGradient: 'from-emerald-950/30 via-zinc-950/60 to-black/90',
    glowClass: 'hover:shadow-[0_0_38px_rgba(147,174,148,0.26)]',
    activeIconColor: 'text-emerald-300',
    svgPrimary: '#93ae94',
    svgSecondary: '#c9d9c2'
  },
  beginner: {
    primary: 'nightshade',
    textPrimary: 'text-fuchsia-300',
    textLight: 'text-fuchsia-100',
    textMedium: 'text-fuchsia-200',
    textMuted: 'text-fuchsia-300/60',
    badgeBg: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30',
    borderDouble: 'border-fuchsia-300/40',
    borderSingle: 'border-fuchsia-900/45',
    accentBtn: 'bg-fuchsia-400 hover:bg-fuchsia-300 text-black font-extrabold',
    accentBtnDisabled: 'disabled:bg-fuchsia-950/60 disabled:text-fuchsia-300/40',
    shadowGlow: 'shadow-[0_0_18px_rgba(168,82,104,0.35)]',
    glowHex: '#a85268',
    bgGradient: 'from-fuchsia-950/25 via-purple-950/50 to-black/90',
    glowClass: 'hover:shadow-[0_0_38px_rgba(168,82,104,0.28)]',
    activeIconColor: 'text-fuchsia-300',
    svgPrimary: '#a85268',
    svgSecondary: '#d8a3b1'
  },
  exercises: {
    primary: 'gold',
    textPrimary: 'text-amber-300',
    textLight: 'text-amber-100',
    textMedium: 'text-amber-200',
    textMuted: 'text-amber-300/60',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    borderDouble: 'border-amber-300/45',
    borderSingle: 'border-amber-950/50',
    accentBtn: 'bg-amber-400 hover:bg-amber-300 text-black font-extrabold',
    accentBtnDisabled: 'disabled:bg-amber-950/60 disabled:text-amber-300/40',
    shadowGlow: 'shadow-[0_0_18px_rgba(201,162,75,0.45)]',
    glowHex: '#d2a64e',
    bgGradient: 'from-amber-950/30 via-zinc-950/60 to-black/90',
    glowClass: 'hover:shadow-[0_0_38px_rgba(210,166,78,0.3)]',
    activeIconColor: 'text-amber-300',
    svgPrimary: '#d2a64e',
    svgSecondary: '#f0dca8'
  },
  progress: {
    primary: 'dried-rose',
    textPrimary: 'text-rose-300',
    textLight: 'text-rose-100',
    textMedium: 'text-rose-200',
    textMuted: 'text-rose-300/60',
    badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    borderDouble: 'border-rose-300/40',
    borderSingle: 'border-rose-950/60',
    accentBtn: 'bg-rose-500 hover:bg-rose-400 text-black font-extrabold',
    accentBtnDisabled: 'disabled:bg-rose-950/60 disabled:text-rose-300/40',
    shadowGlow: 'shadow-[0_0_18px_rgba(156,53,80,0.45)]',
    glowHex: '#9c3550',
    bgGradient: 'from-rose-950/30 via-zinc-950/60 to-black/90',
    glowClass: 'hover:shadow-[0_0_38px_rgba(156,53,80,0.3)]',
    activeIconColor: 'text-rose-300',
    svgPrimary: '#9c3550',
    svgSecondary: '#d08c9d'
  },
  flashcards: {
    primary: 'bruised-plum',
    textPrimary: 'text-indigo-300',
    textLight: 'text-indigo-100',
    textMedium: 'text-indigo-200',
    textMuted: 'text-indigo-300/60',
    badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    borderDouble: 'border-indigo-300/40',
    borderSingle: 'border-indigo-950/60',
    accentBtn: 'bg-indigo-500 hover:bg-indigo-400 text-black font-extrabold',
    accentBtnDisabled: 'disabled:bg-indigo-950/60 disabled:text-indigo-300/40',
    shadowGlow: 'shadow-[0_0_18px_rgba(134,98,138,0.4)]',
    glowHex: '#86628a',
    bgGradient: 'from-indigo-950/30 via-zinc-950/60 to-black/90',
    glowClass: 'hover:shadow-[0_0_38px_rgba(134,98,138,0.28)]',
    activeIconColor: 'text-indigo-300',
    svgPrimary: '#86628a',
    svgSecondary: '#c4adc6'
  }
};

export default function App() {
  const [mode, setMode] = useState<MenuMode>(() => {
    return (localStorage.getItem('linguaRole_mode') as MenuMode) || 'student';
  });
  const activeTheme = THEMES[mode] || THEMES.student;

  const [showDialogue, setShowDialogue] = useState(true);
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('linguaRole_student') || '';
  });
  const [selectedRole, setSelectedRole] = useState(() => {
    const saved = localStorage.getItem('linguaRole_role');
    if (saved) {
      const found = ROLES.find(r => r.id === saved);
      if (found) return found;
    }
    return ROLES[0];
  });
  const [selectedTopic, setSelectedTopic] = useState(() => {
    const savedRole = localStorage.getItem('linguaRole_role');
    const role = savedRole ? ROLES.find(r => r.id === savedRole) : ROLES[0];
    const defaultTopicId = role ? role.topicId : null;
    
    const saved = localStorage.getItem('linguaRole_topic');
    if (saved && TOPICS.find(t => t.id === saved)) {
      return TOPICS.find(t => t.id === saved)!;
    } else if (defaultTopicId && TOPICS.find(t => t.id === defaultTopicId)) {
      return TOPICS.find(t => t.id === defaultTopicId)!;
    }
    return TOPICS[0];
  });

  const [isPremium, setIsPremium] = useState(false);
  const [isBookPurchased, setIsBookPurchased] = useState(false);
  const [selectedGrammarTopic, setSelectedGrammarTopic] = useState(() => GRAMMAR_TOPICS[0]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  
  // Use state to hold the current active exercise
  const [currentExercise, setCurrentExercise] = useState(EXERCISES[0]);
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [exercisesCompleted, setExercisesCompleted] = useState(0);

  // New Interactive Exercise States
  const [exerciseStyle, setExerciseStyle] = useState<'choice' | 'spell' | 'unscramble'>('choice');
  const [spellInput, setSpellInput] = useState('');
  const [spellHintTriggered, setSpellHintTriggered] = useState(false);
  const [unscrambleOptions, setUnscrambleOptions] = useState<string[]>([]);
  const [unscrambleSelected, setUnscrambleSelected] = useState<string[]>([]);
  const [exerciseStreak, setExerciseStreak] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState<Record<number, boolean>>({});
  const [spellError, setSpellError] = useState(false);

  // Memoize correct words and full sentence to avoid redundant string parsing
  const { unscrambleCorrectWords, unscrambleFullSentence } = useMemo(() => {
    if (!currentExercise) return { unscrambleCorrectWords: [], unscrambleFullSentence: "" };
    try {
      const correctWord = currentExercise.options[currentExercise.answer];
      const fullSentence = currentExercise.question.replace(/_____+|____|___/g, correctWord);
      const words = fullSentence.split(/\s+/).filter(Boolean);
      return { unscrambleCorrectWords: words, unscrambleFullSentence: fullSentence };
    } catch (e) {
      console.error("Failed to parse exercise text", e);
      return { unscrambleCorrectWords: [], unscrambleFullSentence: "" };
    }
  }, [currentExercise]);

  // Synchronize new exercise state
  useEffect(() => {
    if (!currentExercise) return;
    setSelectedAnswer(null);
    setSpellInput('');
    setSpellHintTriggered(false);
    setSpellError(false);
    setIncorrectAttempts({});
    
    // Prepare sentence unscrambler words
    try {
      // Randomly shuffle
      const shuffled = [...unscrambleCorrectWords].sort(() => Math.random() - 0.5);
      
      setUnscrambleOptions(shuffled);
      setUnscrambleSelected([]);
    } catch (e) {
      console.error("Failed to prepare unscramble options", e);
    }
  }, [currentExercise, unscrambleCorrectWords]);

  const generateNewExercise = useCallback(async () => {
    setIsGeneratingExercise(true);
    try {
      const randomTopic = GRAMMAR_TOPICS[Math.floor(Math.random() * GRAMMAR_TOPICS.length)];
      const response = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ randomTopic })
      });
      if (!response.ok) throw new Error("Failed to generate exercise");
      const exercise = await response.json();
      setCurrentExercise({ ...exercise, id: Date.now(), topic: randomTopic.title });
    } catch (error) {
      console.warn("Failed to dynamically generate exercise via Gemini API, falling back to a preloaded study card:", error);
      const randomPreloaded = EXERCISES[Math.floor(Math.random() * EXERCISES.length)];
      setCurrentExercise({ ...randomPreloaded, id: Date.now() });
    } finally {
      setIsGeneratingExercise(false);
    }
  }, []);

  const handleChoiceSelect = useCallback((idx: number) => {
    if (selectedAnswer !== null) return;
    
    if (idx === currentExercise.answer) {
      setSelectedAnswer(idx);
      setExercisesCompleted(prev => prev + 1);
      setExerciseStreak(prev => prev + 1);
      playReward();

      try {
        const feedbackLogs = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
        feedbackLogs.push({
          role: "Gothic Exercise Tutor",
          date: new Date().toISOString(),
          topic: currentExercise.topic,
          comments: `Successfully mastered exercise: "${currentExercise.question}" using Runes Choice.`,
          ratingAI: 5,
          ratingTopic: 5
        });
        localStorage.setItem('linguaRole_feedback', JSON.stringify(feedbackLogs));
      } catch (e) {
        console.error(e);
      }
    } else {
      setIncorrectAttempts(prev => ({ ...prev, [idx]: true }));
      setExerciseStreak(0);
      playClick();
    }
  }, [currentExercise, selectedAnswer]);

  const verifyScribeAnswer = useCallback(() => {
    if (!currentExercise || selectedAnswer !== null) return;
    const norm = (s: string) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    const correct = currentExercise.options[currentExercise.answer];
    
    if (norm(spellInput) === norm(correct)) {
      setSelectedAnswer(currentExercise.answer);
      setExercisesCompleted(prev => prev + 1);
      setExerciseStreak(prev => prev + 1);
      playReward();

      try {
        const feedbackLogs = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
        feedbackLogs.push({
          role: "Gothic Exercise Tutor",
          date: new Date().toISOString(),
          topic: currentExercise.topic,
          comments: `Successfully mastered Scribe Ritual for: "${currentExercise.question}" with correct spelling "${correct}".`,
          ratingAI: 5,
          ratingTopic: 5
        });
        localStorage.setItem('linguaRole_feedback', JSON.stringify(feedbackLogs));
      } catch (e) {
        console.error(e);
      }
    } else {
      setSpellError(true);
      setExerciseStreak(0);
      playClick();
      setTimeout(() => {
        setSpellError(false);
      }, 850);
    }
  }, [currentExercise, spellInput, selectedAnswer]);

  const verifyUnscrambleAnswer = useCallback(() => {
    if (!currentExercise || selectedAnswer !== null) return;
    const norm = (s: string) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    const isCorrect = unscrambleSelected.map(norm).join(' ') === unscrambleCorrectWords.map(norm).join(' ');
    
    if (isCorrect) {
      setSelectedAnswer(currentExercise.answer);
      setExercisesCompleted(prev => prev + 1);
      setExerciseStreak(prev => prev + 1);
      playReward();

      try {
        const feedbackLogs = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
        feedbackLogs.push({
          role: "Gothic Exercise Tutor",
          date: new Date().toISOString(),
          topic: currentExercise.topic,
          comments: `Successfully mastered Incantation order for sentence: "${unscrambleFullSentence}".`,
          ratingAI: 5,
          ratingTopic: 5
        });
        localStorage.setItem('linguaRole_feedback', JSON.stringify(feedbackLogs));
      } catch (e) {
        console.error(e);
      }
    } else {
      setSpellError(true);
      setExerciseStreak(0);
      playClick();
      setTimeout(() => {
        setSpellError(false);
      }, 850);
    }
  }, [currentExercise, unscrambleSelected, selectedAnswer]);

  const downloadPDFSummary = useCallback(() => {
    try {
      playClick();
      const doc = new jsPDF();
      
      const runes = (exercisesCompleted * 150) + 1200;
      const lvl = Math.floor(runes / 1000);
      let logs: FeedbackLog[] = [];
      try {
        logs = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
      } catch (e) {
        console.error("Local storage error:", e);
      }

      // Add elegant border representing the Gothic chamber frame
      doc.setDrawColor(120, 20, 20); // Deep Gothic Crimson
      doc.setLineWidth(1);
      doc.rect(10, 10, 190, 277);
      
      doc.setLineWidth(0.5);
      doc.rect(12, 12, 186, 273);

      let y = 30;

      // Title Banner
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(120, 20, 20); // Gothic Crimson
      doc.text("GOTHIC PROGRESS LEDGER", 105, y, { align: "center" });
      
      y += 8;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text("Chamber of LinguaRole Eloquence Training", 105, y, { align: "center" });

      y += 10;
      doc.setLineWidth(0.5);
      doc.setDrawColor(120, 20, 20);
      doc.line(20, y, 190, y);
      
      // Decorative scroll ornament in red
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(120, 20, 20);
      doc.text("✦   ───   ✦   ───   ✦", 105, y + 5, { align: "center" });

      y += 12;

      // Section 1: Runic Standing Box (styled like a parchment card)
      doc.setFillColor(248, 246, 242); // Warm cream
      doc.rect(20, y, 170, 32, "F");
      doc.setDrawColor(180, 160, 130); // Antique gold
      doc.rect(20, y, 170, 32, "S");

      // Card Content
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("RUNIC ENGRAVINGS (CURRENT STANDING)", 25, y + 7);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(120, 20, 20);
      doc.text("Gothic Eloquence Level:", 25, y + 15);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`Level ${lvl} (Speaker / Adept)`, 72, y + 15);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 20, 20);
      doc.text("Total Runic Essence:", 25, y + 21);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`${runes.toLocaleString()} ✦`, 72, y + 21);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 20, 20);
      doc.text("Rituals Completed:", 25, y + 27);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`${exercisesCompleted} exercises mastered successfully`, 72, y + 27);

      y += 42;

      // Section 2: Dialogue Feedback Scrolls
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(120, 20, 20);
      doc.text("SCROLLS OF RECENT FEEDBACK DIALOGUES", 20, y);

      y += 4;
      doc.setLineWidth(0.3);
      doc.setDrawColor(120, 20, 20);
      doc.line(20, y, 190, y);
      
      y += 6;

      const recentLogs = [...logs].reverse().slice(0, 3); // Fit top 3 logs beautifully
      
      if (recentLogs.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(100, 100, 100);
        doc.text('"No feedback echo has been recorded in the scrolls of dialog yet. Complete exercises and roleplays to write to your scrolls."', 25, y + 4);
        y += 12;
      } else {
        recentLogs.forEach((log: FeedbackLog) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(120, 20, 20);
          doc.text(`• ${log.role || 'Gothic Tutor'}`, 20, y);

          const dateStr = log.date ? new Date(log.date).toLocaleDateString() : 'Unknown Date';
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(110, 110, 110);
          doc.text(`(${dateStr})`, 165, y);

          y += 4.5;
          doc.setFont("helvetica", "bold");
          doc.setTextColor(60, 60, 60);
          doc.text("Topic:", 25, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 80, 80);
          doc.text(`${log.topic || 'General Converse'}`, 37, y);

          y += 4.5;
          if (log.comments) {
            doc.setFont("helvetica", "italic");
            doc.setTextColor(80, 30, 30);
            const wrappedComments = doc.splitTextToSize(`"${log.comments}"`, 160);
            doc.text(wrappedComments, 25, y);
            y += (wrappedComments.length * 4.5);
          }
          y += 3; // minimal entry padding
        });
      }

      // Safe margins checking before starting section 3
      if (y > 175) {
        doc.addPage();
        // Redraw outer borders
        doc.setDrawColor(120, 20, 20);
        doc.setLineWidth(1);
        doc.rect(10, 10, 190, 277);
        doc.setLineWidth(0.5);
        doc.rect(12, 12, 186, 273);
        y = 25;
      }

      // Section 3: Practical Self-Study Guide
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(120, 20, 20);
      doc.text("PRACTICAL SELF-STUDY SUGGESTIONS", 20, y);

      y += 4;
      doc.setLineWidth(0.3);
      doc.setDrawColor(120, 20, 20);
      doc.line(20, y, 190, y);

      y += 7;

      const suggestions = [
        {
          title: "1. The 10-Minute Scribe Ritual (Active Synthesis)",
          desc: "Spend at least 10 minutes inside Scribe mode. Forcing yourself to write grammar patterns in full anchors key parts of speech in your motor memory better than passive selection."
        },
        {
          title: "2. Phonetic Dialogue Echoing (Vocal Tuning)",
          desc: "Before speaking in active dialog channels, use the 'Volume Horn' to listen to standard pronunciations. Intentionally repeat and match the pacing and pitch of the whisper to train your vocal cords."
        },
        {
          title: "3. Spaced Runic Recall (Temporal Strength)",
          desc: "Grammars like past tenses require multiple exposures. Re-test older sections twice a week. When streaks break, read the 'Explanation' tab carefully to learn structural semantics."
        },
        {
          title: "4. Apply Tenses in Roleplay (Interactive Engagement)",
          desc: "Have conversations using multiple topics in Student, Beginner, and Teacher dialogs. Push yourself to practice a target grammar item (e.g., phrasal verbs) actively in your own prompts."
        }
      ];

      suggestions.forEach((s) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(30, 30, 30);
        doc.text(s.title, 20, y);

        y += 4.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const wrappedDesc = doc.splitTextToSize(s.desc, 165);
        doc.text(wrappedDesc, 20, y);
        y += (wrappedDesc.length * 4.2) + 3;
      });

      // Page footer decoration
      y = 270;
      doc.setLineWidth(0.2);
      doc.setDrawColor(180, 160, 130);
      doc.line(20, y, 190, y);
      
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Self-Study Ledger Generated on ${today} • LinguaRole English Gothic Academy`, 105, y + 5, { align: "center" });

      doc.save(`Gothic_Progress_Ledger_${today.replace(/[\s,]+/g, "_")}.pdf`);
    } catch (e) {
      console.error("PDF generator error:", e);
    }
  }, [exercisesCompleted]);

  const [showFeedback, setShowFeedback] = useState(false);
  const [ratingAI, setRatingAI] = useState(0);
  const [ratingTopic, setRatingTopic] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [sessionTime, setSessionTime] = useState(180);
  const [aiFeedbackReport, setAiFeedbackReport] = useState<string | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [expandedLogIndex, setExpandedLogIndex] = useState<number | null>(null);

  const { isConnected, isConnecting, error, connect, disconnect, userTranscript, aiTranscript, requestFeedback, hasMicrophone, sendTextMessage } = useLiveAPI();
  const [textInput, setTextInput] = useState("");

  // ElevenLabs Premium Voice Mode States
  const [elevenLabsMode, setElevenLabsMode] = useState(false);
  const [elevenLabsConnected, setElevenLabsConnected] = useState(false);
  const [elevenLabsLoading, setElevenLabsLoading] = useState(false);
  const [elevenMessages, setElevenMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [elevenWarning, setElevenWarning] = useState<string | null>(null);

  const ELEVENLABS_VOICES: Record<string, string> = {
    "Puck": "EXAVITQu4vr4xnSDxMaL",      // Sarah
    "Zephyr": "TX3LPaxmHKxFdv7VOQHJ",    // Liam
    "Charon": "pNInz6obpgDQGcFmaJgB",    // Adam
    "Fenrir": "JBFqnCBsd6RMkjVDRZzb",    // George
    "Kore": "cgSgspJ2msm6clMCkdW9",      // Jessica
    "Aoede": "pFZP5JQG7iQjIQuC4Bku",     // Lily
  };

  const isSessionConnected = isConnected || elevenLabsConnected;
  const isSessionConnecting = isConnecting || elevenLabsLoading;

  const [difficulty, setDifficulty] = useState<DifficultyId>(() => {
    const saved = localStorage.getItem('linguarole_difficulty') as DifficultyId | null;
    return saved && DIFFICULTIES.some(d => d.id === saved) ? saved : 'bloom';
  });
  const activeDifficulty = DIFFICULTIES.find(d => d.id === difficulty) ?? DIFFICULTIES[1];

  useEffect(() => {
    localStorage.setItem('linguarole_difficulty', difficulty);
  }, [difficulty]);

  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'all' | 'A1' | 'A2' | 'B1_B2' | 'C1'>('all');
  const [roleSearchQuery, setRoleSearchQuery] = useState("");

  const getRoleLevel = useCallback((roleId: string, roleName: string): string => {
    const nameUpper = roleName.toUpperCase();
    if (nameUpper.includes("A1") && nameUpper.includes("A2")) return "A1/A2";
    if (nameUpper.includes("A1")) return "A1";
    if (nameUpper.includes("A2")) return "A2";
    if (nameUpper.includes("B2") && nameUpper.includes("C1")) return "B2/C1";
    if (nameUpper.includes("B2")) return "B2";
    if (nameUpper.includes("C1")) return "C1";
    
    // Fallback map by ID
    const map: Record<string, string> = {
      interviewer: "B2",
      customer_service: "B1",
      doctor: "B2",
      travel_agent: "A2",
      angry_wife: "B1",
      tourist: "A2",
      evil_twin: "B2",
      angry_husband: "B1",
      sad_pet: "B1",
      restaurant_waiter: "A2",
      lost_traveler: "A2",
      landlord: "B2",
      unit_1_role: "A2"
    };
    return map[roleId] || "B1";
  }, []);

  const baseFilteredRoles = useMemo(() => {
    return ROLES.filter(r => mode !== 'beginner' || r.id in BEGINNER_DIALOGUES);
  }, [mode]);

  const finalFilteredRoles = useMemo(() => {
    return baseFilteredRoles.filter(r => {
      // 1. Search filter matches name, description, or winCondition
      const matchesSearch = !roleSearchQuery.trim() || 
        r.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) || 
        r.description.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
        r.winCondition.toLowerCase().includes(roleSearchQuery.toLowerCase());
        
      if (!matchesSearch) return false;
      
      // 2. Chosen difficulty narrows the partner list
      if (mode === 'student') {
        const lvl = getRoleLevel(r.id, r.name);
        if (difficulty === 'seedling') return lvl.includes("A1") || lvl.includes("A2");
        if (difficulty === 'bloom') return lvl.includes("B1") || lvl.includes("B2");
        if (difficulty === 'nightshade') return lvl.includes("C1");
      }

      // 3. Optional manual level filter
      if (selectedLevelFilter === 'all') return true;
      const lvl = getRoleLevel(r.id, r.name);

      if (selectedLevelFilter === 'A1') return lvl.includes("A1");
      if (selectedLevelFilter === 'A2') return lvl.includes("A2");
      if (selectedLevelFilter === 'B1_B2') return lvl.includes("B1") || lvl.includes("B2");
      if (selectedLevelFilter === 'C1') return lvl.includes("C1");

      return true;
    });
  }, [baseFilteredRoles, roleSearchQuery, selectedLevelFilter, difficulty, mode, getRoleLevel]);

  const chooseDifficulty = useCallback((next: DifficultyId) => {
    setDifficulty(next);
    if (mode !== 'student') return;
    const matches = (r: { id?: string; name: string }) => {
      const lvl = getRoleLevel(r.id, r.name);
      if (next === 'seedling') return lvl.includes("A1") || lvl.includes("A2");
      if (next === 'bloom') return lvl.includes("B1") || lvl.includes("B2");
      return lvl.includes("C1");
    };
    if (!matches(selectedRole)) {
      const first = ROLES.find(matches);
      if (first) {
        setSelectedRole(first);
        const topic = TOPICS.find(t => t.id === first.topicId);
        if (topic) setSelectedTopic(topic);
      }
    }
  }, [mode, getRoleLevel, selectedRole]);

  const activeUserTranscript = useMemo(() => {
    if (elevenLabsMode) {
      return elevenMessages.reduce((acc, m) => {
        if (m.role === 'user') {
          return acc ? acc + ' ' + m.text : m.text;
        }
        return acc;
      }, '');
    }
    return userTranscript;
  }, [elevenLabsMode, elevenMessages, userTranscript]);

  const activeAiTranscript = useMemo(() => {
    if (elevenLabsMode) {
      return elevenMessages.reduce((acc, m) => {
        if (m.role === 'model') {
          return acc ? acc + "\n\n" + m.text : m.text;
        }
        return acc;
      }, '');
    }
    return aiTranscript;
  }, [elevenLabsMode, elevenMessages, aiTranscript]);

  const handleElevenMessage = async (text: string) => {
    if (!text.trim()) return;
    setElevenLabsLoading(true);
    setElevenWarning(null);

    // Add user message to state
    setElevenMessages(prev => [...prev, { role: 'user', text }]);

    try {
      const introPrompt = `You are playing the role of ${selectedRole.name}. ${selectedRole.description}. The user is the student named ${studentName}; address them by name naturally. ${activeDifficulty.directive} Have a conversation with them in character and naturally encourage them to win. Keep your responses short, natural, and friendly (1-2 sentences).`;

      const response = await fetch("/api/chat-roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_input: text,
          persona_prompt: introPrompt,
          voice_id: ELEVENLABS_VOICES[selectedRole.voice] || "EXAVITQu4vr4xnSDxMaL"
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
        
        // Use standard browser speech synthesis for premium fallback
        const synth = window.speechSynthesis;
        if (synth) {
          const utterance = new SpeechSynthesisUtterance(finalMsg);
          utterance.lang = "en-US";
          synth.speak(utterance);
        }
      } else {
        // High fidelity audio playback from binary stream
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
      }

      setElevenMessages(prev => [...prev, { role: 'model', text: finalMsg }]);
    } catch (e: any) {
      console.error(e);
      setElevenWarning("Failed to generate voice response. Synthetic speech fallback selected.");
    } finally {
      setElevenLabsLoading(false);
    }
  };

  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setElevenWarning("Speech Recognition is not supported by your current browser. Please type your message.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        setIsRecording(false);
        const errType = e?.error;
        if (errType === 'not-allowed') {
          setElevenWarning("Microphone permission was not granted. You can type directly in the input box below.");
        } else if (errType === 'no-speech') {
          // Normal timeout when silence detected
        } else if (errType !== 'aborted') {
          setElevenWarning("Voice recognition ended. You can speak again or type your message.");
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          await handleElevenMessage(transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleElevenGetFeedback = async () => {
    if (elevenMessages.length === 0) {
      setElevenWarning("Talk with the partner first or type a message to generate session feedback.");
      return;
    }
    setElevenLabsLoading(true);
    setElevenWarning(null);
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

      if (!response.ok) {
        throw new Error("Failed to contact feedback server.");
      }

      const data = await response.json();
      const feedbackReport = data.feedback || "Unable to compile diagnostics report.";
      
      setElevenMessages(prev => [...prev, { role: 'model', text: `\n\n### 🎓 BILINGUAL DIAGNOSTIC REPORT\n\n${feedbackReport}` }]);
    } catch (e: any) {
      console.error(e);
      setElevenWarning("Failed to fetch diagnostics report. Standard fallback active.");
    } finally {
      setElevenLabsLoading(false);
    }
  };

  const dailyChallenge = useMemo(() => {
    const allItems: { type: 'vocabulary' | 'grammar', content: string, topic: string }[] = [];
    
    GRAMMAR_TOPICS.forEach(topic => {
      if (topic.grammar) allItems.push({ type: 'grammar', content: topic.grammar, topic: topic.title });
      topic.vocabulary.forEach(word => {
        allItems.push({ type: 'vocabulary', content: word, topic: topic.title });
      });
    });

    TOPICS.forEach(topic => {
      if (topic.grammar) {
        allItems.push({ type: 'grammar', content: topic.grammar, topic: topic.title });
      }
      topic.vocabulary.forEach(word => {
        allItems.push({ type: 'vocabulary', content: word, topic: topic.title });
      });
    });

    const dateStr = new Date().toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % allItems.length;
    return allItems[index];
  }, []);

  const [challengeCompleted, setChallengeCompleted] = useState(false);

  useEffect(() => {
    if (dailyChallenge && activeUserTranscript && !challengeCompleted) {
      const cleanChallenge = dailyChallenge.content.replace(/[()]/g, '').trim().toLowerCase();
      if (activeUserTranscript.toLowerCase().includes(cleanChallenge)) {
        setChallengeCompleted(true);
        playReward();
      }
    }
  }, [dailyChallenge, activeUserTranscript, challengeCompleted]);

  const isWordUsed = (word: string) => {
    if (!activeUserTranscript) return false;
    // Remove parentheses from vocabulary words like "(to give) feedback"
    const cleanWord = word.replace(/[()]/g, '').trim().toLowerCase();
    return activeUserTranscript.toLowerCase().includes(cleanWord);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionConnected) {
      interval = setInterval(() => {
        setSessionTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => {
              handleStop();
            }, 10);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setSessionTime(180);
    }
    return () => clearInterval(interval);
  }, [isSessionConnected]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    localStorage.setItem('linguaRole_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('linguaRole_student', studentName);
  }, [studentName]);

  useEffect(() => {
    localStorage.setItem('linguaRole_role', selectedRole.id);
  }, [selectedRole]);

  const rollDice = () => {
    playClick();
    const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    setSelectedTopic(randomTopic);
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
        const introPrompt = `You are playing the role of ${selectedRole.name}. ${selectedRole.description}. Greet the student named ${studentName} by name in your very first sentence, inside your character context, introducing yourself in exactly 1-2 short sentences. ${activeDifficulty.directive}`;
        
        const response = await fetch("/api/chat-roleplay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_input: "Hi! Greet me to begin our conversation.",
            persona_prompt: introPrompt,
            voice_id: ELEVENLABS_VOICES[selectedRole.voice] || "EXAVITQu4vr4xnSDxMaL"
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
      dailyChallenge,
      activeDifficulty.directive
    );
  };

  const triggerAIFeedback = async (historyData: Message[]) => {
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

  const handleStop = () => {
    playClick();

    // Compile dialogue history to send for feedback evaluation
    const historyData: Message[] = elevenLabsMode
      ? [...elevenMessages]
      : [
          ...(userTranscript ? [{ role: 'user' as const, text: userTranscript }] : []),
          ...(aiTranscript ? [{ role: 'model' as const, text: aiTranscript }] : [])
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
        dailyChallenge,
        activeDifficulty.directive
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

  return (
    <div className="min-h-screen font-sans selection:bg-amber-500/25 relative overflow-hidden text-amber-100">
      <BotanicalBackdrop />

      <div className="relative z-10 w-full">
        <header className="relative px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10">
          <div className="max-w-6xl mx-auto relative">
            <div className="relative rounded-[1.6rem] border border-amber-500/30 velvet-panel backdrop-blur-md overflow-hidden px-5 sm:px-10 py-8 sm:py-10">
              <div className="pointer-events-none absolute inset-[6px] rounded-[1.3rem] border border-amber-500/15" />
              <LeafSprig className="pointer-events-none absolute -top-2 -left-2 h-20 w-20 sm:h-28 sm:w-28 opacity-80 gold-ember" />
              <LeafSprig flipX className="pointer-events-none absolute -top-2 -right-2 h-20 w-20 sm:h-28 sm:w-28 opacity-70 gold-ember" />
              <LeafSprig flipY className="pointer-events-none absolute -bottom-2 -left-2 h-16 w-16 sm:h-20 sm:w-20 opacity-40" />
              <LeafSprig flipX flipY className="pointer-events-none absolute -bottom-2 -right-2 h-16 w-16 sm:h-20 sm:w-20 opacity-40" />

              <BotanicalEmblem className="mx-auto h-20 w-20 sm:h-24 sm:w-24 gold-ember" />

              <div className="relative z-10 flex flex-col items-center text-center mt-1">
                <p className="font-mono text-[9px] sm:text-[10px] tracking-[0.5em] uppercase text-amber-300/60">
                  Botanical Grammar Conservatory
                </p>
                <h1 className="gold-title text-[2.5rem] leading-[1.05] sm:text-6xl md:text-7xl mt-3">
                  LINGUAROLE
                </h1>
                <div className="mt-4 flex items-center gap-3 text-amber-200/70">
                  <span className="h-px w-8 sm:w-14 bg-amber-500/40" />
                  <p className="font-serif text-sm sm:text-lg tracking-[0.42em] uppercase">by Dark Art Studio</p>
                  <span className="h-px w-8 sm:w-14 bg-amber-500/40" />
                </div>
                <p className="font-serif italic text-amber-100/65 text-sm sm:text-base mt-4 max-w-xl leading-relaxed">
                  One to one conversation with something strange and beautiful. Choose a role play, set the depth,
                  sign your name — and the hothouse will answer you by it.
                </p>
              </div>

              <div className="relative z-10 mt-6 flex justify-center">
                <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-amber-300/55 border border-amber-500/25 rounded-full px-4 py-1.5">
                  Everyday Grammar · Specimen No. VII
                </span>
              </div>
            </div>

            <BotanicalDivider className="mt-6" />
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 px-3 pt-3">
              <p className="font-serif italic text-amber-100/55 text-xs sm:text-sm">
                “Speak, and the hothouse answers in gold.”
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-300/50">
                By Joshimar Lavid · Dark Art Studio
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Daily Challenge Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-[2rem] border-2 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.25)] bg-zinc-950/80 backdrop-blur-md max-w-2xl mx-auto w-full"
          >
            {/* Header section with blue background */}
            <div className="bg-blue-500 py-5 px-6 flex flex-col items-center justify-center text-black text-center">
              <Trophy size={36} className="mb-2 stroke-[2.5]" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em]">Daily Challenge</span>
            </div>

            {/* Body content section */}
            <div className="p-6 sm:p-8 flex flex-col gap-4 text-left border-t border-blue-500/20">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Zap size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-400">
                    Level Up Your {dailyChallenge.type === 'grammar' ? 'Grammar' : 'Vocabulary'}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white leading-tight uppercase">
                  Use "{dailyChallenge.content.toUpperCase()}"
                </h3>
                <p className="text-blue-200/80 text-sm sm:text-base font-medium leading-relaxed mt-1">
                  Practice this {dailyChallenge.type} from <span className="text-blue-100 font-bold">"{dailyChallenge.topic}"</span> in your next conversation to earn bonus runes!
                </p>
              </div>

              {/* Status Section */}
              <div className="flex flex-col items-center justify-center pt-4 border-t border-blue-900/20 mt-2">
                <AnimatePresence mode="wait">
                  {challengeCompleted ? (
                    <motion.div 
                      key="completed"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-2 text-emerald-400"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Zap fill="currentColor" size={20} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">Challenge Met!</span>
                    </motion.div>
                  ) : (
                    <div key="pending" className="flex flex-col items-center gap-2 text-blue-400/80">
                      <div className="w-12 h-12 rounded-full border border-blue-500/20 flex items-center justify-center text-blue-400/70">
                        <Zap size={20} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400/60">In Progress</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 glass-panel !border-red-500/50 rounded-2xl flex items-start gap-3 text-red-500"
          >
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold">Connection Error</h3>
              <p className="text-base mt-1 opacity-90">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-5 space-y-6">
            <GildedFrame title="The Ritual of Setup" icon={<Settings size={20} className={activeTheme.activeIconColor} />} theme={activeTheme}>
              
              <div className="space-y-5">
                <div className="flex bg-zinc-900/80 p-1 rounded-xl mb-2 border border-zinc-800/50 overflow-x-auto custom-scrollbar gap-1">
                  <button
                    onClick={() => { playClick(); setMode('student'); }}
                    disabled={isConnected || isConnecting}
                    className={`flex-1 py-2 px-3 min-w-[80px] text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${mode === 'student' ? 'bg-blue-500 text-black shadow-[0_0_12px_rgba(59,130,246,0.5)] border border-blue-400/50' : 'text-blue-300/60 hover:text-blue-200 hover:bg-blue-500/10'} disabled:opacity-50`}
                  >
                    Role Play
                  </button>
                  <button
                    onClick={() => { playClick(); setMode('teacher'); }}
                    disabled={isConnected || isConnecting}
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
                    disabled={isConnected || isConnecting}
                    className={`flex-1 py-2 px-3 min-w-[90px] text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${mode === 'beginner' ? 'bg-purple-500 text-black shadow-[0_0_12px_rgba(139,92,246,0.5)] border border-purple-400/50' : 'text-purple-300/60 hover:text-purple-200 hover:bg-purple-500/10'} disabled:opacity-50`}
                  >
                    Beginner
                  </button>
                  <button
                    onClick={() => { playClick(); setMode('exercises'); }}
                    disabled={isConnected || isConnecting}
                    className={`flex-1 py-2 px-3 min-w-[90px] text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${mode === 'exercises' ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-amber-400/50' : 'text-amber-300/60 hover:text-amber-200 hover:bg-amber-500/10'} disabled:opacity-50`}
                  >
                    Exercises
                  </button>
                  <button
                    onClick={() => { playClick(); setMode('progress'); }}
                    disabled={isConnected || isConnecting}
                    className={`flex-1 py-2 px-3 min-w-[90px] text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${mode === 'progress' ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] border border-red-500/50' : 'text-red-400/60 hover:text-red-200 hover:bg-red-500/10'} disabled:opacity-50`}
                  >
                    Progress
                  </button>
                  <button
                    onClick={() => { playClick(); setMode('flashcards'); }}
                    disabled={isConnected || isConnecting}
                    className={`flex-1 py-2 px-3 min-w-[100px] text-xs sm:text-sm font-black tracking-wider uppercase rounded-lg transition-all ${mode === 'flashcards' ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)] border border-indigo-500/50' : 'text-indigo-400/60 hover:text-indigo-200 hover:bg-indigo-500/10'} disabled:opacity-50`}
                  >
                    Flashcards
                  </button>
                </div>

                {(mode === 'student' || mode === 'beginner') ? (
                  <>
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

                    <div className="flex items-center gap-3">
                      <span className="font-display text-sm text-amber-300/90 border border-amber-500/35 rounded-full w-9 h-9 flex items-center justify-center bg-black/50 shadow-[0_0_16px_rgba(201,162,75,0.18)]">I</span>
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-amber-300/55">First</p>
                        <h3 className="gold-title text-sm tracking-[0.18em]">Choose your role play</h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <label className="block font-serif italic text-base text-amber-200/80">
                          {mode === 'beginner' ? 'Everyday beginner partner' : 'Who shall receive you?'}
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

                        <p className="font-serif italic text-xs text-amber-100/50 leading-relaxed">
                          {mode === 'student'
                            ? `The glass is filtered to ${activeDifficulty.name} specimens (${activeDifficulty.levels}).`
                            : 'Gentle, everyday exchanges with visible translations.'}
                        </p>
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
                            
                            // Color scheme mapping
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

                      {/* Step II — difficulty */}
                      <div className="pt-3 space-y-3 border-t border-amber-500/15">
                        <div className="flex items-center gap-3">
                          <span className="font-display text-sm text-amber-300/90 border border-amber-500/35 rounded-full w-9 h-9 flex items-center justify-center bg-black/50 shadow-[0_0_16px_rgba(201,162,75,0.18)]">II</span>
                          <div>
                            <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-amber-300/55">Second</p>
                            <h3 className="gold-title text-sm tracking-[0.18em]">Set the difficulty</h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {DIFFICULTIES.map(option => {
                            const isActive = difficulty === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                disabled={isSessionConnected || isSessionConnecting}
                                onClick={() => { playClick(); chooseDifficulty(option.id); }}
                                className={`text-left p-3.5 rounded-2xl border transition-all disabled:opacity-50 ${
                                  isActive
                                    ? 'border-amber-400/60 bg-amber-500/10 shadow-[0_0_20px_rgba(201,162,75,0.18)] ring-1 ring-amber-400/25'
                                    : 'border-zinc-800/70 bg-black/35 hover:border-amber-500/35 hover:bg-amber-950/15'
                                }`}
                              >
                                <span className={`block font-display text-xs tracking-[0.18em] uppercase ${isActive ? 'text-amber-200' : 'text-amber-100/70'}`}>
                                  {option.name}
                                </span>
                                <span className="block font-mono text-[10px] tracking-widest text-amber-300/60 mt-1">{option.levels}</span>
                                <span className="block font-serif text-[11px] leading-snug text-amber-100/55 mt-1.5">{option.note}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Step III — name */}
                      <div className="pt-3 space-y-2.5 border-t border-amber-500/15">
                        <div className="flex items-center gap-3">
                          <span className="font-display text-sm text-amber-300/90 border border-amber-500/35 rounded-full w-9 h-9 flex items-center justify-center bg-black/50 shadow-[0_0_16px_rgba(201,162,75,0.18)]">III</span>
                          <div>
                            <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-amber-300/55">Third</p>
                            <h3 className="gold-title text-sm tracking-[0.18em]">Sign your name</h3>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          disabled={isSessionConnected || isSessionConnecting}
                          placeholder="The name your partner will speak..."
                          aria-label="Your name"
                          className="velvet-input w-full rounded-xl px-5 py-3.5 outline-none transition-all disabled:opacity-50 font-serif text-lg tracking-wide placeholder:text-amber-300/25"
                        />
                        <p className="font-serif italic text-xs text-amber-100/55 leading-relaxed">
                          {studentName.trim()
                            ? `${selectedRole.name} will open the conversation by name, speaking to ${studentName.trim()} at ${activeDifficulty.name} depth.`
                            : 'Sign here first — your partner cannot greet you until it knows what to call you.'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : mode === 'teacher' ? (
                  <>
                    {!isPremium ? (
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 text-center">
                        <Lock className="mx-auto mb-3 text-blue-300/70" size={32} />
                        <h3 className="text-blue-200 font-bold tracking-widest uppercase mb-2">Teacher Mode Locked</h3>
                        <p className="text-blue-300/90 text-base mb-4">Upgrade to Premium to unlock Teacher Mode and practice specific grammar exercises.</p>
                        <button 
                          onClick={() => setIsPremium(true)}
                          className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 rounded-full font-bold tracking-widest uppercase text-base transition-all"
                        >
                          Upgrade Now (Demo)
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-base font-bold tracking-widest uppercase text-blue-300/90 mb-2">Grammar Topic</label>
                        <select
                          value={selectedGrammarTopic.id}
                          onChange={(e) => {
                            const topic = GRAMMAR_TOPICS.find(t => t.id === e.target.value);
                            if (topic) setSelectedGrammarTopic(topic);
                          }}
                          disabled={isConnected || isConnecting}
                          className="w-full bg-zinc-900/80 border border-zinc-800/50 text-blue-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 font-bold"
                        >
                          {GRAMMAR_TOPICS.map(topic => (
                            <option key={topic.id} value={topic.id}>
                              {topic.title}
                            </option>
                          ))}
                        </select>
                        {selectedGrammarTopic && (
                          <div className="mt-3 space-y-4">
                            <div className="p-4 bg-zinc-900/50 rounded-xl border border-blue-900/40 shadow-inner">
                              <p className="text-base text-blue-300/90 leading-relaxed font-medium">
                                {selectedGrammarTopic.description}
                              </p>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-blue-900/30">
                              <GrammarTensesReference />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : mode === 'exercises' ? (
                  <div className="bg-zinc-900/80 border border-amber-950/40 rounded-xl p-5 space-y-5">
                    <div className="flex items-center gap-2 border-b border-amber-950/25 pb-3">
                      <Sparkles className="text-amber-400 animate-pulse shrink-0" size={18} />
                      <h3 className="text-amber-400 font-extrabold tracking-widest uppercase text-xs sm:text-sm">AUTODIDACTIC TRAINING</h3>
                    </div>

                    {/* Progress Bar & Attempt limits */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-amber-300 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Zap size={12} className="text-amber-400" />
                          Attempts Balance
                        </span>
                        <span className="font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/30 text-[11px]">
                          {isBookPurchased ? "∞ Unlimited" : `${Math.min(exercisesCompleted, 5)} / 5 Used`}
                        </span>
                      </div>
                      <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden border border-amber-950/30 p-0.5">
                        <div 
                          className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: isBookPurchased ? "100%" : `${(Math.min(exercisesCompleted, 5) / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Eloquence Metrics */}
                    <div className="bg-zinc-950/50 p-4 rounded-xl border border-amber-950/30 space-y-3 shadow-inner">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <Trophy size={14} className="text-amber-400 shrink-0" />
                          Gothic Level
                        </span>
                        <span className="text-amber-400 font-bold font-mono">
                          Lvl {Math.floor(((exercisesCompleted * 150) + 1200) / 1000)} (Speaker)
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <Sparkle size={14} className="text-amber-500 shrink-0" />
                          Runic Essence
                        </span>
                        <span className="text-amber-400 font-extrabold font-mono text-base">
                          {(exercisesCompleted * 150) + 1200} ✦
                        </span>
                      </div>

                      {/* Active Streak */}
                      <div className="pt-2 border-t border-amber-950/20 flex items-center justify-between">
                        <span className="text-zinc-400 text-sm flex items-center gap-1.5">
                          <Flame size={14} className={exerciseStreak > 0 ? "text-orange-500 animate-bounce" : "text-zinc-650"} />
                          Mastery Streak
                        </span>
                        <span className={`font-mono text-sm font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                          exerciseStreak > 0 
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]' 
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                        }`}>
                          {exerciseStreak} {exerciseStreak > 0 && "🔥"}
                        </span>
                      </div>
                    </div>

                    {/* SELECT ARENA (Topics Filter List) */}
                    <div className="space-y-2 pt-1">
                      <h4 className="text-zinc-400 text-xs font-black tracking-widest uppercase">PRACTICE CHIEF UNITS</h4>
                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {[
                          { title: "Past Tenses", icon: "🕯️" },
                          { title: "Prepositions of Time", icon: "⏳" },
                          { title: "Comparisons", icon: "⚖️" },
                          { title: "Phrasal Verbs", icon: "🔮" },
                          { title: "Gerunds and Infinitives", icon: "⚙️" },
                          { title: "Future Forms", icon: "🌅" },
                          { title: "Idioms: Ease and Difficulty", titleShort: "Idioms", icon: "🎭" }
                        ].map((unit, idx) => {
                          const isActive = currentExercise && currentExercise.topic.toLowerCase().includes(unit.titleShort?.toLowerCase() || unit.title.toLowerCase());
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                playClick();
                                const foundIdx = EXERCISES.findIndex(ex => 
                                  ex.topic.toLowerCase().includes(unit.titleShort?.toLowerCase() || unit.title.toLowerCase())
                                );
                                if (foundIdx !== -1) {
                                  setCurrentExerciseIndex(foundIdx);
                                  setCurrentExercise(EXERCISES[foundIdx]);
                                }
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-all border ${
                                isActive 
                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-extrabold shadow-[inset_0_0_6px_rgba(217,119,6,0.15)] animate-pulse' 
                                  : 'bg-zinc-950/40 hover:bg-zinc-900 border-zinc-900 text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span className="opacity-80 text-sm">{unit.icon}</span>
                                <span className="truncate">{unit.titleShort || unit.title}</span>
                              </span>
                              <ChevronRight size={12} className={isActive ? "text-amber-400" : "text-zinc-600"} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Toggle spellbook manually or reset */}
                    <div className="space-y-2 pt-3 border-t border-amber-950/20">
                      {!isBookPurchased ? (
                        <button 
                          onClick={() => { playReward(); setIsBookPurchased(true); }}
                          className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black px-4 py-2.5 rounded-xl font-bold tracking-widest uppercase text-xs transition-all duration-300 shadow-[0_4px_12px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
                        >
                          <Lock size={12} />
                          Unlock Spellbook ($500)
                        </button>
                      ) : (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-500 font-bold">
                          <span className="text-[11px] text-amber-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                            <Sparkle size={11} className="text-amber-400 animate-spin" />
                            Infinite Key active
                          </span>
                          <button 
                            onClick={() => { playClick(); setIsBookPurchased(false); setExercisesCompleted(0); }}
                            className="text-[10px] text-zinc-550 hover:text-amber-400 font-bold underline cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900/80 border border-red-900/40 rounded-xl p-6 space-y-4">
                    <h3 className="text-red-400 font-bold tracking-widest uppercase text-sm">RUNE BALANCES & STATISTICS</h3>
                    <div className="flex justify-between items-center bg-zinc-950/70 p-3 rounded-lg border border-red-900/20 text-base">
                      <span className="text-zinc-400">Total Eloquence Runes</span>
                      <span className="text-red-400 font-bold">{(exercisesCompleted * 150) + 1200} ✦</span>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-950/70 p-3 rounded-lg border border-red-900/20 text-base">
                      <span className="text-zinc-400">Speaker Level</span>
                      <span className="text-red-400 font-bold">Level 4 (Adult)</span>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-950/70 p-3 rounded-lg border border-red-900/20 text-base">
                      <span className="text-zinc-400">Daily Goal Streak</span>
                      <span className="text-red-400 font-bold">4 Days 🔥</span>
                    </div>
                  </div>
                )}
              </div>
            </GildedFrame>
          </div>

          {/* Active Session & Topic Panel */}
          <div className="lg:col-span-7 space-y-6">
            {mode === 'exercises' ? (
              <GildedFrame title="Everyday Grammar Practice" icon={<Briefcase size={20} className={activeTheme.activeIconColor} />} theme={activeTheme}>
                
                {!isBookPurchased && exercisesCompleted >= 5 ? (
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto mb-4 text-amber-500" size={48} />
                      <h3 className="text-2xl font-display text-amber-400 mb-2">AUTODIDACTIC Exercises for Beginner Speakers</h3>
                      <p className="text-zinc-400 mb-6 max-w-md mx-auto">You've completed your 5 free attempts! Buy the practice auto didactic book as a one-time payment to access all Vocabulary and Topics.</p>
                      
                      <div className="bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-6 mb-8 text-left max-w-2xl mx-auto shadow-lg">
                        <h4 className="text-blue-200 font-bold tracking-widest uppercase text-lg mb-4 flex items-center justify-center gap-2">
                          📖 Book Summary
                        </h4>
                        <ul className="text-zinc-300 text-base space-y-3 font-medium list-disc pl-5 mb-6">
                          <li><span className="text-blue-100">Complete Beginner Grammar Guide:</span> Master foundational rules seamlessly.</li>
                          <li><span className="text-blue-100">Interactive Vocabulary Mastery:</span> Step-by-step topic-based lists.</li>
                          <li><span className="text-blue-100">Real-life Scenario Drills:</span> Practical exercises mirroring everyday situations.</li>
                          <li><span className="text-blue-100">Pronunciation Deep-Dives:</span> Detailed guides for difficult phonemes.</li>
                          <li><span className="text-blue-100">Unlimited Practice Access:</span> Take more than 50+ quizzes across 14 units.</li>
                        </ul>
                        <button 
                          onClick={() => setIsBookPurchased(true)}
                          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-xl font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all"
                        >
                          <Lock size={18} />
                          Buy Now for $500 MXN
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left opacity-50 pointer-events-none">
                        {GRAMMAR_TOPICS.map(topic => (
                          <div key={topic.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <h4 className="text-blue-200 font-bold text-base mb-1">{topic.title}</h4>
                            <p className="text-zinc-500 text-sm">{topic.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
                     {currentExercise && (
                      <>
                        {/* Training style select tabs */}
                        <div className="flex border-b border-amber-950/20 pb-4 mb-6 justify-between items-center flex-wrap gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-950/40 border border-amber-900/30 px-2 py-1 rounded">
                              Practice Style
                            </span>
                          </div>
                          <div className="flex bg-black/40 p-0.5 rounded-xl border border-amber-950/30 gap-1 text-[11px] font-extrabold uppercase tracking-wide">
                            {[
                              { id: 'choice', label: '🔮 Choice' },
                              { id: 'spell', label: '✍️ Scribe' },
                              { id: 'unscramble', label: '🧩 Order' }
                            ].map(style => (
                              <button
                                key={style.id}
                                onClick={() => { playClick(); setExerciseStyle(style.id as any); }}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                  exerciseStyle === style.id 
                                    ? 'bg-amber-600 text-black shadow-inner font-black' 
                                    : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Question content */}
                        <div className="flex justify-between items-start gap-4 mb-6">
                          <div className="flex-1">
                            <span className="text-amber-400/80 text-xs font-bold tracking-widest uppercase mb-1.5 block">
                              🔮 {currentExercise.topic}
                            </span>
                            {exerciseStyle === 'spell' ? (
                              <h3 className="text-xl sm:text-2xl text-white font-medium leading-relaxed leading-normal">
                                {currentExercise.question.split(/_____+|____|___/g).map((part, i, arr) => (
                                  <span key={i}>
                                    {part}
                                    {i < arr.length - 1 && (
                                      <span className={`inline-block mx-1.5 px-3 py-0.5 bg-black/80 border-b-2 font-bold font-mono text-lg tracking-wide rounded ${
                                        selectedAnswer !== null 
                                          ? 'border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)] bg-emerald-950/15'
                                          : spellError 
                                            ? 'border-red-500 text-red-500 animate-pulse bg-red-950/20'
                                            : 'border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                                      }`}>
                                        {spellInput || "_____"}
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </h3>
                            ) : (
                              <h3 className="text-xl sm:text-2xl text-white font-medium leading-relaxed">
                                {currentExercise.question}
                              </h3>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              playClick();
                              const correctWord = currentExercise.options[currentExercise.answer];
                              const fullSentence = currentExercise.question.replace(/_____+|____/g, correctWord);
                              if (window.speechSynthesis) {
                                window.speechSynthesis.cancel();
                                const utterance = new SpeechSynthesisUtterance(fullSentence);
                                utterance.lang = 'en-US';
                                utterance.rate = 0.85;
                                utterance.pitch = 0.95;
                                window.speechSynthesis.speak(utterance);
                              }
                            }}
                            className="p-2.5 rounded-xl border border-amber-950/30 bg-black/45 hover:bg-amber-950/15 text-amber-400 hover:text-amber-300 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                            title="Whisper sentence aloud"
                          >
                            <Volume2 size={16} className="animate-pulse" />
                          </button>
                        </div>

                        {/* INSTRUCTION DETAIL INTERACTION AREA */}
                        {exerciseStyle === 'choice' && (
                          <div className="space-y-3">
                            {currentExercise.options.map((option, idx) => {
                              const isSelected = selectedAnswer === idx;
                              const isCorrect = idx === currentExercise.answer;
                              const showCorrect = selectedAnswer !== null && isCorrect;
                              const wasWrong = incorrectAttempts[idx];
                              
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleChoiceSelect(idx)}
                                  disabled={selectedAnswer !== null}
                                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-sm sm:text-base font-medium text-left ${
                                    showCorrect 
                                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)]' 
                                      : wasWrong 
                                        ? 'bg-red-500/10 border-red-900/60 text-red-400 opacity-80 line-through decoration-red-950' 
                                        : selectedAnswer === null 
                                          ? 'bg-zinc-900/80 border-amber-950/20 hover:border-amber-500/50 hover:bg-zinc-850/70 text-zinc-300 hover:text-white cursor-pointer' 
                                          : 'bg-zinc-900/40 border-zinc-850/40 text-zinc-650 opacity-40'
                                  }`}
                                >
                                  <span className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono border ${
                                      showCorrect 
                                        ? 'bg-amber-500 border-yellow-400 text-black' 
                                        : wasWrong 
                                          ? 'bg-red-955 border-red-500 text-red-400' 
                                          : 'bg-black/60 border-amber-950/40 text-amber-500/50'
                                    }`}>
                                      {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span>{option}</span>
                                  </span>
                                  {showCorrect && <Check size={16} className="text-amber-500 filter drop-shadow animate-bounce" />}
                                  {wasWrong && <X size={16} className="text-red-500" />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {exerciseStyle === 'spell' && (
                          <motion.div 
                            animate={spellError ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
                            transition={{ duration: 0.5 }}
                            className="space-y-4 max-w-lg mx-auto w-full"
                          >
                            <div className="relative">
                              <input
                                type="text"
                                value={spellInput}
                                onChange={(e) => {
                                  setSpellError(false);
                                  setSpellInput(e.target.value);
                                }}
                                disabled={selectedAnswer !== null}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && selectedAnswer === null && spellInput.trim()) {
                                    verifyScribeAnswer();
                                  }
                                }}
                                placeholder="Write the scribe entry..."
                                className={`w-full bg-black/60 border-2 rounded-xl py-3.5 px-4 outline-none transition-all text-center tracking-wider font-semibold placeholder:text-zinc-600 ${
                                  selectedAnswer !== null
                                    ? 'border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                    : spellError
                                      ? 'border-red-600 text-red-400 focus:border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse'
                                      : 'border-amber-950/40 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 text-amber-200'
                                }`}
                              />
                              {selectedAnswer !== null && (
                                <div className="absolute right-3.5 top-3.5 text-emerald-400 flex items-center gap-1 text-xs font-black uppercase tracking-widest bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/40 animate-pulse">
                                  <Check size={12} /> Passed
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2.5">
                              {selectedAnswer === null ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => verifyScribeAnswer()}
                                    disabled={!spellInput.trim()}
                                    className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:pointer-events-none text-black py-2.5 px-4 rounded-xl font-bold tracking-widest uppercase text-xs transition-all shadow-md hover:scale-[1.01] cursor-pointer"
                                  >
                                    Cast Inscription
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playClick();
                                      setSpellHintTriggered(true);
                                    }}
                                    className="bg-black/40 hover:bg-zinc-900 border border-amber-950/20 text-amber-200 hover:text-amber-300 py-2.5 px-4 rounded-xl font-bold tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                                    title="Unveil the silent letters"
                                  >
                                    <HelpCircle size={14} />
                                    Whisper Hint
                                  </button>
                                </>
                              ) : null}
                            </div>

                            {spellHintTriggered && selectedAnswer === null && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-amber-950/10 border border-amber-950/20 rounded-xl text-center space-y-1"
                              >
                                <span className="text-[10px] uppercase font-black tracking-widest text-amber-500/60 block">Runic Pattern Revealed</span>
                                <div className="font-mono text-base text-amber-300 font-extrabold tracking-[0.25em]">
                                  {(() => {
                                    const word = currentExercise.options[currentExercise.answer];
                                    if (word.length <= 2) return word.split('').map(() => '_').join(' ');
                                    const first = word[0];
                                    const last = word[word.length - 1];
                                    const mid = word.slice(1, word.length - 1).split('').map(c => c === ' ' ? ' ' : '_').join(' ');
                                    return `${first} ${mid} ${last}`;
                                  })()}
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        )}

                        {exerciseStyle === 'unscramble' && (
                          <div className="space-y-4 max-w-lg mx-auto w-full">
                            {/* Draft order panel */}
                            <div className={`p-4 min-h-[70px] bg-black/60 border-2 rounded-xl flex flex-wrap gap-2 items-center justify-center text-center transition-all ${
                              spellError 
                                ? 'border-red-600 shadow-[0_0_12px_rgba(239,68,68,0.3)]' 
                                : selectedAnswer !== null 
                                  ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                  : 'border-amber-950/20'
                            }`}>
                              {unscrambleSelected.length === 0 ? (
                                <span className="text-xs text-zinc-650 italic tracking-wider font-medium">Select the word gems below in correct incantation order...</span>
                              ) : (
                                unscrambleSelected.map((word, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      if (selectedAnswer !== null) return;
                                      playClick();
                                      setUnscrambleSelected(prev => prev.filter((_, i) => i !== idx));
                                      setUnscrambleOptions(prev => [...prev, word]);
                                    }}
                                    disabled={selectedAnswer !== null}
                                    className="px-3 py-1.5 bg-amber-950/15 border border-amber-500/20 text-amber-200 hover:text-amber-100 hover:border-amber-400 rounded-lg text-xs font-bold font-mono hover:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    {word}
                                  </button>
                                ))
                              )}
                            </div>

                            {/* Options scrolls */}
                            {selectedAnswer === null && (
                              <div className="flex flex-wrap gap-2 justify-center p-3.5 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                                {unscrambleOptions.map((word, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      playClick();
                                      setUnscrambleSelected(prev => [...prev, word]);
                                      setUnscrambleOptions(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-amber-500/35 text-zinc-350 hover:text-white rounded-lg text-xs font-semibold cursor-pointer select-none hover:scale-105 active:scale-95 transition-all"
                                  >
                                    {word}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Evaluation controls */}
                            {selectedAnswer === null && (
                              <div className="flex gap-2.5 max-w-sm mx-auto w-full">
                                <button
                                  type="button"
                                  onClick={() => verifyUnscrambleAnswer()}
                                  disabled={unscrambleSelected.length === 0}
                                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-35 disabled:pointer-events-none text-black py-2.5 px-4 rounded-xl font-bold tracking-widest uppercase text-xs transition-all shadow-md cursor-pointer"
                                >
                                  Covenant Order
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playClick();
                                    setUnscrambleOptions([...unscrambleCorrectWords].sort(() => Math.random() - 0.5));
                                    setUnscrambleSelected([]);
                                    setSpellError(false);
                                  }}
                                  className="bg-black/40 hover:bg-zinc-900 border border-amber-950/20 text-zinc-400 hover:text-amber-200 py-2.5 px-4 rounded-xl font-bold tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <RotateCcw size={12} />
                                  Reset
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Explanation block when solved */}
                        {selectedAnswer !== null && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 p-4 bg-zinc-950/60 border border-amber-950/20 rounded-xl space-y-4"
                          >
                            <div className="space-y-2">
                              <p className="text-base text-zinc-200">
                                <span className="font-extrabold text-amber-400 uppercase tracking-wider text-xs mr-2 border border-amber-500/25 px-1.5 py-0.5 rounded bg-amber-505/5">Explanation:</span> 
                                {currentExercise.explanation}
                              </p>
                              {currentExercise.pronunciation && (
                                <p className="text-sm text-zinc-400 font-mono">
                                  <span className="font-bold text-amber-500">Phonetic Spell:</span> {currentExercise.pronunciation}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-amber-950/15 flex justify-end">
                              <button
                                onClick={async () => {
                                  playClick();
                                  setSpellInput('');
                                  setSpellHintTriggered(false);
                                  setSelectedAnswer(null);
                                  setIncorrectAttempts({});
                                  
                                  if (isBookPurchased) {
                                    await generateNewExercise();
                                  } else {
                                    const nextIndex = (currentExerciseIndex + 1) % EXERCISES.length;
                                    setCurrentExerciseIndex(nextIndex);
                                    setCurrentExercise(EXERCISES[nextIndex]);
                                  }
                                }}
                                disabled={isGeneratingExercise}
                                className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black px-6 py-2 rounded-full font-black tracking-widest uppercase text-xs transition-all duration-300 shadow-md hover:scale-[1.03] flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                              >
                                {isGeneratingExercise ? (
                                  <>
                                    <Sparkles size={12} className="animate-spin" /> Summoning...
                                  </>
                                ) : (
                                  <>
                                    Seek Next Ritual <ChevronRight size={14} />
                                  </>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </GildedFrame>
            ) : mode === 'flashcards' ? (
              <GildedFrame title="The Spellbook" icon={<BookOpen size={20} className="text-indigo-400" />} theme={activeTheme}>
                <InteractiveFlashcards 
                  theme={activeTheme} 
                  playClick={playClick} 
                  playReward={playReward} 
                />
              </GildedFrame>
            ) : mode === 'progress' ? (
              <GildedFrame title="The Ledger" icon={<Trophy size={20} className="text-red-500" />} theme={activeTheme}>
                <div className="space-y-6">
                  {/* Download Progress Card & Study Guide */}
                  <div className="bg-gradient-to-r from-red-950/20 via-red-950/40 to-red-950/20 border border-red-900/40 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
                    <div className="space-y-1.5 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <Flame className="text-red-500 animate-pulse" size={16} />
                        <h4 className="text-white font-extrabold text-sm sm:text-base tracking-widest uppercase">Exporter of the Soul's Lessons</h4>
                      </div>
                      <p className="text-zinc-400 text-xs max-w-md leading-relaxed">
                        Engrave your progress and dialogue feedback with the Gothic Scribes. Seal your achievements as an elegant PDF summary featuring your earned Eloquence Runes and custom self-study prompts.
                      </p>
                    </div>
                    <button
                      onClick={downloadPDFSummary}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-850 hover:from-red-500 hover:to-red-750 text-white font-black tracking-wider uppercase text-xs px-5 py-3 rounded-xl transition-all hover:scale-[1.03] cursor-pointer shadow-[0_4px_12px_rgba(220,38,38,0.25)] border border-red-500/30"
                    >
                      <Download size={14} className="animate-bounce" />
                      Seal PDF Ledger
                    </button>
                  </div>

                  {/* Badges Grid */}
                  <div>
                    <h3 className="text-red-400 font-bold tracking-widest uppercase mb-3 text-sm flex items-center gap-2">
                      <Star size={16} fill="currentColor" />
                      Eloquence Badges
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-zinc-900/60 p-4 rounded-xl border border-red-900/30 flex items-center gap-3">
                        <span className="text-2xl">🛡️</span>
                        <div>
                          <h4 className="text-white font-bold text-sm">Gothic Novice</h4>
                          <p className="text-zinc-400 text-xs mt-1">Practice speak logs initialized.</p>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border flex items-center gap-3 transition-opacity ${exercisesCompleted > 0 ? 'bg-zinc-900/60 border-red-900/30 opacity-100' : 'bg-zinc-950/20 border-zinc-900/50 opacity-40'}`}>
                        <span className="text-2xl">🌸</span>
                        <div>
                          <h4 className="text-white font-bold text-sm">Orchid Orator</h4>
                          <p className="text-zinc-400 text-xs mt-1">Complete 1 exercise. ({exercisesCompleted}/1)</p>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border flex items-center gap-3 transition-opacity ${((exercisesCompleted * 150) + 1200) >= 1500 ? 'bg-zinc-900/60 border-red-900/30 opacity-100' : 'bg-zinc-950/20 border-zinc-900/50 opacity-40'}`}>
                        <span className="text-2xl">💀</span>
                        <div>
                          <h4 className="text-white font-bold text-sm">Rune Summoner</h4>
                          <p className="text-zinc-400 text-xs mt-1">Earn 1,500 eloquence runes.</p>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border flex items-center gap-3 transition-opacity ${(() => {
                        try {
                          return JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]').length > 0;
                        } catch {
                          return false;
                        }
                      })() ? 'bg-zinc-900/60 border-red-900/30 opacity-100' : 'bg-zinc-950/20 border-zinc-900/50 opacity-40'}`}>
                        <span className="text-2xl">🕯️</span>
                        <div>
                          <h4 className="text-white font-bold text-sm">Chamber Adept</h4>
                          <p className="text-zinc-400 text-xs mt-1">Complete 1 session with comments.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Logs Scroll */}
                  <div>
                    <h3 className="text-red-400 font-bold tracking-widest uppercase mb-3 text-sm flex items-center gap-2">
                      <BookOpen size={16} />
                      Scrolls of Past Dialogues
                    </h3>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {(() => {
                        try {
                          const logs = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
                          if (logs.length === 0) {
                            return (
                              <div className="bg-red-950/10 border border-red-950/30 rounded-xl p-6 text-center text-zinc-400">
                                <p className="text-base font-medium leading-relaxed italic">
                                  "No echoes have been captured yet in the Progress ledger. Complete dialogues in Student, Beginner, or Teacher modes to write to your scrolls."
                                </p>
                              </div>
                            );
                          }
                          return [...logs].reverse().map((log: FeedbackLog, idx: number) => {
                            const isExpanded = expandedLogIndex === idx;
                            return (
                              <div key={idx} className="bg-zinc-900/80 border border-red-900/20 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="font-bold text-white">{log.role || 'Gothic Tutor'}</span>
                                  <span className="text-red-400 font-mono text-xs">{new Date(log.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-zinc-300 text-xs font-mono">Topic: {log.topic}</p>
                                {log.comments && (
                                  <p className="text-zinc-300 text-sm italic bg-black/30 p-2 rounded border border-red-950/30">
                                    "{log.comments}"
                                  </p>
                                )}
                                <div className="flex justify-between items-center text-xs text-red-300">
                                  <div className="flex gap-4">
                                    <span className="flex items-center gap-1">
                                      AI: {Array.from({ length: log.ratingAI || 0 }).map(() => '★').join('')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      Topic: {Array.from({ length: log.ratingTopic || 0 }).map(() => '★').join('')}
                                    </span>
                                  </div>
                                  {log.aiReport && (
                                    <button
                                      onClick={() => setExpandedLogIndex(isExpanded ? null : idx)}
                                      className="text-amber-400 hover:text-amber-300 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1 bg-amber-950/30 px-2 py-1 rounded border border-amber-900/30 cursor-pointer transition-all"
                                    >
                                      {isExpanded ? 'Hide Report' : 'View Report'}
                                    </button>
                                  )}
                                </div>
                                {isExpanded && log.aiReport && (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-3 pt-3 border-t border-zinc-800/80 text-zinc-300 text-xs leading-relaxed space-y-2 font-sans markdown-body max-h-64 overflow-y-auto custom-scrollbar"
                                  >
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {log.aiReport}
                                    </ReactMarkdown>
                                  </motion.div>
                                )}
                              </div>
                            );
                          });
                        } catch {
                          return null;
                        }
                      })()}
                    </div>
                  </div>

                  {/* Practical Self-Study Guide Room */}
                  <div className="pt-4 border-t border-zinc-900/30">
                    <h3 className="text-red-400 font-bold tracking-widest uppercase mb-3 text-sm flex items-center gap-2">
                      <Sparkles size={16} className="text-red-500 animate-spin" style={{ animationDuration: '6s' }} />
                      Active Runic Study Room
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-xl space-y-2 hover:border-red-900/30 hover:bg-zinc-900/30 transition-all duration-300">
                        <h4 className="text-amber-400 font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                          <span>🕯️</span> I. THE 10-MINUTE SCRIBE RITUAL
                        </h4>
                        <p className="text-zinc-400 text-[11px] leading-relaxed">
                          Enter <span className="text-zinc-200 font-semibold">Scribe Mode</span> in the training arena. Typing grammar spelling formats directly embeds clean syntactic word strings into your physical motor memory.
                        </p>
                      </div>
                      <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-xl space-y-2 hover:border-red-900/30 hover:bg-zinc-900/30 transition-all duration-300">
                        <h4 className="text-amber-400 font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                          <span>🗣️</span> II. PHONETIC ECHO WHISPER
                        </h4>
                        <p className="text-zinc-400 text-[11px] leading-relaxed">
                          Trigger the vocal pronouncements via the <span className="text-zinc-200 font-semibold">Volume Horn</span>. Repeat back the target expression with identical pitch patterns to tune conversational cadence.
                        </p>
                      </div>
                      <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-xl space-y-2 hover:border-red-900/30 hover:bg-zinc-900/30 transition-all duration-300">
                        <h4 className="text-amber-400 font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                          <span>⏳</span> III. SPACED RITUAL RECALL
                        </h4>
                        <p className="text-zinc-400 text-[11px] leading-relaxed">
                          Re-test older training units like "Prepositions of Time" twice a week. When streaks fail, read the feedback context block to re-synthesize correct grammar semantics.
                        </p>
                      </div>
                      <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-xl space-y-2 hover:border-red-900/30 hover:bg-zinc-900/30 transition-all duration-300">
                        <h4 className="text-amber-400 font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                          <span>🎭</span> IV. ACTIVE ROLEPLAY APPLICATION
                        </h4>
                        <p className="text-zinc-400 text-[11px] leading-relaxed">
                          Commit to speaking natural dialogue paths. Push yours to manually practice at least one active grammar form (e.g., comparison clauses) in your custom chat prompts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </GildedFrame>
            ) : (
              <GildedFrame 
                title={isSessionConnected ? "The Conversation" : "Specimen in Focus"}
                icon={<Briefcase size={20} className={activeTheme.activeIconColor} />}
                theme={activeTheme}
              >
                <div className="flex items-center justify-end mb-6">
                  <button 
                    onClick={rollDice}
                    disabled={isSessionConnected || isSessionConnecting}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 hover:bg-zinc-800 text-blue-100 border border-zinc-800/50 rounded-full text-base font-bold tracking-wider uppercase transition-colors disabled:opacity-50"
                  >
                    <Dices size={16} />
                    Roll Dice
                  </button>
                </div>

              <motion.div 
                key={mode === 'student' || mode === 'beginner' ? selectedTopic.id : selectedGrammarTopic.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 bg-zinc-900/90 rounded-2xl relative border-[4px] border-double border-slate-400/30 p-6 border border-zinc-800/50 max-h-[500px] overflow-y-auto custom-scrollbar"
              >
                {mode === 'beginner' && isSessionConnected && showDialogue ? (
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-blue-200 uppercase tracking-widest">Example Conversation (Read Aloud)</h3>
                      <button onClick={() => setShowDialogue(false)} className="text-blue-300/90 hover:text-blue-200 p-2 bg-zinc-900/50 rounded-lg">
                        <EyeOff size={16} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {BEGINNER_DIALOGUES[selectedRole.id]?.map((line, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${line.speaker === 'AI' ? 'bg-blue-950/30 border-blue-900/50' : 'bg-zinc-800/50 border-zinc-700/50'} text-base font-medium`}>
                          <span className={`font-bold uppercase tracking-widest block mb-2 text-sm ${line.speaker === 'AI' ? 'text-blue-500' : 'text-zinc-400'}`}>{line.speaker}</span>
                          <p className={line.speaker === 'AI' ? 'text-white' : 'text-white'}>{line.text}</p>
                          {line.pronunciation && (
                            <p className="mt-3 pt-3 border-t border-zinc-700/30 text-base text-amber-500/90 font-mono flex items-start gap-2">
                              <span className="text-amber-500/50">🗣</span> {line.pronunciation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {mode === 'beginner' && isSessionConnected && !showDialogue && (
                       <div className="mb-6 flex justify-end border-b border-zinc-800/50 pb-4">
                          <button onClick={() => setShowDialogue(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-950/30 border border-blue-900/50 rounded-full text-base text-blue-200 font-bold uppercase tracking-widest hover:bg-blue-900/50 transition-colors">
                            <Eye size={16} /> Show Example Dialogue
                          </button>
                       </div>
                    )}
                    <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-500/30 text-sm font-bold uppercase tracking-widest rounded-full mb-4">
                      {mode === 'student' || mode === 'beginner' ? selectedTopic.title : selectedGrammarTopic.title}
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-blue-300/90 uppercase tracking-widest mb-2">Grammar Target</h3>
                      <p className="text-blue-200 font-medium">{mode === 'student' || mode === 'beginner' ? selectedTopic.grammar : selectedGrammarTopic.grammar}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-blue-300/90 uppercase tracking-widest mb-1">Target Persona Character Voice</h3>
                      <p className="text-blue-200 font-extrabold uppercase font-mono text-xs text-fuchsia-400 tracking-wider">
                        🎤 {selectedRole.voice} {elevenLabsMode && " (High-Fidelity Neural Profile)"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-blue-300/90 uppercase tracking-widest mb-3">Vocabulary to Use</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(mode === 'student' || mode === 'beginner' ? selectedTopic.vocabulary : selectedGrammarTopic.vocabulary).map((word, idx) => {
                          const used = isWordUsed(word);
                          return (
                            <span 
                              key={idx} 
                              className={`px-3 py-1.5 border rounded-lg text-base font-medium shadow-sm transition-all duration-500 ${
                                used 
                                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-100 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                                  : 'bg-black border-zinc-800/50 text-blue-300/70'
                              }`}
                            >
                              {word} {used && '✓'}
                            </span>
                          );
                        })}
                      </div>
                      {(mode === 'student' || mode === 'beginner' ? selectedTopic.pronunciation : selectedGrammarTopic.pronunciation) && (
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-blue-900/40 shadow-inner">
                          <h4 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-1">Pronunciation Guide</h4>
                          <p className="text-base text-blue-200/90 leading-relaxed font-medium">
                            {mode === 'student' || mode === 'beginner' ? selectedTopic.pronunciation : selectedGrammarTopic.pronunciation}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>

              <div className="mt-8 pt-6 border-t border-blue-900/50">
                {!isSessionConnected ? (
                  <>
                      <button
                        onClick={handleStart}
                        disabled={isSessionConnecting || (mode === 'teacher' && !isPremium) || !studentName.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-black py-4 rounded-2xl font-bold tracking-[0.25em] uppercase text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_22px_rgba(201,162,75,0.35)] hover:shadow-[0_0_34px_rgba(232,201,124,0.5)] neon-border"
                      >
                        {isSessionConnecting ? (
                          <div className="flex items-center gap-2 font-mono text-sm">
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            {elevenLabsMode ? 'Summoning Neural Muse...' : 'Decrypting Runes...'}
                          </div>
                        ) : (
                          <>
                            <Play size={20} />
                            {mode === 'teacher' && !isPremium ? 'Teacher Mode Locked' : !studentName.trim() ? 'Sign your name first' : 'Begin the Conversation'}
                          </>
                        )}
                      </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    {elevenWarning && (
                      <div className="w-full mb-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm font-semibold flex items-center gap-2">
                        <AlertCircle size={16} />
                        {elevenWarning}
                      </div>
                    )}

                    <div className="w-full flex items-center justify-between glass-panel p-4 rounded-2xl mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-200 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                        </div>
                        <span className="font-bold tracking-widest uppercase text-base text-blue-200 font-mono">Time Remaining: {formatTime(sessionTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-500 text-base tracking-widest uppercase font-bold">
                        {elevenLabsMode ? (
                          <>
                            <Sparkles size={16} className="text-fuchsia-400 animate-pulse" />
                            Neural Streaming
                          </>
                        ) : hasMicrophone ? (
                          <>
                            <Mic size={16} className="animate-pulse" />
                            Listening Live...
                          </>
                        ) : (
                          <>
                            <MessageSquare size={16} />
                            Text Mode
                          </>
                        )}
                      </div>
                    </div>

                    {elevenLabsMode ? (
                      <div className="w-full mb-4 flex gap-2">
                        <button
                          type="button"
                          onClick={isRecording ? stopVoiceInput : startVoiceInput}
                          className={`p-3.5 rounded-xl transition-all ${
                            isRecording 
                              ? 'bg-red-600 text-white animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.7)]' 
                              : 'bg-zinc-800 hover:bg-zinc-700 text-blue-200 border border-zinc-700/50'
                          }`}
                          title={isRecording ? "Stop Recording" : "Use Voice Input"}
                        >
                          <Mic size={20} className={isRecording ? "animate-bounce" : ""} />
                        </button>
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (textInput.trim() && !elevenLabsLoading) {
                              handleElevenMessage(textInput);
                              setTextInput("");
                            }
                          }}
                          className="flex-1 flex gap-2"
                        >
                          <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder={elevenLabsLoading ? "Synthesizing character stream..." : "Type your message..."}
                            disabled={elevenLabsLoading}
                            className="flex-1 bg-zinc-900/80 border border-zinc-800/50 text-blue-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-base disabled:opacity-50 placeholder-blue-500/30"
                          />
                          <button
                            type="submit"
                            disabled={!textInput.trim() || elevenLabsLoading}
                            className="bg-blue-500 hover:bg-blue-200 text-black px-5 rounded-xl font-bold tracking-widest uppercase text-base transition-all disabled:opacity-50"
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    ) : (
                      !hasMicrophone && (
                        <div className="w-full mb-4">
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (textInput.trim()) {
                                sendTextMessage(textInput);
                                setTextInput("");
                              }
                            }}
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              value={textInput}
                              onChange={(e) => setTextInput(e.target.value)}
                              placeholder="Type your message here..."
                              className="flex-1 bg-zinc-900/80 border border-zinc-800/50 text-blue-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-base placeholder-blue-500/30"
                            />
                            <button
                              type="submit"
                              disabled={!textInput.trim()}
                              className="bg-blue-500 hover:bg-blue-200 text-black px-4 rounded-xl font-bold tracking-widest uppercase text-base transition-all disabled:opacity-50"
                            >
                              Send
                            </button>
                          </form>
                        </div>
                      )
                    )}

                    {sessionTime <= 15 && sessionTime > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-amber-400 text-base font-bold tracking-widest uppercase animate-pulse font-mono"
                      >
                        <AlertCircle size={16} />
                        AI will provide feedback in {sessionTime} seconds...
                      </motion.div>
                    )}
                    
                    <div className="w-full grid grid-cols-3 gap-3">
                      <button
                        onClick={handleStop}
                        className="flex flex-col items-center justify-center gap-1 bg-red-950/50 hover:bg-red-900 text-red-500 border border-red-900/50 py-3 rounded-2xl font-bold tracking-widest uppercase text-sm transition-all"
                      >
                        <Square size={16} />
                        End
                      </button>
                      <button
                        onClick={elevenLabsMode ? handleElevenGetFeedback : requestFeedback}
                        className="flex flex-col items-center justify-center gap-1 bg-amber-950/50 hover:bg-amber-900 text-amber-500 border border-amber-900/50 py-3 rounded-2xl font-bold tracking-widest uppercase text-sm transition-all"
                      >
                        <MessageSquare size={16} />
                        Get Feedback
                      </button>
                      <button
                        onClick={handleRestart}
                        className="flex flex-col items-center justify-center gap-1 bg-zinc-900/80 hover:bg-zinc-800 text-blue-500 border border-zinc-800/50 py-3 rounded-2xl font-bold tracking-widest uppercase text-sm transition-all"
                      >
                        <RefreshCw size={16} />
                        Restart
                      </button>
                    </div>
                  </div>
                )}

                {/* Transcript Section */}
                {(activeUserTranscript || activeAiTranscript) && (
                  <div className="mt-6 w-full glass-panel rounded-2xl p-4 max-h-60 overflow-y-auto">
                    <h3 className="text-sm font-bold text-blue-300/90 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MessageSquare size={14} />
                      Live Transcript & Feedback
                    </h3>
                    <div className="space-y-4 text-base font-medium">
                      {activeUserTranscript && (
                        <div className="text-blue-100/80 whitespace-pre-wrap">
                          <span className="text-blue-500/40 text-sm uppercase tracking-widest block mb-1">You:</span>
                          {activeUserTranscript}
                        </div>
                      )}
                      {activeAiTranscript && (
                        <div className="text-blue-200">
                          <span className="text-blue-500/40 text-sm uppercase tracking-widest block mb-1">AI Partner:</span>
                          <div className="markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {activeAiTranscript}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </GildedFrame>
            )}
           </div>
        </div>
      </main>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-panel rounded-3xl max-w-4xl w-full p-6 my-8 border border-blue-900/40 relative shadow-[0_0_50px_rgba(30,58,138,0.3)]"
          >
            <div className="flex justify-between items-start mb-4 border-b border-zinc-800/50 pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-display tracking-widest text-blue-200 mb-1 flex items-center gap-2">
                  <Trophy className="text-amber-500" size={24} />
                  Session Feedback & Evaluation
                </h2>
                <p className="text-blue-300/70 text-xs tracking-wider uppercase font-mono">
                  Topic: {(mode === 'student' || mode === 'beginner') ? selectedTopic.title : selectedGrammarTopic.title} • Partner: {selectedRole.name}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowFeedback(false);
                  setAiFeedbackReport(null);
                }}
                className="text-zinc-500 hover:text-zinc-200 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column (2 cols) - AI Tutor Report */}
              <div className="md:col-span-2 flex flex-col space-y-4">
                <div className="bg-black/40 border border-zinc-800/50 rounded-2xl p-5 h-[420px] overflow-y-auto custom-scrollbar">
                  <h3 className="text-base font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-zinc-800/50 pb-2">
                    <Sparkles size={16} />
                    🎓 AI Tutor's Constructive Analysis
                  </h3>
                  
                  {isGeneratingFeedback ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-4">
                      <div className="relative flex h-10 w-10">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-10 w-10 bg-blue-500 flex items-center justify-center">
                          <RefreshCw className="animate-spin text-black" size={20} />
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-blue-200 font-bold tracking-widest uppercase text-xs animate-pulse">Analyzing Conversational Artifacts...</p>
                        <p className="text-zinc-500 text-xs max-w-sm font-medium leading-relaxed">
                          The AI Coach is evaluating your vocabulary density, target grammar precision, pronunciation targets, and sentence-level syntactical improvements...
                        </p>
                      </div>
                    </div>
                  ) : aiFeedbackReport ? (
                    <div className="markdown-body text-zinc-300 text-sm space-y-4 leading-relaxed font-sans">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {aiFeedbackReport}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                      No report has been compiled yet. Start an active dialogue to trigger diagnostic reporting.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (1 col) - User Self Evaluation */}
              <div className="flex flex-col justify-between bg-zinc-950/40 border border-zinc-900 p-5 rounded-2xl">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-blue-200 uppercase tracking-widest border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                    <Star size={16} className="text-amber-500" />
                    ⭐ Rate this Practice
                  </h3>
                  
                  <div>
                    <label className="block text-[11px] tracking-wider uppercase font-bold text-zinc-400 mb-1.5">AI Performance & Naturalness</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          onClick={() => setRatingAI(star)} 
                          className="transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star size={20} className={star <= ratingAI ? "fill-amber-400 text-amber-400" : "text-zinc-800"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <label className="block text-[11px] tracking-wider uppercase font-bold text-zinc-400 mb-1.5">Grammar & Vocab Relevance</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          onClick={() => setRatingTopic(star)} 
                          className="transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star size={20} className={star <= ratingTopic ? "fill-amber-400 text-amber-400" : "text-zinc-800"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] tracking-wider uppercase font-bold text-zinc-400 mb-1.5">Student Notes & Comments</label>
                    <textarea 
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800/30 rounded-xl p-2.5 text-xs text-blue-100 outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none placeholder-zinc-700 h-24 font-sans"
                      placeholder="e.g. Practiced past perfect tense. AI correction was clear. Focus on pronouncing vocabulary words next time."
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-4">
                  <button 
                    onClick={() => {
                      // Save automatically even if they skip writing feedback comments
                      const feedback = {
                        date: new Date().toISOString(),
                        student: mode === 'teacher' ? 'Joshimar (Teacher)' : studentName,
                        role: selectedRole.name,
                        topic: (mode === 'student' || mode === 'beginner') ? selectedTopic.title : selectedGrammarTopic.title,
                        ratingAI: ratingAI || 5,
                        ratingTopic: ratingTopic || 5,
                        comments: feedbackText || "Self-study session completed.",
                        aiReport: aiFeedbackReport
                      };
                      const existing = JSON.parse(localStorage.getItem('linguaRole_feedback') || '[]');
                      localStorage.setItem('linguaRole_feedback', JSON.stringify([...existing, feedback]));
                      
                      setShowFeedback(false);
                      setRatingAI(0);
                      setRatingTopic(0);
                      setFeedbackText("");
                      setAiFeedbackReport(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl font-bold tracking-widest uppercase text-xs text-zinc-400 bg-zinc-900/60 hover:bg-zinc-800 transition-all border border-zinc-800/50"
                  >
                    Skip
                  </button>
                  <button 
                    onClick={handleSubmitFeedback}
                    disabled={ratingAI === 0 && ratingTopic === 0 && !feedbackText}
                    className="flex-1 py-2.5 rounded-xl font-bold tracking-widest uppercase text-xs text-black bg-blue-500 hover:bg-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-pulse"
                    style={{ animationDuration: '3s' }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Ask EL TEACHER FAB */}
      <a
        href="mailto:joshimarLavid@gmail.com?subject=Question%20for%20EL%20TEACHER"
        className="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-200 text-black p-4 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all flex items-center justify-center group"
        title="Ask EL TEACHER"
      >
        <Mail size={24} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold tracking-widest uppercase text-base ml-0 group-hover:ml-2">
          Ask EL TEACHER
        </span>
      </a>
      </div>
    </div>
  );
}
