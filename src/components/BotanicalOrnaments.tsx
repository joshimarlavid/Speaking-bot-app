import React from 'react';

/**
 * Botanical Anatomy ornaments for LINGUAROLE.
 * Everything is drawn as thin gold engraving: leaves, veins, thorns, roots and
 * dissected blooms. Dark, a little funereal, always gilded.
 */

const GOLD = '#c9a24b';
const GOLD_LIGHT = '#e8c97c';
const MOSS = '#93ae94';

/** A trailing sprig of leaves and thorns, drawn from the top-left corner. */
export const LeafSprig: React.FC<{ className?: string; flipX?: boolean; flipY?: boolean }> = ({
  className = '',
  flipX = false,
  flipY = false,
}) => (
  <svg
    viewBox="0 0 140 140"
    className={className}
    fill="none"
    aria-hidden="true"
    style={{ transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})` }}
  >
    <g stroke={GOLD} strokeWidth="1.1" strokeLinecap="round" opacity="0.9">
      {/* main stem */}
      <path d="M2 4 C22 20 40 30 52 48 C66 70 60 96 44 118 C36 129 28 136 20 140" />
      <path d="M18 16 C34 26 48 40 56 58" opacity="0.45" />
      {/* leaves along the stem */}
      <path d="M25 22 C40 18 54 22 62 32 C48 40 33 38 25 22 Z" fill="rgba(201,162,75,0.06)" />
      <path d="M27 24 C40 24 51 28 59 34" opacity="0.5" strokeWidth="0.7" />
      <path d="M44 38 C60 40 72 50 75 63 C58 64 46 54 44 38 Z" fill="rgba(201,162,75,0.05)" />
      <path d="M47 42 C58 46 68 55 72 62" opacity="0.5" strokeWidth="0.7" />
      <path d="M54 58 C45 48 30 46 20 52 C28 66 44 70 54 58 Z" fill="rgba(147,174,148,0.06)" />
      <path d="M52 58 C42 55 31 53 22 53" opacity="0.45" strokeWidth="0.7" />
      <path d="M60 74 C76 72 90 80 95 94 C77 97 63 88 60 74 Z" fill="rgba(201,162,75,0.05)" />
      <path d="M62 77 C74 79 86 86 92 92" opacity="0.5" strokeWidth="0.7" />
      <path d="M55 92 C43 86 28 88 18 98 C30 110 46 107 55 92 Z" fill="rgba(143,53,80,0.08)" />
      <path d="M53 93 C42 94 29 96 21 98" opacity="0.45" strokeWidth="0.7" />
      <path d="M46 110 C58 104 72 108 80 120 C66 128 52 123 46 110 Z" fill="rgba(201,162,75,0.05)" />
      {/* thorns */}
      <path d="M38 30 L31 25 L37 23 Z" fill={GOLD} opacity="0.55" strokeWidth="0.4" />
      <path d="M70 62 L78 56 L76 64 Z" fill={GOLD} opacity="0.5" strokeWidth="0.4" />
      <path d="M40 92 L31 94 L37 99 Z" fill={GOLD} opacity="0.5" strokeWidth="0.4" />
      {/* hanging bell bloom */}
      <path d="M70 62 C70 70 64 76 62 82 C68 86 76 84 78 78 C76 72 72 68 70 62 Z" fill="rgba(143,53,80,0.12)" />
      <path d="M62 82 L60 90 M66 83 L66 92 M72 82 L74 90" strokeWidth="0.8" />
    </g>
    <g fill={GOLD_LIGHT} opacity="0.7">
      <circle cx="70" cy="61" r="1.7" />
      <circle cx="54" cy="58" r="1.3" />
      <circle cx="25" cy="22" r="1.2" />
    </g>
  </svg>
);

/** A thin, upright vine used as a column at the edges of the conservatory. */
const VineColumn: React.FC<{ className?: string; mirrored?: boolean }> = ({ className = '', mirrored = false }) => (
  <svg
    viewBox="0 0 120 620"
    className={className}
    fill="none"
    aria-hidden="true"
    style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}
  >
    <g stroke={GOLD} strokeWidth="1" strokeLinecap="round">
      <path d="M60 0 C36 60 84 110 58 170 C34 226 82 280 56 338 C32 396 80 452 58 510 C44 550 52 590 60 620" opacity="0.75" />
      <path d="M60 0 C84 60 36 110 62 170 C86 226 38 280 64 338 C88 396 40 452 62 510 C76 550 68 590 60 620" opacity="0.28" />
      {[36, 96, 158, 218, 282, 344, 408, 470, 532].map((y, i) => (
        <g key={y} opacity={0.65 - i * 0.03}>
          <path d={`M${58 + (i % 2 ? -6 : 6)} ${y} C${28 + (i % 2 ? 10 : 0)} ${y + 6} ${18 + (i % 2 ? 10 : 0)} ${y + 30} ${30} ${y + 42} C${44} ${y + 34} ${52} ${y + 18} ${58 + (i % 2 ? -6 : 6)} ${y} Z`} fill="rgba(201,162,75,0.045)" />
          <path d={`M${58 + (i % 2 ? -6 : 6)} ${y + 2} C44 ${y + 12} 34 ${y + 26} 31 ${y + 40}`} strokeWidth="0.6" opacity="0.7" />
          <path d={`M${60 + (i % 2 ? 4 : -4)} ${y + 10} C86 ${y + 16} 96 ${y + 40} 88 ${y + 54} C74 ${y + 46} 66 ${y + 28} ${60 + (i % 2 ? 4 : -4)} ${y + 10} Z`} fill="rgba(143,53,80,0.05)" />
        </g>
      ))}
      <path d="M44 62 L37 58 L43 52 Z" fill={GOLD} opacity="0.4" strokeWidth="0.4" />
      <path d="M80 250 L88 246 L84 256 Z" fill={GOLD} opacity="0.4" strokeWidth="0.4" />
    </g>
  </svg>
);

/** A dissected moonflower plate: petals, stamens, ovary and roots. */
const MoonflowerPlate: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 520 640" className={className} fill="none" aria-hidden="true">
    <g stroke={GOLD} strokeWidth="1" strokeLinecap="round">
      <circle cx="260" cy="230" r="196" strokeDasharray="2 10" opacity="0.4" />
      <circle cx="260" cy="230" r="168" opacity="0.25" />
      {/* petals — six, with central veins */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 260 230)`} opacity="0.7">
          <path d="M260 230 C232 168 236 96 260 68 C284 96 288 168 260 230 Z" fill="rgba(201,162,75,0.05)" />
          <path d="M260 220 L260 84" strokeWidth="0.55" opacity="0.65" />
          <path d="M260 150 L246 132 M260 150 L274 132 M260 186 L248 168 M260 186 L272 168 M260 118 L250 102 M260 118 L270 102" strokeWidth="0.45" opacity="0.45" />
        </g>
      ))}
      {/* stamens */}
      {[-38, -19, 0, 19, 38].map((dx, i) => (
        <g key={dx} opacity="0.8">
          <path d={`M260 236 C${260 + dx} 216 ${260 + dx * 1.5} ${200 - Math.abs(dx) / 2} ${260 + dx * 1.7} ${184 - Math.abs(dx) / 3}`} strokeWidth="0.8" />
          <ellipse cx={260 + dx * 1.7} cy={184 - Math.abs(dx) / 3} rx="3.4" ry="5" fill="rgba(232,201,124,0.25)" />
          {i === 2 && <circle cx="260" cy="228" r="16" fill="rgba(143,53,80,0.15)" />}
        </g>
      ))}
      {/* stem and roots */}
      <path d="M260 300 C258 372 250 430 258 486" strokeWidth="1.4" />
      <path d="M258 486 C232 510 208 536 190 578 M258 486 C284 512 302 540 316 584 M258 486 C246 522 240 556 242 602 M258 486 C270 520 276 550 276 594" strokeWidth="0.8" opacity="0.8" />
      <path d="M250 452 C224 442 202 448 188 462 C208 474 234 470 250 452 Z" fill="rgba(147,174,148,0.06)" opacity="0.9" />
      <path d="M262 512 C288 502 310 508 322 522 C302 534 278 530 262 512 Z" fill="rgba(147,174,148,0.06)" opacity="0.9" />
      <path d="M256 396 C232 388 214 394 202 406 C220 416 242 412 256 396 Z" fill="rgba(201,162,75,0.04)" opacity="0.9" />
    </g>
    <g fill={GOLD_LIGHT} opacity="0.55">
      <circle cx="260" cy="228" r="2" />
      <circle cx="205" cy="190" r="1.6" />
      <circle cx="315" cy="190" r="1.6" />
    </g>
  </svg>
);

