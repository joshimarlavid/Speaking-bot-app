import React from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { useExercises } from './hooks/useExercises';
import { useSession } from './hooks/useSession';
import { Header } from './components/Header';
import { SessionSetup } from './components/SessionSetup';
import { InteractiveSession } from './components/InteractiveSession';
import { GrammarExercises } from './components/GrammarExercises';
import { ProgressLedger } from './components/ProgressLedger';
import { InteractiveFlashcards } from './components/InteractiveFlashcards';
import { useGeneratedBackground } from './useGeneratedBackground';

const AppLayout: React.FC = () => {
  const {
    mode,
    activeTheme,
    bubbles,
    studentName,
    selectedRole,
    selectedTopic,
    selectedGrammarTopic,
    dailyChallenge
  } = useAppContext();

  const exercises = useExercises();

  const session = useSession(
    mode,
    selectedRole,
    studentName,
    selectedTopic,
    selectedGrammarTopic,
    dailyChallenge
  );

  const { bgUrl } = useGeneratedBackground(
    (mode === 'student' || mode === 'beginner') ? `A gothic, mystical background representing the topic ${selectedTopic?.title}` : `A gothic, mystical background representing the grammar topic ${selectedGrammarTopic?.title}`
  );

  return (
    <div
      className="min-h-screen bg-black text-amber-400 font-sans selection:bg-cyan-500/30 relative overflow-hidden runes-bg"
      style={{
        backgroundImage: bgUrl ? `url(${bgUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {bubbles.map(bubble => {
          let color = 'rgba(34, 211, 238, 0.25)'; // neon cyan
          if (bubble.type === 1) color = 'rgba(16, 185, 129, 0.22)'; // neon emerald
          if (bubble.type === 2) color = 'rgba(217, 70, 239, 0.22)'; // neon purple
          return (
            <div
              key={bubble.id}
              className="absolute bottom-0 rounded-full border border-white/10 pointer-events-none select-none"
              style={{
                left: `${bubble.left}%`,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}, inset 0 0 4px rgba(255,255,255,0.4)`,
                animation: `bubble-rise ${bubble.duration}s infinite linear, sway 8s infinite ease-in-out`,
                animationDelay: `${bubble.delay}s`,
              }}
            />
          );
        })}
      </div>

      <div className="fixed inset-0 pointer-events-none z-0 water-caustics opacity-40 mix-blend-color-dodge"></div>
      <div className={`fixed inset-0 bg-gradient-to-br ${activeTheme.bgGradient} backdrop-blur-md z-0 mix-blend-multiply transition-all duration-700`}></div>
      <div className="fixed top-0 left-0 w-48 lg:w-96 h-48 lg:h-96 z-0 pointer-events-none opacity-45 mix-blend-screen" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/subtle-waves.png')", borderRight: '8px double rgba(34, 211, 238, 0.3)', borderBottom: '8px double rgba(34, 211, 238, 0.3)', borderBottomRightRadius: '90% 50%', boxShadow: '0 0 40px rgba(6, 182, 212, 0.2)' }}></div>
      <div className="fixed bottom-0 right-0 w-48 lg:w-96 h-48 lg:h-96 z-0 pointer-events-none opacity-45 mix-blend-screen" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/subtle-waves.png')", borderLeft: '8px double rgba(34, 211, 238, 0.3)', borderTop: '8px double rgba(34, 211, 238, 0.3)', borderTopLeftRadius: '90% 50%', boxShadow: '0 0 40px rgba(6, 182, 212, 0.2)' }}></div>

      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.06] mix-blend-screen flex items-center justify-center overflow-hidden">
        <div className="w-[85vw] h-[85vw] max-w-[750px] max-h-[750px] relative flex items-center justify-center">
          <svg viewBox="0 0 400 400" className="w-full h-full text-cyan-400/60 animate-[spin_120s_infinite_linear]" fill="none" stroke="currentColor">
            <circle cx="200" cy="200" r="185" strokeWidth="1" strokeDasharray="4,12" className="text-fuchsia-500/40" />
            <circle cx="200" cy="200" r="172" strokeWidth="2" className="text-cyan-500/30" />
            <rect x="80" y="80" width="240" height="240" strokeWidth="1" className="text-emerald-500/20 rotate-45" />

            <g transform="translate(150, 140) scale(1.0)" className="text-cyan-400/80">
              <path d="M50,15 C25,15 15,35 15,55 C15,70 25,82 25,95 L30,105 L70,105 L75,95 C75,82 85,70 85,55 C85,35 75,15 50,15 Z" strokeWidth="2" />
              <ellipse cx="36" cy="55" rx="7" ry="11" strokeWidth="1.5" className="text-fuchsia-400" />
              <ellipse cx="64" cy="55" rx="7" ry="11" strokeWidth="1.5" className="text-fuchsia-400" />
              <path d="M50,68 L46,76 L54,76 Z" fill="currentColor" opacity="0.6" />
              <line x1="38" y1="95" x2="62" y2="95" strokeWidth="1.5" />
              <line x1="42" y1="91" x2="42" y2="99" strokeWidth="1" />
              <line x1="46" y1="91" x2="46" y2="99" strokeWidth="1" />
              <line x1="50" y1="91" x2="50" y2="99" strokeWidth="1" />
              <line x1="54" y1="91" x2="54" y2="99" strokeWidth="1" />
              <line x1="58" y1="91" x2="58" y2="99" strokeWidth="1" />
            </g>
            <path d="M80,310 Q120,380 180,330 T280,340 T310,290" strokeWidth="2.5" className="text-emerald-500/50" strokeLinecap="round" />
            <path d="M310,90 C280,110 280,140 310,160 C340,140 340,110 310,90 Z" strokeWidth="1.5" className="text-fuchsia-400/50" />
            <circle cx="310" cy="125" r="5" fill="#d946ef" opacity="0.4" />
            <path d="M80,90 C50,110 50,140 80,160 C110,140 110,110 80,90 Z" strokeWidth="1.5" className="text-fuchsia-400/50" />
            <circle cx="80" cy="125" r="5" fill="#d946ef" opacity="0.4" />
          </svg>
        </div>
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.06] mix-blend-screen" style={{ backgroundImage: "url('/logo.png')", backgroundSize: '500px', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-0 pointer-events-none backdrop-blur-[1px]"></div>

      <div className="relative z-10 w-full">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 pb-10">
          {(mode === 'student' || mode === 'teacher' || mode === 'beginner') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <SessionSetup
                elevenLabsMode={session.elevenLabsMode}
                setElevenLabsMode={session.setElevenLabsMode}
                isSessionConnected={session.isSessionConnected}
                isSessionConnecting={session.isSessionConnecting}
              />
              <InteractiveSession
                {...session}
              />
            </div>
          )}

          {mode === 'exercises' && (
            <GrammarExercises {...exercises} />
          )}

          {mode === 'flashcards' && (
            <InteractiveFlashcards theme={activeTheme} playClick={() => {}} playReward={() => {}} />
          )}

          {mode === 'progress' && (
            <ProgressLedger
              exercisesCompleted={exercises.exercisesCompleted}
              exerciseStreak={exercises.exerciseStreak}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default function AppContent() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}
