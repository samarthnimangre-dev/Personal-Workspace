import type { ArrowModel } from '../engine/ArrowModel';
import type { Position } from '../engine/types';
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

  let tileFill = isBlocked
    ? isDark ? '#450a0a' : '#fee2e2'
    : isDark ? 'url(#tileMetallicDark)' : 'url(#tileMetallicLight)';

  if (!isBlocked) {
    if (isIce) {
      tileFill = isDark ? 'url(#tileIceDark)' : 'url(#tileIceLight)';
    } else if (isBomb) {
      tileFill = isDark ? 'url(#tileBombDark)' : '#ffe4e6';
    } else if (isPivot) {
      tileFill = isDark ? 'url(#tilePivotDark)' : '#fef3c7';
    }
  }

  let tileStroke = isBlocked
    ? '#f43f5e'
    : isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)';

  if (isIce) tileStroke = '#38bdf8';
  else if (isBomb) tileStroke = '#f43f5e';
  else if (isPivot) tileStroke = '#f59e0b';
  else if (isHinted) tileStroke = '#fbbf24';

  // Find all adjacent pairs of cells in multi-segment arrows for seamless bridging
  const adjacentPairs: { key: string; cellA: Position; cellB: Position; isHorizontal: boolean }[] = [];
  if (arrow.occupiedCells.length > 1) {
    for (let i = 0; i < arrow.occupiedCells.length; i++) {
      for (let j = i + 1; j < arrow.occupiedCells.length; j++) {
        const cA = arrow.occupiedCells[i];
        const cB = arrow.occupiedCells[j];
        const dR = Math.abs(cA.row - cB.row);
        const dC = Math.abs(cA.col - cB.col);
        if (dR + dC === 1) {
          adjacentPairs.push({
            key: `pair-${cA.row},${cA.col}-${cB.row},${cB.col}`,
            cellA: cA,
            cellB: cB,
            isHorizontal: cA.row === cB.row,
          });
        }
      }
    }
  }

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
          LAYER 1: 3D DROP SHADOWS (Seamlessly fused cells & bridges)
          =================================================================== */}
      {/* Cell Tile Shadows */}
      {arrow.occupiedCells.map((cell) => (
        <rect
          key={`shadow-${cell.row}-${cell.col}`}
          x={cell.col * cellSize + padding}
          y={cell.row * cellSize + padding + 3}
          width={tileSize}
          height={tileSize}
          rx={radius}
          ry={radius}
          fill={isDark ? 'rgba(0, 0, 0, 0.60)' : 'rgba(15, 23, 42, 0.14)'}
        />
      ))}

      {/* Seamless Bridge Shadows */}
      {adjacentPairs.map(({ key, cellA, cellB, isHorizontal }) => {
        if (isHorizontal) {
          const minCol = Math.min(cellA.col, cellB.col);
          return (
            <rect
              key={`bridge-shadow-${key}`}
              x={minCol * cellSize + center}
              y={cellA.row * cellSize + padding + 3}
              width={cellSize}
              height={tileSize}
              fill={isDark ? 'rgba(0, 0, 0, 0.60)' : 'rgba(15, 23, 42, 0.14)'}
            />
          );
        } else {
          const minRow = Math.min(cellA.row, cellB.row);
          return (
            <rect
              key={`bridge-shadow-${key}`}
              x={cellA.col * cellSize + padding}
              y={minRow * cellSize + center + 3}
              width={tileSize}
              height={cellSize}
              fill={isDark ? 'rgba(0, 0, 0, 0.60)' : 'rgba(15, 23, 42, 0.14)'}
            />
          );
        }
      })}

      {/* ===================================================================
          LAYER 2: SEAMLESS DARK-ACRYLIC TILE BODIES
          =================================================================== */}
      {/* Individual Cell Bodies */}
      {arrow.occupiedCells.map((cell) => (
        <rect
          key={`body-${cell.row}-${cell.col}`}
          x={cell.col * cellSize + padding}
          y={cell.row * cellSize + padding}
          width={tileSize}
          height={tileSize}
          rx={radius}
          ry={radius}
          fill={tileFill}
        />
      ))}

      {/* Seamless Acrylic Bridges (Seamlessly welds adjacent cells together into monolithic body) */}
      {adjacentPairs.map(({ key, cellA, cellB, isHorizontal }) => {
        if (isHorizontal) {
          const minCol = Math.min(cellA.col, cellB.col);
          return (
            <rect
              key={`bridge-body-${key}`}
              x={minCol * cellSize + center}
              y={cellA.row * cellSize + padding}
              width={cellSize}
              height={tileSize}
              fill={tileFill}
            />
          );
        } else {
          const minRow = Math.min(cellA.row, cellB.row);
          return (
            <rect
              key={`bridge-body-${key}`}
              x={cellA.col * cellSize + padding}
              y={minRow * cellSize + center}
              width={tileSize}
              height={cellSize}
              fill={tileFill}
            />
          );
        }
      })}

      {/* ===================================================================
          LAYER 3: SEAMLESS SPECULAR TOP GLOSS HIGHLIGHTS
          =================================================================== */}
      {/* Cell Top Gloss Highlights */}
      {arrow.occupiedCells.map((cell) => (
        <rect
          key={`gloss-${cell.row}-${cell.col}`}
          x={cell.col * cellSize + padding + 2}
          y={cell.row * cellSize + padding + 2}
          width={tileSize - 4}
          height={tileSize * 0.35}
          rx={radius - 2}
          ry={radius - 2}
          fill="url(#specularGloss)"
          pointerEvents="none"
        />
      ))}

      {/* Seamless Horizontal Bridge Top Gloss Continuation */}
      {adjacentPairs
        .filter((p) => p.isHorizontal)
        .map(({ key, cellA, cellB }) => {
          const minCol = Math.min(cellA.col, cellB.col);
          return (
            <rect
              key={`bridge-gloss-${key}`}
              x={minCol * cellSize + center}
              y={cellA.row * cellSize + padding + 2}
              width={cellSize}
              height={tileSize * 0.35}
              fill="url(#specularGloss)"
              pointerEvents="none"
            />
          );
        })}

      {/* ===================================================================
          LAYER 4: SEAMLESS PERIMETER ACRYLIC EDGES & BORDERS
          =================================================================== */}
      {/* Outer Border for Cells */}
      {arrow.occupiedCells.map((cell) => (
        <rect
          key={`border-${cell.row}-${cell.col}`}
          x={cell.col * cellSize + padding}
          y={cell.row * cellSize + padding}
          width={tileSize}
          height={tileSize}
          rx={radius}
          ry={radius}
          fill="none"
          stroke={tileStroke}
          strokeWidth={isBlocked ? 2.5 : 1.2}
          filter={
            isBlocked
              ? 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.75))'
              : undefined
          }
        />
      ))}

      {/* Seamless Outer Boundary Lines for Bridges (covers internal borders) */}
      {adjacentPairs.map(({ key, cellA, cellB, isHorizontal }) => {
        if (isHorizontal) {
          const minCol = Math.min(cellA.col, cellB.col);
          const x1 = minCol * cellSize + center;
          const x2 = x1 + cellSize;
          const yTop = cellA.row * cellSize + padding;
          const yBottom = yTop + tileSize;

          return (
            <g key={`bridge-edges-${key}`}>
              {/* Internal seam cover rect (ensures no corner curves show inside) */}
              <rect
                x={x1 - 1}
                y={yTop + 1}
                width={cellSize + 2}
                height={tileSize - 2}
                fill={tileFill}
              />
              {/* Top border line */}
              <line
                x1={x1}
                y1={yTop}
                x2={x2}
                y2={yTop}
                stroke={tileStroke}
                strokeWidth={isBlocked ? 2.5 : 1.2}
              />
              {/* Bottom border line */}
              <line
                x1={x1}
                y1={yBottom}
                x2={x2}
                y2={yBottom}
                stroke={tileStroke}
                strokeWidth={isBlocked ? 2.5 : 1.2}
              />
            </g>
          );
        } else {
          const minRow = Math.min(cellA.row, cellB.row);
          const y1 = minRow * cellSize + center;
          const y2 = y1 + cellSize;
          const xLeft = cellA.col * cellSize + padding;
          const xRight = xLeft + tileSize;

          return (
            <g key={`bridge-edges-${key}`}>
              {/* Internal seam cover rect */}
              <rect
                x={xLeft + 1}
                y={y1 - 1}
                width={tileSize - 2}
                height={cellSize + 2}
                fill={tileFill}
              />
              {/* Left border line */}
              <line
                x1={xLeft}
                y1={y1}
                x2={xLeft}
                y2={y2}
                stroke={tileStroke}
                strokeWidth={isBlocked ? 2.5 : 1.2}
              />
              {/* Right border line */}
              <line
                x1={xRight}
                y1={y1}
                x2={xRight}
                y2={y2}
                stroke={tileStroke}
                strokeWidth={isBlocked ? 2.5 : 1.2}
              />
            </g>
          );
        }
      })}

      {/* ===================================================================
          LAYER 5: TWO-PASS "WHITE-HOT LASER CORE" CONDUITS & GLYPHS
          =================================================================== */}
      {/* 5A: Multi-Segment Laser Conduit Spine Lines */}
      {adjacentPairs.map(({ key, cellA, cellB }) => {
        const ax = cellA.col * cellSize + center;
        const ay = cellA.row * cellSize + center;
        const bx = cellB.col * cellSize + center;
        const by = cellB.row * cellSize + center;

        return (
          <g key={`conduit-${key}`}>
            {/* Pass 1: Outer Saturated Neon Conduit */}
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
                  : `drop-shadow(0 0 6px ${accentColor}) drop-shadow(0 0 10px ${accentColor}80)`,
              }}
            />
            {/* Pass 2: White-Hot Laser Core Centerline */}
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
      })}

      {/* 5B: Cell Glyphs (Head Chevron & Body Conduit Nodes) */}
      {arrow.occupiedCells.map((cell) => {
        const isHead = cell.row === arrow.head.row && cell.col === arrow.head.col;
        const cellX = cell.col * cellSize;
        const cellY = cell.row * cellSize;

        return (
          <g key={`glyph-${cell.row}-${cell.col}`} transform={`translate(${cellX}, ${cellY})`}>
            {isHead ? (
              /* Head Arrow Glyph: Two-Pass White-Hot Laser Core */
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
              /* Non-Head Tail/Body Node: Two-Pass White-Hot Laser Node */
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

            {/* =======================================================
                LAYER 6: SPECIAL ARCHETYPE OVERLAYS (Ice, Pivot, Bomb, Hint)
                ======================================================= */}
            {isIce && (
              <g pointerEvents="none">
                {/* Frosted Glass Diamond Facet */}
                <polygon
                  points={`${center},${center - tileSize * 0.36} ${center + tileSize * 0.36},${center} ${center},${center + tileSize * 0.36} ${center - tileSize * 0.36},${center}`}
                  fill="rgba(224, 242, 254, 0.25)"
                  stroke="rgba(255, 255, 255, 0.75)"
                  strokeWidth={1.5}
                />
                {/* Ice Fracture Lines */}
                <polyline
                  points={`${center - tileSize * 0.22},${center - tileSize * 0.12} ${center},${center} ${center + tileSize * 0.22},${center + tileSize * 0.12}`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.9)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
                {arrow.frozenHits > 1 && (
                  <text
                    x={center + tileSize * 0.22}
                    y={center + tileSize * 0.34}
                    fill="#38bdf8"
                    fontSize={11}
                    fontWeight="900"
                    filter="drop-shadow(0 0 3px #000)"
                  >
                    {arrow.frozenHits}
                  </text>
                )}
              </g>
            )}

            {isPivot && isHead && (
              <g pointerEvents="none" transform={`translate(${center}, ${center - tileSize * 0.24})`}>
                <circle cx={0} cy={0} r={7} fill="rgba(245, 158, 11, 0.9)" />
                <path
                  d="M -3.5 -1 A 4.5 4.5 0 1 1 3.5 1"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                />
              </g>
            )}

            {isBomb && (
              <g pointerEvents="none">
                <circle cx={center} cy={center} r={tileSize * 0.16} fill="#f43f5e" />
                <circle cx={center} cy={center} r={tileSize * 0.08} fill="#fef08a" />
              </g>
            )}

            {isHinted && isHead && (
              <circle
                cx={center}
                cy={center}
                r={tileSize * 0.44}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={2.5}
                opacity={0.8}
                filter="drop-shadow(0 0 8px #fbbf24)"
                pointerEvents="none"
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