/**
 * The full-canvas conservatory: velvet gradients, engraving plates, drifting
 * gold spores and a vignette. Purely decorative — never intercepts pointer events.
 */
export const BotanicalBackdrop: React.FC<{ imageUrl?: string | null; tint?: string }> = ({
  imageUrl,
  tint,
}) => {
  const spores = React.useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        left: (i * 37 + 11) % 100,
        size: 2 + ((i * 13) % 5),
        delay: (i * 1.7) % 22,
        duration: 26 + ((i * 7) % 24),
        drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 14)),
      })),
    []
  );

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* velvet ground */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 15% 0%, #3a1220 0%, #200c14 42%, #0d070a 100%), radial-gradient(90% 80% at 92% 100%, #14261c 0%, transparent 62%)',
        }}
      />
      {imageUrl && (
        <div
          className="absolute inset-0 opacity-25 mix-blend-soft-light"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      {tint && (
        <div
          className="absolute inset-0 opacity-70 mix-blend-multiply transition-colors duration-700"
          style={{ background: tint }}
        />
      )}

      {/* engraving plates */}
      <MoonflowerPlate className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(78vw,760px)] opacity-[0.13] botanical-sway" />
      <VineColumn className="absolute top-0 left-0 h-full w-24 sm:w-32 opacity-[0.22] botanical-sway" />
      <VineColumn className="absolute top-0 right-0 h-full w-24 sm:w-32 opacity-[0.18] botanical-sway" mirrored />

      {/* specimen speckle */}
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(232,201,124,0.5) 0.7px, transparent 0.8px), radial-gradient(rgba(147,174,148,0.4) 0.6px, transparent 0.7px)',
          backgroundSize: '38px 38px, 57px 57px',
          backgroundPosition: '0 0, 12px 20px',
        }}
      />

      {/* drifting spores */}
      {spores.map((s) => (
        <span
          key={s.id}
          className="spore absolute bottom-0 rounded-full"
          style={{
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: s.id % 3 === 0 ? MOSS : GOLD_LIGHT,
            boxShadow: `0 0 8px ${s.id % 3 === 0 ? 'rgba(147,174,148,0.7)' : 'rgba(232,201,124,0.8)'}`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            ['--drift' as string]: `${s.drift}px`,
          }}
        />
      ))}

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 40%, transparent 45%, rgba(6,3,5,0.75) 100%), linear-gradient(180deg, rgba(6,3,5,0.55) 0%, transparent 30%, rgba(6,3,5,0.85) 100%)',
        }}
      />
    </div>
  );
};

