import { motion } from 'motion/react';
import type { Formation, PlayerSlot } from '../../lib/types';
import { FORMATION_SLOTS } from './formations';

interface PitchProps {
  formation: Formation;
  players: (PlayerSlot | null)[];
  selectedSlot: number | null;
  onSlotClick: (index: number) => void;
  onToggleCaptain: (index: number) => void;
  readOnly?: boolean;
}

export function Pitch({ formation, players, selectedSlot, onSlotClick, onToggleCaptain, readOnly = false }: PitchProps) {
  const slots = FORMATION_SLOTS[formation];

  return (
    <div className="relative aspect-[3/4] w-full max-w-lg overflow-hidden rounded-xl border-2 border-white/60 shadow-lg">
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(90deg, #4caf6a 0, #4caf6a 12px, #3d9e59 12px, #3d9e59 24px)',
        }}
      />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <rect x="2" y="2" width="96" height="96" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.6" />
        <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(255,255,255,0.75)" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="4" fill="rgba(255,255,255,0.5)" />
        <rect x="25" y="2" width="50" height="16" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.4" />
        <rect x="25" y="82" width="50" height="16" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.4" />
      </svg>

      {slots.map((slot, index) => {
        const player = players[index];
        const isSelected = selectedSlot === index;

        return (
          <motion.div
            key={`${formation}-${index}`}
            layout={!readOnly}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            {...(!readOnly && {
              onClick: () => onSlotClick(index),
              onContextMenu: (e: React.MouseEvent) => {
                e.preventDefault();
                if (player) onToggleCaptain(index);
              },
            })}
            animate={readOnly ? undefined : { left: `${slot.x}%`, top: `${slot.y}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          >
            <div
              className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white text-[10px] font-semibold shadow-md transition-all ${
                isSelected
                  ? 'border-[var(--accent-green)] ring-2 ring-[var(--accent-green)]/30'
                  : player?.isCaptain
                    ? 'border-[var(--accent-gold)] captain-ring'
                    : player
                      ? 'border-[var(--fg-2)]'
                      : 'border-dashed border-white/80 bg-white/70'
              }`}
            >
              {player?.photo ? (
                <img src={player.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="text-[var(--fg-1)]">{player ? player.position : slot.position}</span>
              )}
            </div>
            <span className="mt-1 max-w-[72px] truncate rounded bg-black/40 px-1 font-body text-[9px] font-medium text-white">
              {player?.name.split(' ').pop() ?? slot.position}
            </span>
          </motion.div>
        );
      })}

      <style>{`
        .captain-ring::after {
          content: 'C';
          position: absolute;
          top: -6px;
          right: -6px;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: var(--accent-gold);
          color: white;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
