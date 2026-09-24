// Box-Free Pure Vector Arrow & Serpentine Snake component with two-pass White-Hot Laser Core
import React from 'react';
import type { ArrowModel } from '../engine/ArrowModel';
import type { BoardModel } from '../engine/BoardModel';
import { getDirectionDelta, stepPosition } from '../engine/Direction';

interface SvgArrowProps {
  arrow: ArrowModel;
  cellSize: number;
  boardRows: number;
  boardCols: number;
  theme: 'dark' | 'light';
  onTap: (arrowId: string) => void;
  board?: BoardModel;
}

export const SvgArrow: React.FC<SvgArrowProps> = ({
  arrow,
  cellSize,
  boardRows,
  boardCols,
  theme,
  onTap,
  board,
}) => {
  if (arrow.isEscaped) return null;

  const center = cellSize / 2;

  // Single-cell arrow dimensions
  const arrowLength = cellSize * 0.58;
  const headSize = cellSize * 0.26;
  const stemStrokeWidth = Math.max(5.5, cellSize * 0.088);
  const stemLaserCoreWidth = Math.max(2.2, stemStrokeWidth * 0.38);

  // Multi-cell serpentine tube dimensions
  const tubeWidth = Math.max(18, cellSize * 0.28);
  const tubeStrokeWidth = Math.max(6.0, tubeWidth * 0.36);
  const tubeCoreWidth = Math.max(2.4, tubeStrokeWidth * 0.38);

  const delta = getDirectionDelta(arrow.direction);

  // Calculate escape distance off the board bounds
  const escapeTravel = (Math.max(boardRows, boardCols) + 2) * cellSize;
  let escapeMidX = delta.dCol * escapeTravel * 0.35;
  let escapeMidY = delta.dRow * escapeTravel * 0.35;
  let escapeX = delta.dCol * escapeTravel;
  let escapeY = delta.dRow * escapeTravel;

  if (board) {
    let scan = stepPosition(arrow.head, arrow.direction);
    while (board.isWithinBounds(scan)) {
      const defl = board.getDeflectorAt(scan.row, scan.col);
      if (defl) {
        const midX = (defl.col - arrow.head.col) * cellSize;
        const midY = (defl.row - arrow.head.row) * cellSize;
        const redirDelta = getDirectionDelta(defl.redirectDirection);
        escapeMidX = midX;
        escapeMidY = midY;
        escapeX = midX + redirDelta.dCol * escapeTravel;
        escapeY = midY + redirDelta.dRow * escapeTravel;
        break;
      }
      scan = stepPosition(scan, arrow.direction);
    }
  }

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

  // Color schemes based on archetype and theme
  const isIce = arrow.isFrozen;
  const isBomb = arrow.isBomb;
  const isPivot = arrow.isPivot;
  const isHinted = arrow.isHinted;

  let accentColor = arrow.color || '#06b6d4';
  if (isIce) accentColor = '#38bdf8';
  else if (isBomb) accentColor = '#f43f5e';
  else if (isPivot) accentColor = '#f59e0b';
  else if (isHinted) accentColor = '#fbbf24';

  const tubeBodyBg = isBlocked
    ? '#450a0a'
    : isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';

  // Continuous spine coordinates along serpentine body
  const spinePoints = arrow.occupiedCells
    .map((c) => `${c.col * cellSize + center},${c.row * cellSize + center}`)
    .join(' ');

  const isSerpent = arrow.occupiedCells.length > 1;

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
          '--escape-mid-x': `${escapeMidX}px`,
          '--escape-mid-y': `${escapeMidY}px`,
          '--escape-x': `${escapeX}px`,
          '--escape-y': `${escapeY}px`,
        } as React.CSSProperties
      }
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Arrow pointing ${arrow.direction} at row ${arrow.row + 1}, column ${arrow.col + 1}`}
    >
      {/* ===================================================================
          LAYER 1: FULL-CELL INVISIBLE TOUCH TARGETS (Generous mobile hitboxes)
          =================================================================== */}
      {arrow.occupiedCells.map((cell) => (
        <rect
          key={`touch-${cell.row}-${cell.col}`}
          x={cell.col * cellSize}
          y={cell.row * cellSize}
          width={cellSize}
          height={cellSize}
          fill="transparent"
          pointerEvents="all"
          style={{ cursor: arrow.isIdle ? 'pointer' : 'default' }}
        />
      ))}

      {/* ===================================================================
          LAYER 2: MULTI-CELL SERPENTINE SNAKE BODY (No blocks, continuous pipe)
          =================================================================== */}
      {isSerpent && (
        <g key="serpent-body-pipeline">
          {/* 2A: Deep Soft Drop Shadow */}
          <polyline
            points={spinePoints}
            fill="none"
            stroke="rgba(0, 0, 0, 0.65)"
            strokeWidth={tubeWidth + 6}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'blur(3.5px)' }}
          />

          {/* 2B: Tactile Neon Acrylic Tube Outer Glow */}
          <polyline
            points={spinePoints}
            fill="none"
            stroke={isBlocked ? '#f43f5e' : accentColor}
            strokeWidth={tubeWidth + 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isDark ? 0.45 : 0.3}
            style={{ filter: `drop-shadow(0 0 8px ${accentColor}80)` }}
          />

          {/* 2C: Solid Tactile Tube Body */}
          <polyline
            points={spinePoints}
            fill="none"
            stroke={tubeBodyBg}
            strokeWidth={tubeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 2D: Top Specular Gloss Highlight Rib */}
          <polyline
            points={spinePoints}
            fill="none"
            stroke="rgba(255, 255, 255, 0.28)"
            strokeWidth={tubeWidth * 0.36}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />

          {/* 2E: Two-Pass White-Hot Laser Conduit Spine */}
          {/* Pass 1: Outer Neon Conduit */}
          <polyline
            points={spinePoints}
            fill="none"
            stroke={isBlocked ? '#f43f5e' : accentColor}
            strokeWidth={tubeStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: isBlocked
                ? 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.9))'
                : `drop-shadow(0 0 6px ${accentColor}) drop-shadow(0 0 12px ${accentColor}90)`,
            }}
          />
          {/* Pass 2: White-Hot Laser Core Centerline */}
          <polyline
            points={spinePoints}
            fill="none"
            stroke="#ffffff"
            strokeWidth={tubeCoreWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 2F: Intermediate Spine Cyber Nodes (straight & elbow joints) */}
          {arrow.occupiedCells.slice(1).map((cell) => {
            const cx = cell.col * cellSize + center;
            const cy = cell.row * cellSize + center;
            return (
              <g key={`node-${cell.row}-${cell.col}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={tubeWidth * 0.22}
                  fill={isBlocked ? '#f43f5e' : accentColor}
                  style={{ filter: `drop-shadow(0 0 4px ${accentColor})` }}
                />
                <circle cx={cx} cy={cy} r={tubeWidth * 0.11} fill="#ffffff" />
              </g>
            );
          })}
        </g>
      )}

      {/* ===================================================================
          LAYER 3: ARROWHEAD / SINGLE ARROW GLYPH (Two-pass Laser Core)
          =================================================================== */}
      <g
        transform={`translate(${arrow.head.col * cellSize}, ${arrow.head.row * cellSize})`}
      >
        <g
          transform={`rotate(${arrow.angle}, ${center}, ${center})`}
          style={{
            filter: isBlocked
              ? 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.95))'
              : `drop-shadow(0 3px 6px rgba(0, 0, 0, 0.65)) drop-shadow(0 0 8px ${accentColor}90)`,
          }}
        >
          {/* Stem Line: For single-cell arrows, runs full length; for serpents, connects into body */}
          <line
            x1={isSerpent ? center : center - arrowLength / 2}
            y1={center}
            x2={center + arrowLength / 2 - headSize * 0.55}
            y2={center}
            stroke={isBlocked ? '#f43f5e' : accentColor}
            strokeWidth={stemStrokeWidth}
            strokeLinecap="round"
          />
          {/* Stem White-Hot Core */}
          <line
            x1={isSerpent ? center : center - arrowLength / 2 + 1}
            y1={center}
            x2={center + arrowLength / 2 - headSize * 0.55}
            y2={center}
            stroke="#ffffff"
            strokeWidth={stemLaserCoreWidth}
            strokeLinecap="round"
          />

          {/* Aerodynamic Chevron Arrowhead: Pass 1 (Outer Neon Aura) */}
          <polyline
            points={`
              ${center + arrowLength / 2 - headSize},${center - headSize * 0.85}
              ${center + arrowLength / 2},${center}
              ${center + arrowLength / 2 - headSize},${center + headSize * 0.85}
            `}
            fill="none"
            stroke={isBlocked ? '#f43f5e' : accentColor}
            strokeWidth={stemStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Aerodynamic Chevron Arrowhead: Pass 2 (White-Hot Core) */}
          <polyline
            points={`
              ${center + arrowLength / 2 - headSize * 0.95},${center - headSize * 0.82}
              ${center + arrowLength / 2 - 1},${center}
              ${center + arrowLength / 2 - headSize * 0.95},${center + headSize * 0.82}
            `}
            fill="none"
            stroke="#ffffff"
            strokeWidth={stemLaserCoreWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>

      {/* ===================================================================
          LAYER 4: SPECIAL ARCHETYPE OVERLAYS (Ice, Pivot, Bomb, Hint - Zero Boxes)
          =================================================================== */}
      {/* 4A: Ice Frost Facets & Shards on Frozen Arrows */}
      {isIce &&
        arrow.occupiedCells.map((cell) => {
          const cx = cell.col * cellSize + center;
          const cy = cell.row * cellSize + center;
          const isHeadCell = cell.row === arrow.head.row && cell.col === arrow.head.col;
          return (
            <g key={`ice-${cell.row}-${cell.col}`} pointerEvents="none">
              {/* Frosted Glass Diamond Facet */}
              <polygon
                points={`${cx},${cy - cellSize * 0.32} ${cx + cellSize * 0.32},${cy} ${cx},${cy + cellSize * 0.32} ${cx - cellSize * 0.32},${cy}`}
                fill="rgba(224, 242, 254, 0.22)"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth={1.5}
                filter="drop-shadow(0 0 6px #38bdf8)"
              />
              {/* Ice Fracture Lines */}
              <polyline
                points={`${cx - cellSize * 0.18},${cy - cellSize * 0.1} ${cx},${cy} ${cx + cellSize * 0.18},${cy + cellSize * 0.1}`}
                fill="none"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              {isHeadCell && arrow.frozenHits > 1 && (
                <text
                  x={cx + cellSize * 0.20}
                  y={cy + cellSize * 0.30}
                  fill="#38bdf8"
                  fontSize={11}
                  fontWeight="900"
                  filter="drop-shadow(0 0 3px #000)"
                >
                  {arrow.frozenHits}
                </text>
              )}
            </g>
          );
        })}

      {/* 4B: Pivot Rotator Compass Bearing */}
      {isPivot && (
        <g
          pointerEvents="none"
          transform={`translate(${arrow.head.col * cellSize + center}, ${arrow.head.row * cellSize + center})`}
        >
          {/* Outer rotating dashed ring */}
          <circle
            cx={0}
            cy={0}
            r={cellSize * 0.30}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={1.8}
            strokeDasharray="4 3"
            opacity={0.85}
            filter="drop-shadow(0 0 6px #f59e0b)"
          />
          {/* Pivot Axis Indicator */}
          <circle cx={0} cy={-cellSize * 0.28} r={6.5} fill="#f59e0b" />
          <path
            d="M -3 -1 A 4 4 0 1 1 3 1"
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.3}
            strokeLinecap="round"
            transform={`translate(0, ${-cellSize * 0.28})`}
          />
        </g>
      )}

      {/* 4C: Bomb Hazard Indicator */}
      {isBomb && (
        <g
          pointerEvents="none"
          transform={`translate(${arrow.head.col * cellSize + center}, ${arrow.head.row * cellSize + center})`}
        >
          {/* Pulsating Crimson Hazard Ring */}
          <circle
            cx={0}
            cy={0}
            r={cellSize * 0.32}
            fill="rgba(244, 63, 94, 0.15)"
            stroke="#f43f5e"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            filter="drop-shadow(0 0 8px #f43f5e)"
          />
          <circle cx={0} cy={0} r={cellSize * 0.14} fill="#f43f5e" />
          <circle cx={0} cy={0} r={cellSize * 0.07} fill="#fef08a" />
        </g>
      )}

      {/* 4D: Hint Golden Blooming Ring */}
      {isHinted && (
        <circle
          cx={arrow.head.col * cellSize + center}
          cy={arrow.head.row * cellSize + center}
          r={cellSize * 0.38}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={2.5}
          opacity={0.85}
          filter="drop-shadow(0 0 10px #fbbf24)"
          pointerEvents="none"
        />
      )}
    </g>
  );
};