/** Gold crest: a bloom opening over a language sigil. */
export const BotanicalEmblem: React.FC<{ className?: string; pulse?: boolean }> = ({
  className = '',
  pulse = true,
}) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
    <circle cx="60" cy="60" r="52" stroke={GOLD} strokeWidth="0.8" strokeDasharray="1 6" opacity="0.7" className={pulse ? 'sigil-turn' : ''} />
    <circle cx="60" cy="60" r="43" stroke={GOLD} strokeWidth="0.8" opacity="0.55" />
    <g stroke={GOLD_LIGHT} strokeWidth="1" strokeLinecap="round" opacity="0.95">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 60 60)`}>
          <path d="M60 60 C53 44 54 30 60 23 C66 30 67 44 60 60 Z" fill="rgba(201,162,75,0.08)" />
          <path d="M60 56 L60 28" strokeWidth="0.5" opacity="0.6" />
        </g>
      ))}
      <circle cx="60" cy="60" r="8" fill="rgba(143,53,80,0.3)" />
      <path d="M60 54 C56 58 56 63 60 66 C64 63 64 58 60 54 Z" fill="rgba(232,201,124,0.5)" />
      <path d="M60 72 C62 78 62 82 60 86 M60 72 C58 78 58 82 60 86" strokeWidth="0.7" opacity="0.7" />
      <path d="M60 86 C52 92 46 98 44 106 M60 86 C68 92 74 98 76 106" strokeWidth="0.7" opacity="0.6" />
    </g>
  </svg>
);

/** A hairline rule with a leaf node in the middle. */
export const BotanicalDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
    <span className="gold-rule flex-1" />
    <svg viewBox="0 0 40 16" className="h-3 w-10" fill="none">
      <path d="M20 8 C12 8 7 4 2 3 C6 9 12 12 20 8 Z" stroke={GOLD} strokeWidth="0.9" />
      <path d="M20 8 C28 8 33 4 38 3 C34 9 28 12 20 8 Z" stroke={GOLD} strokeWidth="0.9" />
      <circle cx="20" cy="8" r="1.4" fill={GOLD_LIGHT} />
    </svg>
    <span className="gold-rule flex-1" />
  </div>
);

/**
 * The gilded specimen frame used for every panel. Velvet ground, double gold
 * rule, engraved corner sprigs and a small catalogue number.
 */
export const GildedFrame: React.FC<{
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  theme?: { activeIconColor?: string; glowClass?: string };
  className?: string;
  accessory?: React.ReactNode;
}> = ({ children, title, icon, theme, className = '', accessory }) => (
  <div
    className={`relative rounded-[1.6rem] p-[10px] transition-all duration-500 ${className}`}
    style={{
      background:
        'linear-gradient(155deg, rgba(201,162,75,0.75) 0%, rgba(107,79,30,0.35) 22%, rgba(201,162,75,0.55) 52%, rgba(58,18,32,0.6) 78%, rgba(201,162,75,0.7) 100%)',
      boxShadow: '0 30px 70px -30px rgba(0,0,0,0.95), 0 0 42px rgba(143,53,80,0.18)',
    }}
  >
    <div className="glass-panel rounded-[1.25rem] p-5 sm:p-7 relative overflow-hidden">
      {/* engraved corner sprays */}
      <LeafSprig className="pointer-events-none absolute -top-1 -left-1 h-16 w-16 sm:h-20 sm:w-20 opacity-70 gold-ember" />
      <LeafSprig flipX className="pointer-events-none absolute -top-1 -right-1 h-16 w-16 sm:h-20 sm:w-20 opacity-60 gold-ember" />
      <LeafSprig flipY className="pointer-events-none absolute -bottom-1 -left-1 h-16 w-16 sm:h-20 sm:w-20 opacity-45" />
      <LeafSprig flipX flipY className="pointer-events-none absolute -bottom-1 -right-1 h-16 w-16 sm:h-20 sm:w-20 opacity-45" />

      {title && (
        <div className="relative z-10 mb-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="gold-title text-base sm:text-xl flex items-center gap-2.5">
              {icon && <span className={theme?.activeIconColor || 'gold-ink'}>{icon}</span>}
              {title}
            </h2>
            {accessory}
          </div>
          <BotanicalDivider className="mt-3" />
        </div>
      )}

      <div className="relative z-10 w-full bone-ink">{children}</div>
    </div>
  </div>
);
