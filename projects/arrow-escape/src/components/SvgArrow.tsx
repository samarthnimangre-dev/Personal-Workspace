// Scalable SVG Arrow Component rendering tactile head and body segments with touch-first accessibility
import React from 'react';
import type { ArrowModel } from '../engine/ArrowModel';

interface SvgArrowProps {
  arrow: ArrowModel;
  cellSize: number;
  onTap: (arrowId: string) => void;
}

export const SvgArrow: React.FC<SvgArrowProps> = ({ arrow, cellSize, onTap }) => {
  if (arrow.isEscaped) return null;

  const padding = cellSize * 0.08;
  const tileSize = cellSize - padding * 2;
  const radius = tileSize * 0.22;
  const center = cellSize / 2;

  // Arrow dimensions relative to cell
  const arrowLength = tileSize * 0.52;
  const headSize = tileSize * 0.22;
  const strokeWidth = Math.max(3, tileSize * 0.09);

  const isBlocked = arrow.isBlocked;
  const isEscaping = arrow.isEscaping;

  return (
    <g
      className={`svg-arrow ${isBlocked ? 'arrow-shake' : ''} ${isEscaping ? 'arrow-escape' : ''}`}
      style={{
        cursor: arrow.isIdle ? 'pointer' : 'default',
        touchAction: 'manipulation',
      }}
      onClick={() => onTap(arrow.id)}
      role="button"
      tabIndex={0}
      aria-label={`Arrow pointing ${arrow.direction} at row ${arrow.row + 1}, column ${arrow.col + 1}`}
    >
      {/* 1. Render all occupied body cells */}
      {arrow.occupiedCells.map((cell) => {
        const isHead = cell.row === arrow.head.row && cell.col === arrow.head.col;
        const cellX = cell.col * cellSize;
        const cellY = cell.row * cellSize;

        return (
          <g key={`${cell.row}-${cell.col}`} transform={`translate(${cellX}, ${cellY})`}>
            {/* 3D Drop Shadow */}
            <rect
              x={padding}
              y={padding + 3}
              width={tileSize}
              height={tileSize}
              rx={radius}
              ry={radius}
              fill="rgba(0, 0, 0, 0.45)"
            />

            {/* Tactile Tile Body */}
            <rect
              x={padding}
              y={padding}
              width={tileSize}
              height={tileSize}
              rx={radius}
              ry={radius}
              fill={isBlocked ? '#450a0a' : isHead ? '#0f172a' : '#1e293b'}
              stroke={isBlocked ? '#ef4444' : arrow.color}
              strokeWidth={isBlocked ? 2 : 1.5}
              className="transition-colors duration-200"
            />

            {/* Specular Top Gloss */}
            <rect
              x={padding + 2}
              y={padding + 2}
              width={tileSize - 4}
              height={tileSize * 0.35}
              rx={radius - 2}
              ry={radius - 2}
              fill="url(#specularGloss)"
              pointerEvents="none"
            />

            {/* Head Glyph: Directional Arrow Vector */}
            {isHead ? (
              <g transform={`rotate(${arrow.angle}, ${center}, ${center})`}>
                {/* Glow pass */}
                <line
                  x1={center - arrowLength / 2}
                  y1={center}
                  x2={center + arrowLength / 2 - headSize * 0.5}
                  y2={center}
                  stroke={arrow.color}
                  strokeWidth={strokeWidth + 2}
                  strokeLinecap="round"
                  opacity={0.4}
                />

                {/* Main Shaft Line */}
                <line
                  x1={center - arrowLength / 2}
                  y1={center}
                  x2={center + arrowLength / 2 - headSize * 0.5}
                  y2={center}
                  stroke={isBlocked ? '#fca5a5' : '#ffffff'}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />

                {/* Chevron Arrowhead */}
                <polyline
                  points={`
                    ${center + arrowLength / 2 - headSize},${center - headSize * 0.85}
                    ${center + arrowLength / 2},${center}
                    ${center + arrowLength / 2 - headSize},${center + headSize * 0.85}
                  `}
                  fill="none"
                  stroke={isBlocked ? '#fca5a5' : '#ffffff'}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ) : (
              /* Body Segment Connector Dot */
              <circle
                cx={center}
                cy={center}
                r={tileSize * 0.12}
                fill={arrow.color}
                opacity={0.7}
              />
            )}

            {/* Transparent Touch Hit Target */}
            <rect
              x={0}
              y={0}
              width={cellSize}
              height={cellSize}
              fill="transparent"
              style={{ cursor: 'pointer' }}
            />
          </g>
        );
      })}
    </g>
  );
};
