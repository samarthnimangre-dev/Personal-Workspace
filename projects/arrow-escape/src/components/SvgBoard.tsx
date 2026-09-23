// Scalable, theme-aware SVG Board rendering tactile grid slots and active arrows with particle FX
import React from 'react';
import type { BoardModel } from '../engine/BoardModel';
import type { ArrowModel } from '../engine/ArrowModel';
import { SvgArrow } from './SvgArrow';
import { ParticleOverlay } from './ParticleOverlay';
import { getDirectionAngle } from '../engine/Direction';

interface SvgBoardProps {
  board: BoardModel;
  arrows: readonly ArrowModel[];
  theme: 'dark' | 'light';
  cellSize?: number;
  onArrowTap: (arrowId: string) => void;
  onCancelBooster?: () => void;
}

export const SvgBoard: React.FC<SvgBoardProps> = ({
  board,
  arrows,
  theme,
  cellSize = 72,
  onArrowTap,
  onCancelBooster,
}) => {
  const boardWidth = board.cols * cellSize;
  const boardHeight = board.rows * cellSize;
  const padding = 18;
  const viewBoxWidth = boardWidth + padding * 2;
  const viewBoxHeight = boardHeight + padding * 2;

  const isDark = theme === 'dark';

  // Pre-generate grid background cell slots (filtered by mask shape)
  const gridSlots = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (!board.isInsideCoords(r, c)) continue;
      gridSlots.push({
        key: `${r}-${c}`,
        x: c * cellSize + padding + 4,
        y: r * cellSize + padding + 4,
        size: cellSize - 8,
      });
    }
  }

  const deflectorList = board.deflectors ? Array.from(board.deflectors.values()) : [];

  return (
    <div
      className="relative svg-board-container w-full max-w-[390px] mx-auto aspect-square flex items-center justify-center p-2 select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Particle Canvas Overlay on top of SVG */}
      <ParticleOverlay width={viewBoxWidth} height={viewBoxHeight} />

      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full max-w-full max-h-full drop-shadow-2xl overflow-visible"
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

          {/* Specular gloss highlight gradient */}
          <linearGradient id="specularGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isDark ? 0.22 : 0.45} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>

          {/* Board Plinth Rim Bevel with Vivid Cyber-Cyan Highlight */}
          <linearGradient id="boardRimGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
            <stop offset="25%" stopColor="rgba(6, 182, 212, 0.70)" />
            <stop offset="65%" stopColor="rgba(6, 182, 212, 0.30)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.08)" />
          </linearGradient>

          {/* Board gradient backdrop */}
          <linearGradient id="boardBackdrop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={isDark ? '#0b1329' : '#ffffff'} />
            <stop offset="100%" stopColor={isDark ? '#030712' : '#e2e8f0'} />
          </linearGradient>

          {/* 3-Stop Inset Background Tile Gradient (Dark Obsidian Wells) */}
          <linearGradient id="bgTileMetallicDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#020617" />
            <stop offset="50%" stopColor="#070c1b" />
            <stop offset="100%" stopColor="#0b1329" />
          </linearGradient>

          {/* 3-Stop Inset Background Tile Gradient (Light Mode) */}
          <linearGradient id="bgTileMetallicLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* 3-Stop Metallic Obsidian Tile Surface (Dark Mode) */}
          <linearGradient id="tileMetallicDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="60%" stopColor="#0b0f19" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>

          {/* Clean Ceramic Tile Surface (Light Mode) */}
          <linearGradient id="tileMetallicLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#edf2f7" />
          </linearGradient>

          {/* Ice Frost Tile Gradient (Dark Mode) */}
          <linearGradient id="tileIceDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#075985" />
            <stop offset="50%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#082f49" />
          </linearGradient>

          {/* Ice Frost Tile Gradient (Light Mode) */}
          <linearGradient id="tileIceLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0f9ff" />
            <stop offset="50%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>

          {/* Bomb Hazard Tile Gradient */}
          <linearGradient id="tileBombDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4c0519" />
            <stop offset="50%" stopColor="#881337" />
            <stop offset="100%" stopColor="#1f0208" />
          </linearGradient>

          {/* Pivot Rotator Tile Gradient */}
          <linearGradient id="tilePivotDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="50%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#1c0a02" />
          </linearGradient>
        </defs>

        {/* Outer Cyan Rim Bloom Layer (Dark Mode) */}
        {isDark && (
          <rect
            x={padding - 6}
            y={padding - 6}
            width={boardWidth + 12}
            height={boardHeight + 12}
            rx={24}
            ry={24}
            fill="none"
            stroke="rgba(6, 182, 212, 0.45)"
            strokeWidth={3}
            filter="url(#cyanBevelBloom)"
            opacity={0.8}
          />
        )}

        {/* Outer Board Slab Background */}
        <rect
          x={padding - 6}
          y={padding - 6}
          width={boardWidth + 12}
          height={boardHeight + 12}
          rx={24}
          ry={24}
          fill="url(#boardBackdrop)"
          stroke={isDark ? 'url(#boardRimGlow)' : 'rgba(0, 0, 0, 0.08)'}
          strokeWidth={1.8}
        />

        {/* Inner Cyan Chamfer Line (Dark Mode) */}
        {isDark && (
          <rect
            x={padding - 4}
            y={padding - 4}
            width={boardWidth + 8}
            height={boardHeight + 8}
            rx={22}
            ry={22}
            fill="none"
            stroke="rgba(6, 182, 212, 0.20)"
            strokeWidth={1}
          />
        )}

        {/* Inset Grid Slots (3-Stop Metallic Obsidian Background Tiles) */}
        {gridSlots.map((slot) => (
          <rect
            key={slot.key}
            x={slot.x}
            y={slot.y}
            width={slot.size}
            height={slot.size}
            rx={14}
            ry={14}
            fill={isDark ? 'url(#bgTileMetallicDark)' : 'url(#bgTileMetallicLight)'}
            stroke={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}
            strokeWidth={1}
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
