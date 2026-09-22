// Scalable, theme-aware SVG Board rendering tactile grid slots and active arrows with particle FX
import React from 'react';
import type { BoardModel } from '../engine/BoardModel';
import type { ArrowModel } from '../engine/ArrowModel';
import { SvgArrow } from './SvgArrow';
import { ParticleOverlay } from './ParticleOverlay';
import { particleController } from '../utils/particles';

interface SvgBoardProps {
  board: BoardModel;
  arrows: readonly ArrowModel[];
  theme: 'dark' | 'light';
  cellSize?: number;
  onArrowTap: (arrowId: string) => void;
}

export const SvgBoard: React.FC<SvgBoardProps> = ({
  board,
  arrows,
  theme,
  cellSize = 72,
  onArrowTap,
}) => {
  const boardWidth = board.cols * cellSize;
  const boardHeight = board.rows * cellSize;
  const padding = 18;
  const viewBoxWidth = boardWidth + padding * 2;
  const viewBoxHeight = boardHeight + padding * 2;

  const isDark = theme === 'dark';

  // Handle arrow tap and spawn directional particles
  const handleArrowTapWithFX = (arrowId: string, headCenter: { x: number; y: number }) => {
    const arrow = arrows.find((a) => a.id === arrowId);
    if (arrow) {
      // Trigger particles at the head's position
      particleController.burstEscape(
        headCenter.x + padding,
        headCenter.y + padding,
        arrow.color,
        arrow.angle
      );
    }
    onArrowTap(arrowId);
  };

  // Pre-generate grid background cell slots
  const gridSlots = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      gridSlots.push({
        key: `${r}-${c}`,
        x: c * cellSize + padding + 4,
        y: r * cellSize + padding + 4,
        size: cellSize - 8,
      });
    }
  }

  return (
    <div className="relative svg-board-container w-full max-w-[390px] mx-auto aspect-square flex items-center justify-center p-2 select-none">
      {/* Particle Canvas Overlay on top of SVG */}
      <ParticleOverlay width={viewBoxWidth} height={viewBoxHeight} />

      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full max-w-full max-h-full drop-shadow-2xl overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        style={{ touchAction: 'manipulation' }}
      >
        <defs>
          {/* Specular gloss highlight gradient */}
          <linearGradient id="specularGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isDark ? 0.22 : 0.45} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>

          {/* Board gradient backdrop */}
          <linearGradient id="boardBackdrop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={isDark ? '#0b1329' : '#ffffff'} />
            <stop offset="100%" stopColor={isDark ? '#030712' : '#e2e8f0'} />
          </linearGradient>
        </defs>

        {/* Outer Board Slab Background */}
        <rect
          x={padding - 6}
          y={padding - 6}
          width={boardWidth + 12}
          height={boardHeight + 12}
          rx={22}
          ry={22}
          fill="url(#boardBackdrop)"
          stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}
          strokeWidth={1.5}
        />

        {/* Inset Grid Slots */}
        {gridSlots.map((slot) => (
          <rect
            key={slot.key}
            x={slot.x}
            y={slot.y}
            width={slot.size}
            height={slot.size}
            rx={14}
            ry={14}
            fill={isDark ? '#030712' : '#f8fafc'}
            stroke={isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.06)'}
            strokeWidth={1}
          />
        ))}

        {/* Active Arrows Group */}
        <g transform={`translate(${padding}, ${padding})`}>
          {arrows.map((arrow) => (
            <SvgArrow
              key={arrow.id}
              arrow={arrow}
              cellSize={cellSize}
              boardRows={board.rows}
              boardCols={board.cols}
              theme={theme}
              onTap={handleArrowTapWithFX}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
