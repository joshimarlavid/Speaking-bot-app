import { motion } from 'motion/react';
import { Mic, MicOff, AlertCircle, Square, User, RotateCcw, Volume2, Sparkles, Trophy } from 'lucide-react';
import { AppTheme } from '../App';

interface ActiveCallProps {
  theme: AppTheme;
  role: any;
  topic: any;
  studentName: string;
  userTranscript: string;
  aiTranscript: string;
  isConnecting: boolean;
  isConnected: boolean;
  hasMicrophone: boolean;
  onDisconnect: () => void;
  bgUrl: string;
}

export function ActiveCall({
  theme,
  role,
  topic,
  studentName,
  userTranscript,
  aiTranscript,
  isConnecting,
  isConnected,
  hasMicrophone,
  onDisconnect,
  bgUrl
}: ActiveCallProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
      style={{
        backgroundImage: `url('${bgUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay'
      }}
    >
      <div className={`w-full max-w-4xl bg-black/60 backdrop-blur-md rounded-3xl border-2 ${theme.borderDouble} overflow-hidden shadow-2xl flex flex-col h-[90vh]`}>
        {/* Header */}
        <div className={`p-6 border-b ${theme.borderSingle} bg-black/40 flex justify-between items-center`}>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700 shadow-xl">
              <img src="/skull_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-2`}>

                <Sparkles className="w-5 h-5" />
                {role?.name || "AI Tutor"}
              </h2>
              <p className={`text-sm ${theme.textMedium}`}>Practicing: {topic?.title || "Conversation"}</p>
            </div>
          </div>

          <button
            onClick={onDisconnect}
            className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all border border-red-500/30"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Transcript Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {!hasMicrophone && (
             <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3 mb-4">
               <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
               <p className="text-yellow-200/80 text-sm">No microphone detected. The AI will speak, but you cannot reply via voice. Please check your permissions.</p>
             </div>
          )}

          {/* AI Message */}
          <div className="flex gap-4">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${theme.bgGradient} flex items-center justify-center shrink-0`}>
              <User className={`w-5 h-5 ${theme.textPrimary}`} />
            </div>
            <div className={`flex-1 rounded-2xl rounded-tl-none p-5 bg-zinc-900/80 border ${theme.borderSingle}`}>
              <p className="text-zinc-300 text-lg leading-relaxed whitespace-pre-wrap">
                {aiTranscript || (isConnecting ? "Connecting to AI... Please wait." : "Waiting for response...")}
              </p>
            </div>
          </div>

          {/* User Message */}
          {userTranscript && (
             <div className="flex gap-4 flex-row-reverse">
               <div className={`w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border ${theme.borderSingle}`}>
                 <User className="w-5 h-5 text-zinc-400" />
               </div>
               <div className={`flex-1 rounded-2xl rounded-tr-none p-5 bg-black/60 border ${theme.borderSingle}`}>
                 <p className="text-zinc-400 text-lg leading-relaxed">{userTranscript}</p>
               </div>
             </div>
          )}
        </div>

        {/* Footer / Status */}
        <div className={`p-6 border-t ${theme.borderSingle} bg-black/40 flex justify-center`}>
          <div className="flex items-center gap-3">
             <div className="relative">
               {isConnected ? (
                 <>
                   <div className={`absolute inset-0 rounded-full animate-ping opacity-20 bg-green-500`}></div>
                   <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                 </>
               ) : (
                 <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse"></div>
               )}
             </div>
             <span className={`text-sm tracking-widest font-medium ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
               {isConnected ? "LIVE CONNECTION SECURED" : "ESTABLISHING CONNECTION..."}
             </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
