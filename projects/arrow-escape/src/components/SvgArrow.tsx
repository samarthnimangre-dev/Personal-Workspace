// Pure Vector Arrow & Multi-Cell Serpentine Component matching Arrows - Puzzle Escape and Amaze GO!
import React from 'react';
import type { ArrowModel } from '../engine/ArrowModel';
import type { BoardModel } from '../engine/BoardModel';
import type { GameTheme } from '../engine/types';
import { getDirectionDelta, stepPosition } from '../engine/Direction';

interface SvgArrowProps {
  arrow: ArrowModel;
  cellSize: number;
  boardRows: number;
  boardCols: number;
  theme: GameTheme;
  onTap: (arrowId: string) => void;
  board?: BoardModel;
}

export const SvgArrow: React.FC<SvgArrowProps> = React.memo(({
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
  const isDark = theme === 'dark';
  const isEyeComfort = theme === 'eye-comfort';
  const isMinimalWhite = theme === 'minimal-white' || theme === 'light';

  const isBlocked = arrow.isBlocked;
  const isEscaping = arrow.isEscaping;
  const isHinted = arrow.isHinted;

  const isIce = arrow.isFrozen;
  const isBomb = arrow.isBomb;
  const isPivot = arrow.isPivot;

  // Arrow line sizing
  const arrowLength = cellSize * 0.58;
  const headSize = cellSize * 0.24;
  const strokeWidth = Math.max(8.5, cellSize * 0.135);
  const laserCoreWidth = Math.max(2.8, strokeWidth * 0.36);

  const delta = getDirectionDelta(arrow.direction);

  // Directional recoil nudge on collision (computed only when blocked)
  const nudgeX = isBlocked ? delta.dCol * 9 : 0;
  const nudgeY = isBlocked ? delta.dRow * 9 : 0;

  // Calculate escape flight trajectory only during active escape animation
  let escapeMidX = 0;
  let escapeMidY = 0;
  let escapeX = 0;
  let escapeY = 0;

  if (isEscaping) {
    const escapeTravel = (Math.max(boardRows, boardCols) + 2) * cellSize;
    escapeMidX = delta.dCol * escapeTravel * 0.35;
    escapeMidY = delta.dRow * escapeTravel * 0.35;
    escapeX = delta.dCol * escapeTravel;
    escapeY = delta.dRow * escapeTravel;

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
  }

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!arrow.isIdle) return;
    onTap(arrow.id);
  };

  // ── Spine Color Mapping ───────────────────────────────────────────────────
  let spineColor: string;
  if (isBlocked) {
    spineColor = '#ef4444'; // Warning red on blocked
  } else if (isHinted) {
    spineColor = isMinimalWhite ? '#0284c7' : '#38bdf8'; // Bright sky-blue / cyan on hint
  } else if (isIce) {
    spineColor = '#38bdf8';
  } else if (isBomb) {
    spineColor = '#f43f5e';
  } else if (isPivot) {
    spineColor = '#f59e0b';
  } else if (isMinimalWhite) {
    spineColor = '#0f172a'; // Midnight charcoal/navy
  } else if (isEyeComfort) {
    spineColor = '#4a3525'; // Rich espresso/coffee mocha
  } else {
    // Cyber Dark mode
    spineColor = arrow.color || '#06b6d4';
  }

  const isSerpent = arrow.occupiedCells.length > 1;

  // Continuous spine coordinates along serpentine body (only computed for multi-cell arrows)
  let spinePoints = '';
  if (isSerpent) {
    const isHeadFirst =
      arrow.occupiedCells[0].row === arrow.head.row &&
      arrow.occupiedCells[0].col === arrow.head.col;
    const orderedCells = isHeadFirst ? arrow.occupiedCells : [...arrow.occupiedCells].reverse();
    spinePoints = orderedCells
      .map((c) => `${c.col * cellSize + center},${c.row * cellSize + center}`)
      .join(' ');
  }

  // Drop shadow color for floating depth
  const shadowColor = isDark
    ? 'rgba(0, 0, 0, 0.70)'
    : isEyeComfort
    ? 'rgba(74, 53, 37, 0.15)'
    : 'rgba(15, 23, 42, 0.12)';

  return (
    <g
      className={`svg-arrow-group ${isBlocked ? 'arrow-blocked-recoil' : ''} ${
        isEscaping ? 'arrow-escaping-fly' : ''
      } ${isHinted ? 'arrow-hinted-pulse' : ''}`}
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
        <g key="serpent-body-spine">
          {/* 2A: Soft Floating Drop Shadow */}
          <polyline
            points={spinePoints}
            fill="none"
            stroke={shadowColor}
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'blur(2.5px)' }}
          />

          {/* 2B: Full-Spine Continuous Body Line */}
          <polyline
            points={spinePoints}
            fill="none"
            stroke={spineColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              isBlocked
                ? { filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.85))' }
                : isHinted
                ? { filter: `drop-shadow(0 0 10px ${spineColor})` }
                : isDark
                ? { filter: `drop-shadow(0 0 6px ${spineColor}99)` }
                : undefined
            }
          />

          {/* 2C: Cyber Dark White-Hot Laser Core */}
          {isDark && (
            <polyline
              points={spinePoints}
              fill="none"
              stroke={isBlocked ? '#fecaca' : isHinted ? '#e0f2fe' : '#ffffff'}
              strokeWidth={laserCoreWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>
      )}

      {/* ===================================================================
          LAYER 3: ARROWHEAD & STEM TERMINAL
          =================================================================== */}
      <g
        transform={`translate(${arrow.head.col * cellSize}, ${arrow.head.row * cellSize})`}
      >
        <g
          transform={`rotate(${arrow.angle}, ${center}, ${center})`}
          style={
            isBlocked
              ? { filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.95))' }
              : isHinted
              ? { filter: `drop-shadow(0 0 10px ${spineColor})` }
              : isDark
              ? { filter: `drop-shadow(0 0 8px ${spineColor}99)` }
              : undefined
          }
        >
          {/* Shadow for Arrow stem & head (both single-cell and serpents) */}
          <line
            x1={isSerpent ? center : center - arrowLength / 2}
            y1={center}
            x2={center + arrowLength / 2}
            y2={center}
            stroke={shadowColor}
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            style={{ filter: 'blur(2.5px)' }}
          />
          <polyline
            points={`
              ${center + arrowLength / 2 - headSize},${center - headSize * 0.85}
              ${center + arrowLength / 2},${center}
              ${center + arrowLength / 2 - headSize},${center + headSize * 0.85}
            `}
            fill="none"
            stroke={shadowColor}
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'blur(2.5px)' }}
          />

          {/* Stem Line: Runs from center (for serpents) or back of cell (for single arrows) to tip */}
          <line
            x1={isSerpent ? center : center - arrowLength / 2}
            y1={center}
            x2={center + arrowLength / 2}
            y2={center}
            stroke={spineColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Aerodynamic Chevron Arrowhead */}
          <polyline
            points={`
              ${center + arrowLength / 2 - headSize},${center - headSize * 0.85}
              ${center + arrowLength / 2},${center}
              ${center + arrowLength / 2 - headSize},${center + headSize * 0.85}
            `}
            fill="none"
            stroke={spineColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Cyber Dark White-Hot Laser Core on Head & Stem */}
          {isDark && (
            <>
              <line
                x1={isSerpent ? center : center - arrowLength / 2 + 1}
                y1={center}
                x2={center + arrowLength / 2 - 1}
                y2={center}
                stroke={isBlocked ? '#fecaca' : isHinted ? '#e0f2fe' : '#ffffff'}
                strokeWidth={laserCoreWidth}
                strokeLinecap="round"
              />
              <polyline
                points={`
                  ${center + arrowLength / 2 - headSize * 0.95},${center - headSize * 0.80}
                  ${center + arrowLength / 2 - 1},${center}
                  ${center + arrowLength / 2 - headSize * 0.95},${center + headSize * 0.80}
                `}
                fill="none"
                stroke={isBlocked ? '#fecaca' : isHinted ? '#e0f2fe' : '#ffffff'}
                strokeWidth={laserCoreWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </g>
      </g>

      {/* ===================================================================
          LAYER 4: SPECIAL ARCHETYPE OVERLAYS (Ice, Pivot, Bomb)
          =================================================================== */}
      {/* 4A: Ice Frost Facets on Frozen Arrows */}
      {isIce &&
        arrow.occupiedCells.map((cell) => {
          const cx = cell.col * cellSize + center;
          const cy = cell.row * cellSize + center;
          const isHeadCell = cell.row === arrow.head.row && cell.col === arrow.head.col;
          return (
            <g key={`ice-${cell.row}-${cell.col}`} pointerEvents="none">
              <polygon
                points={`${cx},${cy - cellSize * 0.30} ${cx + cellSize * 0.30},${cy} ${cx},${cy + cellSize * 0.30} ${cx - cellSize * 0.30},${cy}`}
                fill="rgba(224, 242, 254, 0.22)"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth={1.5}
                filter="drop-shadow(0 0 6px #38bdf8)"
              />
              <polyline
                points={`${cx - cellSize * 0.16},${cy - cellSize * 0.1} ${cx},${cy} ${cx + cellSize * 0.16},${cy + cellSize * 0.1}`}
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

      {/* 4B: Pivot Rotator Compass Indicator */}
      {isPivot && (
        <g
          pointerEvents="none"
          transform={`translate(${arrow.head.col * cellSize + center}, ${arrow.head.row * cellSize + center})`}
        >
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
          <circle cx={0} cy={-cellSize * 0.28} r={5.5} fill="#f59e0b" />
          <path
            d="M -3 -1 A 3.5 3.5 0 1 1 3 1"
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.2}
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
          <circle cx={0} cy={0} r={cellSize * 0.13} fill="#f43f5e" />
          <circle cx={0} cy={0} r={cellSize * 0.06} fill="#fef08a" />
        </g>
      )}
    </g>
  );
});

SvgArrow.displayName = 'SvgArrow';
