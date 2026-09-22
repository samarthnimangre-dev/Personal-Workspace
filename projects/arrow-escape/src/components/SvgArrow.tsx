// Pure SVG Arrow Component with crisp vector rendering, tactile depth, and touch-first hit target
import React from 'react';
import type { ArrowModel } from '../engine/ArrowModel';

interface SvgArrowProps {
  arrow: ArrowModel;
  cellSize: number;
  onTap: (arrowId: string) => void;
}

export const SvgArrow: React.FC<SvgArrowProps> = ({ arrow, cellSize, onTap }) => {
  if (arrow.isEscaped) return null;

  const x = arrow.col * cellSize;
  const y = arrow.row * cellSize;
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
      transform={`translate(${x}, ${y})`}
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
      {/* 3D Tile Drop Shadow */}
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
        fill={isBlocked ? '#450a0a' : '#0f172a'}
        stroke={isBlocked ? '#ef4444' : arrow.color}
        strokeWidth={isBlocked ? 2 : 1.5}
        className="transition-colors duration-200"
      />

      {/* Top Gloss Specular Highlight */}
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

      {/* Directional Arrow Vector Glyph (Rotated around tile center) */}
      <g transform={`rotate(${arrow.angle}, ${center}, ${center})`}>
        {/* Glow under-pass */}
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

        {/* Arrowhead Chevron */}
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

      {/* Large Transparent Hit Area for thumb touch targets */}
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
};
