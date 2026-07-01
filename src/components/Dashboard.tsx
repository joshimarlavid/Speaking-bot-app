import { AppTheme } from '../App';
import { motion } from 'motion/react';
import { User, Dices, BookOpen, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { STUDENTS } from '../data';

interface DashboardProps {
  theme: AppTheme;
  studentName: string;
  setStudentName: (name: string) => void;
  dailyStreak: number;
  freeRolesUsed: number;
  hasPaidPackage: boolean;
  onPayClick: () => void;
  randomizeSelections: () => void;
}

export function Dashboard({
  theme,
  studentName,
  setStudentName,
  dailyStreak,
  freeRolesUsed,
  hasPaidPackage,
  onPayClick,
  randomizeSelections
}: DashboardProps) {
  return (
    <div className={`bg-black/60 backdrop-blur-md rounded-[2rem] border-2 ${theme.borderDouble} overflow-hidden shadow-2xl relative mb-12`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.bgGradient}`}></div>

      <div className="p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row gap-12 items-center justify-between">

          <div className="flex-1 space-y-6 w-full">
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.bgGradient} flex items-center justify-center shadow-[0_0_15px_${theme.glowHex}]`}>
                <Sparkles className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">Dark Art Studio</h1>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4" /> Who is practicing today?
              </label>
              <div className="relative group">
                <select
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className={`w-full bg-black/50 border-2 ${theme.borderSingle} text-white rounded-xl p-4 appearance-none focus:outline-none focus:border-${theme.primary}-500 transition-colors shadow-inner text-lg font-medium`}
                >
                  {STUDENTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${theme.textPrimary}`}>
                  ▼
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:border-l border-zinc-800 lg:pl-12 w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Daily Streak</div>
                <div className="text-3xl font-black text-orange-400 flex items-center gap-2">
                  {dailyStreak} <span className="text-lg text-orange-500/50">Days</span>
                </div>
              </div>
              <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Free Limits</div>
                <div className={`text-3xl font-black flex items-center gap-2 ${freeRolesUsed >= 5 && !hasPaidPackage ? 'text-red-400' : theme.textPrimary}`}>
                  {hasPaidPackage ? '∞' : `${freeRolesUsed}/5`}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={randomizeSelections}
                className={`flex-1 py-4 rounded-xl border-2 ${theme.borderDouble} ${theme.textPrimary} hover:bg-white/5 font-bold tracking-wide flex items-center justify-center gap-2 transition-all`}
              >
                <Dices className="w-5 h-5" /> Randomize
              </motion.button>

              {!hasPaidPackage && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onPayClick}
                  className={`flex-1 py-4 rounded-xl bg-yellow-500 text-black font-extrabold tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:bg-yellow-400 transition-all`}
                >
                  <BookOpen className="w-5 h-5" /> Unlock All
                </motion.button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
