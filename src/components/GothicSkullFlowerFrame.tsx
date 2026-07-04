import React from 'react';
import { AppTheme } from '../types';
import { THEMES } from '../themes';

export const GothicSkullFlowerFrame = React.memo(({ children, title, icon, theme }: {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  theme?: AppTheme;
}) => {
  const activeTheme = theme || THEMES.student;

  return (
    <div className={`glass-panel p-6 sm:p-8 rounded-[2rem] border-[6px] border-double ${activeTheme.borderDouble} relative bg-black/75 shadow-2xl backdrop-blur-xl transition-all duration-500 ${activeTheme.glowClass} select-none`}>
      <div className={`absolute -top-3.5 -left-3.5 w-12 sm:w-16 h-12 sm:h-16 pointer-events-none ${activeTheme.textPrimary} z-20`} style={{ filter: `drop-shadow(0 0 6px ${activeTheme.glowHex})` }}>
        <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse" fill="none">
          <path d="M50,12 C25,12 15,30 20,48 C23,58 29,64 34,64 C38,64 43,58 50,58 C57,58 62,64 66,64 C71,64 77,58 80,48 C85,30 75,12 50,12 Z" fill="rgba(8, 20, 40, 0.5)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M46,64 Q32,82 36,94" stroke={activeTheme.svgPrimary} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M50,60 Q50,85 53,95" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M54,64 Q68,82 64,94" stroke={activeTheme.svgSecondary} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M25,58 Q15,75 12,85" stroke={activeTheme.svgPrimary} strokeWidth="0.8" opacity="0.8" />
          <path d="M35,64 Q22,80 20,90" stroke={activeTheme.svgSecondary} strokeWidth="1" opacity="0.8" />
          <path d="M65,64 Q78,80 80,90" stroke={activeTheme.svgPrimary} strokeWidth="1" opacity="0.8" />
          <path d="M75,58 Q85,75 88,85" stroke={activeTheme.svgSecondary} strokeWidth="0.8" opacity="0.8" />
          <circle cx="36" cy="35" r="2" fill={activeTheme.svgPrimary} />
          <circle cx="50" cy="26" r="2.5" fill="currentColor" />
          <circle cx="64" cy="35" r="2" fill={activeTheme.svgSecondary} />
          <circle cx="50" cy="45" r="1.5" fill={activeTheme.svgPrimary} />
        </svg>
      </div>

      <div className={`absolute -top-3.5 -right-3.5 w-12 sm:w-16 h-12 sm:h-16 pointer-events-none ${activeTheme.textPrimary} z-20`} style={{ filter: `drop-shadow(0 0 6px ${activeTheme.glowHex})` }}>
        <svg viewBox="0 0 100 100" className="w-full h-full scale-x-[-1] animate-pulse" fill="none">
          <path d="M50,12 C25,12 15,30 20,48 C23,58 29,64 34,64 C38,64 43,58 50,58 C57,58 62,64 66,64 C71,64 77,58 80,48 C85,30 75,12 50,12 Z" fill="rgba(8, 20, 40, 0.5)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M46,64 Q32,82 36,94" stroke={activeTheme.svgPrimary} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M50,60 Q50,85 53,95" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M54,64 Q68,82 64,94" stroke={activeTheme.svgSecondary} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M25,58 Q15,75 12,85" stroke={activeTheme.svgPrimary} strokeWidth="0.8" opacity="0.8" />
          <path d="M35,64 Q22,80 20,90" stroke={activeTheme.svgSecondary} strokeWidth="1" opacity="0.8" />
          <path d="M65,64 Q78,80 80,90" stroke={activeTheme.svgPrimary} strokeWidth="1" opacity="0.8" />
          <path d="M75,58 Q85,75 88,85" stroke={activeTheme.svgSecondary} strokeWidth="0.8" opacity="0.8" />
          <circle cx="36" cy="35" r="2" fill={activeTheme.svgPrimary} />
          <circle cx="50" cy="26" r="2.5" fill="currentColor" />
          <circle cx="64" cy="35" r="2" fill={activeTheme.svgSecondary} />
          <circle cx="50" cy="45" r="1.5" fill={activeTheme.svgPrimary} />
        </svg>
      </div>

      <div className={`absolute -bottom-3.5 -left-3.5 w-12 sm:w-16 h-12 sm:h-16 pointer-events-none ${activeTheme.textPrimary} z-20`} style={{ filter: `drop-shadow(0 0 6px ${activeTheme.glowHex})` }}>
        <svg viewBox="0 0 100 100" className="w-full h-full scale-y-[-1] animate-pulse" fill="none">
          <path d="M50,12 C25,12 15,30 20,48 C23,58 29,64 34,64 C38,64 43,58 50,58 C57,58 62,64 66,64 C71,64 77,58 80,48 C85,30 75,12 50,12 Z" fill="rgba(8, 20, 40, 0.5)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M46,64 Q32,82 36,94" stroke={activeTheme.svgPrimary} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M50,60 Q50,85 53,95" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M54,64 Q68,82 64,94" stroke={activeTheme.svgSecondary} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M25,58 Q15,75 12,85" stroke={activeTheme.svgPrimary} strokeWidth="0.8" opacity="0.8" />
          <path d="M35,64 Q22,80 20,90" stroke={activeTheme.svgSecondary} strokeWidth="1" opacity="0.8" />
          <path d="M65,64 Q78,80 80,90" stroke={activeTheme.svgPrimary} strokeWidth="1" opacity="0.8" />
          <path d="M75,58 Q85,75 88,85" stroke={activeTheme.svgSecondary} strokeWidth="0.8" opacity="0.8" />
          <circle cx="36" cy="35" r="2" fill={activeTheme.svgPrimary} />
          <circle cx="50" cy="26" r="2.5" fill="currentColor" />
          <circle cx="64" cy="35" r="2" fill={activeTheme.svgSecondary} />
          <circle cx="50" cy="45" r="1.5" fill={activeTheme.svgPrimary} />
        </svg>
      </div>

      <div className={`absolute -bottom-3.5 -right-3.5 w-12 sm:w-16 h-12 sm:h-16 pointer-events-none ${activeTheme.textPrimary} z-20`} style={{ filter: `drop-shadow(0 0 6px ${activeTheme.glowHex})` }}>
        <svg viewBox="0 0 100 100" className="w-full h-full scale-x-[-1] scale-y-[-1] animate-pulse" fill="none">
          <path d="M50,12 C25,12 15,30 20,48 C23,58 29,64 34,64 C38,64 43,58 50,58 C57,58 62,64 66,64 C71,64 77,58 80,48 C85,30 75,12 50,12 Z" fill="rgba(8, 20, 40, 0.5)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M46,64 Q32,82 36,94" stroke={activeTheme.svgPrimary} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M50,60 Q50,85 53,95" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M54,64 Q68,82 64,94" stroke={activeTheme.svgSecondary} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M25,58 Q15,75 12,85" stroke={activeTheme.svgPrimary} strokeWidth="0.8" opacity="0.8" />
          <path d="M35,64 Q22,80 20,90" stroke={activeTheme.svgSecondary} strokeWidth="1" opacity="0.8" />
          <path d="M65,64 Q78,80 80,90" stroke={activeTheme.svgPrimary} strokeWidth="1" opacity="0.8" />
          <path d="M75,58 Q85,75 88,85" stroke={activeTheme.svgSecondary} strokeWidth="0.8" opacity="0.8" />
          <circle cx="36" cy="35" r="2" fill={activeTheme.svgPrimary} />
          <circle cx="50" cy="26" r="2.5" fill="currentColor" />
          <circle cx="64" cy="35" r="2" fill={activeTheme.svgSecondary} />
          <circle cx="50" cy="45" r="1.5" fill={activeTheme.svgPrimary} />
        </svg>
      </div>

      {title && (
        <h2 className={`text-2xl font-display tracking-widest mb-6 flex items-center gap-3 text-white drop-shadow-md border-b ${activeTheme.borderSingle} pb-3`}>
          {icon && <span className={activeTheme.activeIconColor}>{icon}</span>}
          {title}
        </h2>
      )}

      <div className={`relative z-10 w-full ${activeTheme.textLight}`}>
        {children}
      </div>
    </div>
  );
});
