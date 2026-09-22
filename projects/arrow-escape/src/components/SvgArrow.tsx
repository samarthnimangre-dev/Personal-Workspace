// Polished SVG Arrow component with multi-cell body unification, directional recoil, and escape follow
import React from 'react';
import type { ArrowModel } from '../engine/ArrowModel';
import { getDirectionDelta } from '../engine/Direction';

interface SvgArrowProps {
  arrow: ArrowModel;
  cellSize: number;
  boardRows: number;
  boardCols: number;
  theme: 'dark' | 'light';
  onTap: (arrowId: string, headCenter: { x: number; y: number }) => void;
}

export const SvgArrow: React.FC<SvgArrowProps> = ({
  arrow,
  cellSize,
  boardRows,
  boardCols,
  theme,
  onTap,
}) => {
  if (arrow.isEscaped) return null;

  const padding = cellSize * 0.09;
  const tileSize = cellSize - padding * 2;
  const radius = tileSize * 0.24;
  const center = cellSize / 2;

  // Arrowhead and glyph metrics
  const arrowLength = tileSize * 0.54;
  const headSize = tileSize * 0.22;
  const strokeWidth = Math.max(3.5, tileSize * 0.1);

  const delta = getDirectionDelta(arrow.direction);

  // Calculate escape distance off the board bounds
  const escapeTravel = (Math.max(boardRows, boardCols) + 2) * cellSize;
  const escapeX = delta.dCol * escapeTravel;
  const escapeY = delta.dRow * escapeTravel;

  // Calculate directional impact recoil
  const nudgeX = delta.dCol * 9;
  const nudgeY = delta.dRow * 9;

  const isBlocked = arrow.isBlocked;
  const isEscaping = arrow.isEscaping;

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!arrow.isIdle) return;

    // Calculate absolute center of the arrow's head cell for particle spawning
    const headX = arrow.head.col * cellSize + center;
    const headY = arrow.head.row * cellSize + center;
    onTap(arrow.id, { x: headX, y: headY });
  };

  // Color schemes based on state and theme
  const isDark = theme === 'dark';
  const tileFill = isBlocked
    ? isDark ? '#450a0a' : '#fee2e2'
    : isDark ? '#0f172a' : '#ffffff';

  const tileStroke = isBlocked
    ? '#ef4444'
    : arrow.color;

  const glyphColor = isBlocked
    ? '#fca5a5'
    : isDark ? '#ffffff' : '#0f172a';

  return (
    <g
      className={`svg-arrow-group ${isBlocked ? 'arrow-blocked-recoil' : ''} ${
        isEscaping ? 'arrow-escaping-fly' : ''
      }`}
      style={
        {
          cursor: arrow.isIdle ? 'pointer' : 'default',
          touchAction: 'manipulation',
          '--nudge-x': `${nudgeX}px`,
          '--nudge-y': `${nudgeY}px`,
          '--escape-x': `${escapeX}px`,
          '--escape-y': `${escapeY}px`,
        } as React.CSSProperties
      }
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Arrow pointing ${arrow.direction} at row ${arrow.row + 1}, column ${arrow.col + 1}`}
    >
      {/* 1. Body Connectors: Seamlessly bridge adjacent cells in multi-cell arrows */}
      {arrow.occupiedCells.length > 1 &&
        arrow.occupiedCells.map((cellA, idx) => {
          // Connect to subsequent cells in chain
          const cellB = arrow.occupiedCells[idx + 1];
          if (!cellB) return null;

          const ax = cellA.col * cellSize + center;
          const ay = cellA.row * cellSize + center;
          const bx = cellB.col * cellSize + center;
          const by = cellB.row * cellSize + center;

          return (
            <g key={`bridge-${cellA.row},${cellA.col}-${cellB.row},${cellB.col}`}>
              {/* Connector shadow */}
              <line
                x1={ax}
                y1={ay + 3}
                x2={bx}
                y2={by + 3}
                stroke={isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(15, 23, 42, 0.12)'}
                strokeWidth={tileSize * 0.72}
                strokeLinecap="round"
              />
              {/* Connector body fill */}
              <line
                x1={ax}
                y1={ay}
                x2={bx}
                y2={by}
                stroke={tileFill}
                strokeWidth={tileSize * 0.72}
                strokeLinecap="round"
              />
              {/* Connector accent border line */}
              <line
                x1={ax}
                y1={ay}
                x2={bx}
                y2={by}
                stroke={tileStroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={0.6}
              />
            </g>
          );
        })}

      {/* 2. Cell Tiles: Head and Body Segments */}
      {arrow.occupiedCells.map((cell) => {
        const isHead = cell.row === arrow.head.row && cell.col === arrow.head.col;
        const cellX = cell.col * cellSize;
        const cellY = cell.row * cellSize;

        return (
          <g key={`cell-${cell.row}-${cell.col}`} transform={`translate(${cellX}, ${cellY})`}>
            {/* 3D Drop Shadow */}
            <rect
              x={padding}
              y={padding + 3}
              width={tileSize}
              height={tileSize}
              rx={radius}
              ry={radius}
              fill={isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.14)'}
            />

            {/* Tactile Tile Body */}
            <rect
              x={padding}
              y={padding}
              width={tileSize}
              height={tileSize}
              rx={radius}
              ry={radius}
              fill={tileFill}
              stroke={tileStroke}
              strokeWidth={isBlocked ? 2.5 : isHead ? 2 : 1.5}
              filter={isDark && !isBlocked ? `drop-shadow(0 0 4px ${arrow.color}40)` : undefined}
            />

            {/* Specular Top Gloss Highlight */}
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

            {/* Head Glyph or Body Link Indicator */}
            {isHead ? (
              <g transform={`rotate(${arrow.angle}, ${center}, ${center})`}>
                {/* Arrowhead glowing underlay */}
                <line
                  x1={center - arrowLength / 2}
                  y1={center}
                  x2={center + arrowLength / 2 - headSize * 0.5}
                  y2={center}
                  stroke={arrow.color}
                  strokeWidth={strokeWidth + 3}
                  strokeLinecap="round"
                  opacity={isDark ? 0.35 : 0.15}
                />

                {/* Main Shaft Line */}
                <line
                  x1={center - arrowLength / 2}
                  y1={center}
                  x2={center + arrowLength / 2 - headSize * 0.5}
                  y2={center}
                  stroke={glyphColor}
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
                  stroke={glyphColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ) : (
              /* Sleek body connector node */
              <circle
                cx={center}
                cy={center}
                r={tileSize * 0.14}
                fill={arrow.color}
                opacity={0.8}
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
