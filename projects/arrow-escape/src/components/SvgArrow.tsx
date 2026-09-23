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
  onTap: (arrowId: string) => void;
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

  const padding = cellSize * 0.085;
  const tileSize = cellSize - padding * 2;
  const radius = Math.max(8, tileSize * 0.22);
  const center = cellSize / 2;

  // Arrowhead and laser core metrics
  const arrowLength = tileSize * 0.54;
  const headSize = tileSize * 0.24;
  const outerStrokeWidth = Math.max(4.0, tileSize * 0.11);
  const laserCoreWidth = Math.max(1.8, outerStrokeWidth * 0.42);

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
  const isDark = theme === 'dark';

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!arrow.isIdle) return;
    onTap(arrow.id);
  };

  // Color schemes based on state and theme
  const accentColor = arrow.color || '#06b6d4';
  const tileFill = isBlocked
    ? isDark ? '#450a0a' : '#fee2e2'
    : isDark ? 'url(#tileMetallicDark)' : 'url(#tileMetallicLight)';

  const tileStroke = isBlocked
    ? '#f43f5e'
    : isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)';

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
      {/* 1. Seamless Dark-Acrylic Body Bridges for Multi-Segment Arrows */}
      {arrow.occupiedCells.length > 1 &&
        arrow.occupiedCells.map((cellA, idx) => {
          const cellB = arrow.occupiedCells[idx + 1];
          if (!cellB) return null;

          const isHorizontal = cellA.row === cellB.row;
          const isVertical = cellA.col === cellB.col;
          if (!isHorizontal && !isVertical) return null;

          const ax = cellA.col * cellSize + center;
          const ay = cellA.row * cellSize + center;
          const bx = cellB.col * cellSize + center;
          const by = cellB.row * cellSize + center;

          if (isHorizontal) {
            const minCol = Math.min(cellA.col, cellB.col);
            const bridgeX = minCol * cellSize + center;
            const bridgeY = cellA.row * cellSize + padding;
            const bridgeW = cellSize;
            const bridgeH = tileSize;

            return (
              <g key={`bridge-${cellA.row},${cellA.col}-${cellB.row},${cellB.col}`}>
                {/* Seamless Bridge 3D Drop Shadow */}
                <rect
                  x={bridgeX}
                  y={bridgeY + 3}
                  width={bridgeW}
                  height={bridgeH}
                  fill={isDark ? 'rgba(0, 0, 0, 0.60)' : 'rgba(15, 23, 42, 0.14)'}
                />
                {/* Seamless Dark-Acrylic Bridge Body */}
                <rect
                  x={bridgeX}
                  y={bridgeY}
                  width={bridgeW}
                  height={bridgeH}
                  fill={tileFill}
                />
                {/* Seamless Specular Top Gloss Continuation */}
                <rect
                  x={bridgeX}
                  y={bridgeY + 2}
                  width={bridgeW}
                  height={tileSize * 0.35}
                  fill="url(#specularGloss)"
                  pointerEvents="none"
                />
                {/* Seamless Top & Bottom Acrylic Edge Borders */}
                <line
                  x1={bridgeX}
                  y1={bridgeY}
                  x2={bridgeX + bridgeW}
                  y2={bridgeY}
                  stroke={tileStroke}
                  strokeWidth={isBlocked ? 2.5 : 1.2}
                />
                <line
                  x1={bridgeX}
                  y1={bridgeY + bridgeH}
                  x2={bridgeX + bridgeW}
                  y2={bridgeY + bridgeH}
                  stroke={tileStroke}
                  strokeWidth={isBlocked ? 2.5 : 1.2}
                />
                {/* Two-Pass White-Hot Laser Conduit Spine */}
                <line
                  x1={ax}
                  y1={ay}
                  x2={bx}
                  y2={by}
                  stroke={isBlocked ? '#f43f5e' : accentColor}
                  strokeWidth={outerStrokeWidth}
                  strokeLinecap="round"
                  style={{
                    filter: isBlocked
                      ? 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.9))'
                      : `drop-shadow(0 0 6px ${accentColor})`,
                  }}
                />
                <line
                  x1={ax}
                  y1={ay}
                  x2={bx}
                  y2={by}
                  stroke="#ffffff"
                  strokeWidth={laserCoreWidth}
                  strokeLinecap="round"
                />
              </g>
            );
          } else {
            // Vertical bridge
            const minRow = Math.min(cellA.row, cellB.row);
            const bridgeX = cellA.col * cellSize + padding;
            const bridgeY = minRow * cellSize + center;
            const bridgeW = tileSize;
            const bridgeH = cellSize;

            return (
              <g key={`bridge-${cellA.row},${cellA.col}-${cellB.row},${cellB.col}`}>
                {/* Seamless Bridge 3D Drop Shadow */}
                <rect
                  x={bridgeX}
                  y={bridgeY + 3}
                  width={bridgeW}
                  height={bridgeH}
                  fill={isDark ? 'rgba(0, 0, 0, 0.60)' : 'rgba(15, 23, 42, 0.14)'}
                />
                {/* Seamless Dark-Acrylic Bridge Body */}
                <rect
                  x={bridgeX}
                  y={bridgeY}
                  width={bridgeW}
                  height={bridgeH}
                  fill={tileFill}
                />
                {/* Seamless Left & Right Acrylic Edge Borders */}
                <line
                  x1={bridgeX}
                  y1={bridgeY}
                  x2={bridgeX}
                  y2={bridgeY + bridgeH}
                  stroke={tileStroke}
                  strokeWidth={isBlocked ? 2.5 : 1.2}
                />
                <line
                  x1={bridgeX + bridgeW}
                  y1={bridgeY}
                  x2={bridgeX + bridgeW}
                  y2={bridgeY + bridgeH}
                  stroke={tileStroke}
                  strokeWidth={isBlocked ? 2.5 : 1.2}
                />
                {/* Two-Pass White-Hot Laser Conduit Spine */}
                <line
                  x1={ax}
                  y1={ay}
                  x2={bx}
                  y2={by}
                  stroke={isBlocked ? '#f43f5e' : accentColor}
                  strokeWidth={outerStrokeWidth}
                  strokeLinecap="round"
                  style={{
                    filter: isBlocked
                      ? 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.9))'
                      : `drop-shadow(0 0 6px ${accentColor})`,
                  }}
                />
                <line
                  x1={ax}
                  y1={ay}
                  x2={bx}
                  y2={by}
                  stroke="#ffffff"
                  strokeWidth={laserCoreWidth}
                  strokeLinecap="round"
                />
              </g>
            );
          }
        })}

      {/* 2. Cell Tiles: Head and Body Segments */}
      {arrow.occupiedCells.map((cell) => {
        const isHead = cell.row === arrow.head.row && cell.col === arrow.head.col;
        const cellX = cell.col * cellSize;
        const cellY = cell.row * cellSize;

        return (
          <g key={`cell-${cell.row}-${cell.col}`} transform={`translate(${cellX}, ${cellY})`}>
            {/* 3D Tile Drop Shadow */}
            <rect
              x={padding}
              y={padding + 3}
              width={tileSize}
              height={tileSize}
              rx={radius}
              ry={radius}
              fill={isDark ? 'rgba(0, 0, 0, 0.60)' : 'rgba(15, 23, 42, 0.14)'}
            />

            {/* Tactile Metallic Tile Body */}
            <rect
              x={padding}
              y={padding}
              width={tileSize}
              height={tileSize}
              rx={radius}
              ry={radius}
              fill={tileFill}
              stroke={tileStroke}
              strokeWidth={isBlocked ? 2.5 : 1.2}
              filter={
                isBlocked
                  ? 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.75))'
                  : undefined
              }
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

            {/* Head Glyph: Dual-Pass White-Hot Laser Core | Tail Node: Glowing Conduit Node */}
            {isHead ? (
              <g
                transform={`rotate(${arrow.angle}, ${center}, ${center})`}
                style={{
                  filter: isBlocked
                    ? 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.95))'
                    : `drop-shadow(0 0 5px ${accentColor}) drop-shadow(0 0 12px ${accentColor}90)`,
                }}
              >
                {/* --- PASS 1: Outer Neon Aura (Stem & Chevron) --- */}
                <line
                  x1={center - arrowLength / 2}
                  y1={center}
                  x2={center + arrowLength / 2 - headSize * 0.55}
                  y2={center}
                  stroke={isBlocked ? '#f43f5e' : accentColor}
                  strokeWidth={outerStrokeWidth}
                  strokeLinecap="round"
                />
                <polyline
                  points={`
                    ${center + arrowLength / 2 - headSize},${center - headSize * 0.85}
                    ${center + arrowLength / 2},${center}
                    ${center + arrowLength / 2 - headSize},${center + headSize * 0.85}
                  `}
                  fill="none"
                  stroke={isBlocked ? '#f43f5e' : accentColor}
                  strokeWidth={outerStrokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* --- PASS 2: Pure White-Hot Laser Core (Stem & Chevron) --- */}
                <line
                  x1={center - arrowLength / 2 + 1}
                  y1={center}
                  x2={center + arrowLength / 2 - headSize * 0.55}
                  y2={center}
                  stroke="#ffffff"
                  strokeWidth={laserCoreWidth}
                  strokeLinecap="round"
                />
                <polyline
                  points={`
                    ${center + arrowLength / 2 - headSize * 0.95},${center - headSize * 0.82}
                    ${center + arrowLength / 2 - 1},${center}
                    ${center + arrowLength / 2 - headSize * 0.95},${center + headSize * 0.82}
                  `}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={laserCoreWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ) : (
              /* Sleek Tail Node Conduit with Two-Pass White-Hot Core */
              <g
                style={{
                  filter: isBlocked
                    ? 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.9))'
                    : `drop-shadow(0 0 5px ${accentColor}) drop-shadow(0 0 10px ${accentColor}80)`,
                }}
              >
                {/* Pass 1: Outer Neon Aura Node */}
                <circle
                  cx={center}
                  cy={center}
                  r={tileSize * 0.17}
                  fill={isBlocked ? '#f43f5e' : accentColor}
                />
                {/* Pass 2: White-Hot Laser Core Dot */}
                <circle
                  cx={center}
                  cy={center}
                  r={tileSize * 0.085}
                  fill="#ffffff"
                />
              </g>
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
