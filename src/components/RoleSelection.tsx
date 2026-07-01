import { motion, AnimatePresence } from 'motion/react';
import { AppTheme } from '../App';
import { ROLES, TOPICS } from '../data';
import { User, Briefcase, Lock, Check } from 'lucide-react';

interface RoleSelectionProps {
  theme: AppTheme;
  mode: 'student' | 'teacher';
  activeRoleIndex: number;
  activeTopicIndex: number;
  setActiveRoleIndex: (i: number) => void;
  setActiveTopicIndex: (i: number) => void;
  hasPaidPackage: boolean;
  onPayClick: () => void;
}

export function RoleSelection({
  theme,
  mode,
  activeRoleIndex,
  activeTopicIndex,
  setActiveRoleIndex,
  setActiveTopicIndex,
  hasPaidPackage,
  onPayClick
}: RoleSelectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full relative z-10 px-4">
      {/* Roles List */}
      <div className={`bg-black/60 backdrop-blur-md rounded-[2rem] border-2 ${theme.borderDouble} overflow-hidden shadow-xl`}>
        <div className={`p-6 border-b ${theme.borderSingle} bg-black/40 flex justify-between items-center`}>
          <div className="flex items-center gap-3">
            <User className={`w-6 h-6 ${theme.textPrimary}`} />
            <h2 className="text-xl font-bold text-white tracking-wide">Select Partner</h2>
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${theme.badgeBg} tracking-widest`}>
            {ROLES.length} ROLES
          </span>
        </div>
        <div className="p-4 grid gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {ROLES.map((role, idx) => {
            const isPremium = !role.free && !hasPaidPackage;
            const isActive = activeRoleIndex === idx;

            return (
              <motion.button
                key={role.id}
                whileHover={{ scale: isPremium ? 1 : 1.02 }}
                whileTap={{ scale: isPremium ? 1 : 0.98 }}
                onClick={() => !isPremium && setActiveRoleIndex(idx)}
                className={`w-full p-5 rounded-2xl border text-left transition-all relative overflow-hidden group
                  ${isActive
                    ? `border-${theme.primary}-500 bg-${theme.primary}-900/20 shadow-[0_0_20px_${theme.glowHex}]`
                    : `border-zinc-800/50 bg-black/40 ${!isPremium && `hover:bg-${theme.primary}-900/10 hover:border-${theme.primary}-500/50`}`}
                  ${isPremium ? 'opacity-70 cursor-not-allowed grayscale' : ''}
                `}
              >
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${theme.bgGradient} opacity-5`}></div>
                )}

                <div className="flex items-start gap-4 relative z-10">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border
                    ${isActive
                      ? `border-${theme.primary}-400 bg-${theme.primary}-500/20 text-${theme.primary}-300`
                      : 'border-zinc-700 bg-zinc-900 text-zinc-500'}
                  `}>
                    <User className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-zinc-300'} group-hover:text-white transition-colors`}>
                        {role.name}
                      </h3>
                      {isPremium && (
                        <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-500/20">
                          <Lock className="w-3 h-3" /> PRO
                        </div>
                      )}
                      {isActive && <Check className={`w-5 h-5 ${theme.textPrimary}`} />}
                    </div>
                    <p className={`text-sm line-clamp-2 ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {role.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Topics List */}
      <div className={`bg-black/60 backdrop-blur-md rounded-[2rem] border-2 ${theme.borderDouble} overflow-hidden shadow-xl`}>
        <div className={`p-6 border-b ${theme.borderSingle} bg-black/40 flex justify-between items-center`}>
          <div className="flex items-center gap-3">
            <Briefcase className={`w-6 h-6 ${theme.textPrimary}`} />
            <h2 className="text-xl font-bold text-white tracking-wide">Select Scenario</h2>
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${theme.badgeBg} tracking-widest`}>
            {TOPICS.length} TOPICS
          </span>
        </div>
        <div className="p-4 grid gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {TOPICS.map((topic, idx) => {
            const isPremium = !topic.free && !hasPaidPackage;
            const isActive = activeTopicIndex === idx;

            return (
              <motion.button
                key={topic.id}
                whileHover={{ scale: isPremium ? 1 : 1.02 }}
                whileTap={{ scale: isPremium ? 1 : 0.98 }}
                onClick={() => !isPremium && setActiveTopicIndex(idx)}
                className={`w-full p-5 rounded-2xl border text-left transition-all relative overflow-hidden group
                  ${isActive
                    ? `border-${theme.primary}-500 bg-${theme.primary}-900/20 shadow-[0_0_20px_${theme.glowHex}]`
                    : `border-zinc-800/50 bg-black/40 ${!isPremium && `hover:bg-${theme.primary}-900/10 hover:border-${theme.primary}-500/50`}`}
                  ${isPremium ? 'opacity-70 cursor-not-allowed grayscale' : ''}
                `}
              >
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${theme.bgGradient} opacity-5`}></div>
                )}

                <div className="flex items-start gap-4 relative z-10">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-zinc-300'} group-hover:text-white transition-colors`}>
                        {topic.title}
                      </h3>
                      {isPremium && (
                        <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-500/20">
                          <Lock className="w-3 h-3" /> PRO
                        </div>
                      )}
                      {isActive && <Check className={`w-5 h-5 ${theme.textPrimary}`} />}
                    </div>

                    <div className={`text-xs font-mono p-2 rounded-lg mb-2 inline-block
                      ${isActive ? 'bg-black/40 text-zinc-300' : 'bg-black/20 text-zinc-500'}
                    `}>
                      Focus: <span className={theme.textPrimary}>{topic.grammar}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {topic.vocabulary.slice(0, 3).map(word => (
                        <span key={word} className={`text-[10px] px-2 py-1 rounded border
                          ${isActive ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-transparent border-zinc-800 text-zinc-600'}
                        `}>
                          {word}
                        </span>
                      ))}
                      {topic.vocabulary.length > 3 && (
                        <span className="text-[10px] px-2 py-1 text-zinc-600">+{topic.vocabulary.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
