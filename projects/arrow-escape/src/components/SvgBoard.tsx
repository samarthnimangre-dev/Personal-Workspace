// Scalable, theme-aware SVG Board rendering a clean, box-free minimalist canvas with subtle guide dots and active arrows
import React from 'react';
import type { BoardModel } from '../engine/BoardModel';
import type { ArrowModel } from '../engine/ArrowModel';
import type { GameTheme } from '../engine/types';
import { SvgArrow } from './SvgArrow';
import { ParticleOverlay } from './ParticleOverlay';
import { getDirectionAngle } from '../engine/Direction';

interface SvgBoardProps {
  board: BoardModel;
  arrows: readonly ArrowModel[];
  theme: GameTheme;
  cellSize?: number;
  showGridDots?: boolean;
  onArrowTap: (arrowId: string) => void;
  onCancelBooster?: () => void;
}

export const SvgBoard: React.FC<SvgBoardProps> = ({
  board,
  arrows,
  theme,
  cellSize = 72,
  showGridDots = true,
  onArrowTap,
  onCancelBooster,
}) => {
  const boardWidth = board.cols * cellSize;
  const boardHeight = board.rows * cellSize;
  const padding = 18;
  const viewBoxWidth = boardWidth + padding * 2;
  const viewBoxHeight = boardHeight + padding * 2;

  const isDark = theme === 'dark';
  const isEyeComfort = theme === 'eye-comfort';

  // Minimalist grid guidance dots at cell centers (zero square boxes/blocks)
  const gridDots = [];
  if (showGridDots) {
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (!board.isInsideCoords(r, c)) continue;
        gridDots.push({
          key: `${r}-${c}`,
          cx: c * cellSize + padding + cellSize / 2,
          cy: r * cellSize + padding + cellSize / 2,
        });
      }
    }
  }

  const deflectorList = board.deflectors ? Array.from(board.deflectors.values()) : [];
  const dotFill = isDark
    ? 'rgba(255, 255, 255, 0.15)'
    : isEyeComfort
    ? 'rgba(74, 53, 37, 0.16)'
    : 'rgba(15, 23, 42, 0.13)';

  return (
    <div
      className="relative svg-board-container w-full max-w-[390px] mx-auto aspect-square flex items-center justify-center p-2 select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Particle Canvas Overlay on top of SVG */}
      <ParticleOverlay width={viewBoxWidth} height={viewBoxHeight} />

      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full max-w-full max-h-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        style={{ touchAction: 'manipulation' }}
        onClick={onCancelBooster}
      >
        <defs>
          {/* Cyan Rim Light Bloom Filter */}
          <filter id="cyanBevelBloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Minimalist Grid Guide Dots (NO square blocks, boxes or plinths) */}
        {gridDots.map((dot) => (
          <circle
            key={dot.key}
            cx={dot.cx}
            cy={dot.cy}
            r={2.2}
            fill={dotFill}
          />
        ))}


        {/* Deflector Redirect Runes */}
        {deflectorList.map((d) => {
          const x = d.col * cellSize + padding;
          const y = d.row * cellSize + padding;
          const center = cellSize / 2;
          const angle = getDirectionAngle(d.redirectDirection);
          return (
            <g key={`deflector-${d.row}-${d.col}`} transform={`translate(${x}, ${y})`}>
              <polygon
                points={`${center},${center - cellSize * 0.32} ${center + cellSize * 0.32},${center} ${center},${center + cellSize * 0.32} ${center - cellSize * 0.32},${center}`}
                fill={isDark ? 'rgba(6, 182, 212, 0.18)' : 'rgba(6, 182, 212, 0.12)'}
                stroke="#06b6d4"
                strokeWidth={1.8}
                strokeDasharray="3 2"
                filter="drop-shadow(0 0 6px rgba(6, 182, 212, 0.6))"
              />
              <circle cx={center} cy={center} r={cellSize * 0.14} fill="#0ea5e9" opacity={0.85} />
              {/* Directional Chevron Pointer */}
              <g transform={`rotate(${angle}, ${center}, ${center})`}>
                <polyline
                  points={`${center - 4},${center - 6} ${center + 5},${center} ${center - 4},${center + 6}`}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="drop-shadow(0 0 3px #000)"
                />
              </g>
            </g>
          );
        })}

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
              onTap={onArrowTap}
              board={board}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
