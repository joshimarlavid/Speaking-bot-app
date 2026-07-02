import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Zap } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export const Header: React.FC = () => {
  const { activeTheme, dailyChallenge } = useAppContext();

  return (
    <>
      <header className={`border-b ${activeTheme.borderSingle} py-6 px-4 sm:px-6 lg:px-8 shadow-sm bg-black/40 backdrop-blur-md transition-colors duration-500`}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative">

          <div className="flex-1 flex flex-col items-center justify-center relative py-8">

            <div
              className="absolute w-56 h-56 sm:w-64 sm:h-64 border-2 border-dashed border-cyan-500/20 pointer-events-none z-0 flex items-center justify-center animate-[spin_50s_infinite_linear]"
              style={{ transform: 'rotate(45deg)' }}
            >
              <div className="w-[90%] h-[90%] border-2 border-double border-cyan-400/25 flex items-center justify-center">
                <div className="w-[85%] h-[85%] border border-fuchsia-500/20 rotate-12"></div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-xl overflow-hidden border ${activeTheme.borderSingle} flex items-center justify-center bg-black/80 transition-all duration-500 mb-3 ${activeTheme.shadowGlow}`}>
                <img src="/logo.png" alt="Dark Art Studio Logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                <div className={`hidden text-[8px] font-bold text-center ${activeTheme.textPrimary} uppercase tracking-widest px-1`}>Logo</div>
              </div>

              <h1
                className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[0.15em] text-white drop-shadow-[0_0_25px_rgba(34,211,238,0.5)] mt-1 select-none transition-all duration-300"
                style={{ fontFamily: '"Cinzel Decorative", "Cinzel", "Grenze Gotisch", serif', textShadow: '0 0 15px rgba(34,211,238,0.4), 0 0 30px rgba(139,92,246,0.3)' }}
              >
                DARK <span className={activeTheme.textPrimary}>ART</span>
              </h1>
              <p className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-blue-200/60 mt-3 drop-shadow-sm max-w-md mx-auto leading-relaxed border-t border-blue-900/30 pt-3">
                Immersive <span className="text-fuchsia-400">Roleplay</span> Language Studio
              </p>
            </div>
          </div>

        </div>
      </header>

      <div className="w-full bg-blue-900/20 border-b border-blue-900/50 py-2 text-center shadow-inner">
        <p className="text-blue-200/80 text-base tracking-widest uppercase font-medium">
          "Brought to you by EL TEACHER" This app has been designed for me to Help you practice anytime, anywhere" Who needs a friend when they have a teacher like this one?!" Lmao.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 overflow-hidden rounded-[2rem] border-2 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.25)] bg-zinc-950/80 backdrop-blur-md max-w-2xl mx-auto w-full"
        >
          <div className="bg-blue-500 py-5 px-6 flex flex-col items-center justify-center text-black text-center">
            <Trophy size={36} className="mb-2 stroke-[2.5]" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em]">Daily Challenge</span>
          </div>

          <div className="p-6 sm:p-8 flex flex-col gap-4 text-left border-t border-blue-500/20">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-amber-500">
                <Zap size={14} className="text-amber-500 fill-amber-500" />
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-400">
                  Level Up Your {dailyChallenge?.type === 'grammar' ? 'Grammar' : 'Vocabulary'}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white leading-tight uppercase">
                Use "{dailyChallenge?.content?.toUpperCase()}"
              </h3>
              <p className="text-blue-200/80 text-sm sm:text-base font-medium leading-relaxed mt-1">
                Practice this {dailyChallenge?.type} from <span className="text-blue-100 font-bold">"{dailyChallenge?.topic}"</span> in your next conversation to earn bonus runes!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};
