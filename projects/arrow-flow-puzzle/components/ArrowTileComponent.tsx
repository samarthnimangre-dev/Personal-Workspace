'use client';

import React from 'react';
import { ArrowTile, ThemeDefinition } from '@/types/game';
import { getDirectionAngle } from '@/lib/raycast';
import { ArrowRight, Hammer } from 'lucide-react';

interface ArrowTileProps {
  arrow: ArrowTile;
  cellSize: number;
  theme: ThemeDefinition;
  isHammerMode: boolean;
  isBlocked: boolean;
  onClick: (arrow: ArrowTile) => void;
}

export const ArrowTileComponent: React.FC<ArrowTileProps> = ({
  arrow,
  cellSize,
  theme,
  isHammerMode,
  isBlocked,
  onClick,
}) => {
  const angle = getDirectionAngle(arrow.direction);

  // Dynamic animation translation for launch
  let escapeTransform = '';
  if (arrow.isRemoving) {
    const travel = 500;
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * travel;
    const dy = Math.sin(rad) * travel;
    escapeTransform = `translate(${dx}px, ${dy}px) scale(0.6)`;
  }

  return (
    <button
      onClick={() => onClick(arrow)}
      disabled={arrow.isRemoving}
      style={{
        width: `${cellSize}px`,
        height: `${cellSize}px`,
        transform: arrow.isRemoving ? escapeTransform : undefined,
        transition: arrow.isRemoving
          ? 'transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 300ms ease-out'
          : 'transform 150ms ease, box-shadow 150ms ease',
      }}
      className={`
        relative rounded-xl flex items-center justify-center cursor-pointer select-none
        border transition-all duration-150 active:scale-90
        ${arrow.isRemoving ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        ${isBlocked ? 'animate-shake border-rose-500 bg-rose-950/80 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : ''}
        ${arrow.isHinted ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-950 animate-pulse' : ''}
        ${isHammerMode ? 'hover:border-rose-400 hover:scale-105 hover:bg-rose-900/40' : ''}
        ${!isBlocked && !arrow.isHinted ? `${theme.arrowBg} ${theme.arrowBorder} ${theme.arrowGlow}` : ''}
      `}
      title={isHammerMode ? 'Destroy this arrow with hammer' : `Arrow pointing ${arrow.direction}`}
    >
      {/* Directional Arrow Graphic */}
      <div
        style={{
          transform: `rotate(${angle}deg)`,
          transition: 'transform 200ms ease',
        }}
        className="flex items-center justify-center pointer-events-none"
      >
        <ArrowRight
          style={{
            width: `${cellSize * 0.52}px`,
            height: `${cellSize * 0.52}px`,
            color: arrow.color || theme.accentColor,
            filter: `drop-shadow(0 0 6px ${arrow.color || theme.accentColor})`,
          }}
          strokeWidth={3}
        />
      </div>

      {/* Hammer overlay preview when hammer mode is active */}
      {isHammerMode && (
        <div className="absolute inset-0 bg-rose-500/20 backdrop-blur-[1px] rounded-xl flex items-center justify-center animate-pulse">
          <Hammer className="w-5 h-5 text-rose-300 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
        </div>
      )}
    </button>
  );
};
