// Scalable SVG Board rendering the grid container and active vector arrows
import React from 'react';
import type { BoardModel } from '../engine/BoardModel';
import type { ArrowModel } from '../engine/ArrowModel';
import { SvgArrow } from './SvgArrow';

interface SvgBoardProps {
  board: BoardModel;
  arrows: readonly ArrowModel[];
  cellSize?: number;
  onArrowTap: (arrowId: string) => void;
}

export const SvgBoard: React.FC<SvgBoardProps> = ({
  board,
  arrows,
  cellSize = 72,
  onArrowTap,
}) => {
  const boardWidth = board.cols * cellSize;
  const boardHeight = board.rows * cellSize;
  const padding = 16;
  const viewBoxWidth = boardWidth + padding * 2;
  const viewBoxHeight = boardHeight + padding * 2;

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
    <div className="svg-board-wrapper w-full max-w-md mx-auto aspect-square flex items-center justify-center p-2 select-none">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full max-w-full max-h-full drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
        style={{ touchAction: 'manipulation' }}
      >
        <defs>
          {/* Specular highlight gradient for arrow tiles */}
          <linearGradient id="specularGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>

          {/* Board gradient backdrop */}
          <linearGradient id="boardBackdrop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0b1329" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>
        </defs>

        {/* Outer Board Slab Background */}
        <rect
          x={padding - 6}
          y={padding - 6}
          width={boardWidth + 12}
          height={boardHeight + 12}
          rx={20}
          ry={20}
          fill="url(#boardBackdrop)"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={1.5}
        />

        {/* Background Inset Grid Slots */}
        {gridSlots.map((slot) => (
          <rect
            key={slot.key}
            x={slot.x}
            y={slot.y}
            width={slot.size}
            height={slot.size}
            rx={14}
            ry={14}
            fill="#020617"
            stroke="rgba(255, 255, 255, 0.04)"
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
              onTap={onArrowTap}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
