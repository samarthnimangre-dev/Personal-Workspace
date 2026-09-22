'use client';

import React, { useState } from 'react';
import { X, Play, Copy, Check, Plus, Trash2, ArrowRight, RotateCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ArrowDirection, ArrowTile, LevelConfig } from '@/types/game';
import { getDirectionAngle, findUnblockedArrows } from '@/lib/raycast';
import { sound } from '@/lib/audio';

interface LevelEditorModalProps {
  isOpen: boolean;
  onPlayTestLevel: (level: LevelConfig) => void;
  onClose: () => void;
}

export const LevelEditorModal: React.FC<LevelEditorModalProps> = ({
  isOpen,
  onPlayTestLevel,
  onClose,
}) => {
  const [rows, setRows] = useState<number>(4);
  const [cols, setCols] = useState<number>(4);
  const [arrows, setArrows] = useState<ArrowTile[]>([
    { id: 'ed-1', row: 0, col: 0, direction: 'up', color: '#06b6d4' },
    { id: 'ed-2', row: 1, col: 1, direction: 'right', color: '#ec4899' },
    { id: 'ed-3', row: 2, col: 2, direction: 'down', color: '#10b981' },
    { id: 'ed-4', row: 3, col: 3, direction: 'left', color: '#f59e0b' },
  ]);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const directions: ArrowDirection[] = [
    'up',
    'up-right',
    'right',
    'down-right',
    'down',
    'down-left',
    'left',
    'up-left',
  ];

  // Rotate or add arrow on click
  const handleCellClick = (r: number, c: number) => {
    sound.playTap();
    const existingIndex = arrows.findIndex((a) => a.row === r && a.col === c);

    if (existingIndex >= 0) {
      const current = arrows[existingIndex];
      const dirIdx = directions.indexOf(current.direction);
      const nextDir = directions[(dirIdx + 1) % directions.length];

      const updated = [...arrows];
      updated[existingIndex] = { ...current, direction: nextDir };
      setArrows(updated);
    } else {
      // Add arrow
      setArrows([
        ...arrows,
        {
          id: `ed-${Date.now()}-${r}-${c}`,
          row: r,
          col: c,
          direction: 'up',
          color: '#06b6d4',
        },
      ]);
    }
  };

  // Remove arrow via right click or secondary action
  const handleCellContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    sound.playTap();
    setArrows(arrows.filter((a) => !(a.row === r && a.col === c)));
  };

  // Check solvability
  const unblocked = findUnblockedArrows(arrows, rows, cols);
  const isSolvableStart = unblocked.length > 0;

  const currentLevelConfig: LevelConfig = {
    id: 999,
    title: 'Custom Level',
    subtitle: 'Created in ArrowFlow Level Editor',
    difficulty: rows <= 4 ? 'easy' : rows <= 5 ? 'medium' : 'hard',
    rows,
    cols,
    parMoves: arrows.length,
    rewardCoins: 100,
    rewardGems: 25,
    arrows,
  };

  const handleCopyJSON = () => {
    sound.playCoin();
    navigator.clipboard.writeText(JSON.stringify(currentLevelConfig, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestPlay = () => {
    sound.playTap();
    onPlayTestLevel(currentLevelConfig);
    onClose();
  };

  const arrowMap = new Map<string, ArrowTile>();
  arrows.forEach((a) => arrowMap.set(`${a.row},${a.col}`, a));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-cyan-400" />
              <span>Tactile Level Editor</span>
            </h3>
            <p className="text-xs text-slate-400">
              Left click to add/rotate arrows. Right click to delete.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span>Grid Size:</span>
            {[3, 4, 5, 6].map((size) => (
              <button
                key={size}
                onClick={() => {
                  sound.playTap();
                  setRows(size);
                  setCols(size);
                  setArrows(arrows.filter((a) => a.row < size && a.col < size));
                }}
                className={`px-2.5 py-1 rounded-lg font-bold ${
                  rows === size
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {size}×{size}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playTap();
                setArrows([]);
              }}
              className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Interactive Editor Canvas */}
        <div className="p-6 overflow-y-auto flex flex-col items-center justify-center">
          <div
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${rows}, 52px)`,
              gridTemplateColumns: `repeat(${cols}, 52px)`,
              gap: '8px',
            }}
            className="bg-slate-950/80 p-4 rounded-3xl border border-slate-800 shadow-xl"
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((_, c) => {
                const arrow = arrowMap.get(`${r},${c}`);
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={(e) => handleCellContextMenu(e, r, c)}
                    className={`w-[52px] h-[52px] rounded-xl flex items-center justify-center border transition-all active:scale-95 ${
                      arrow
                        ? 'bg-indigo-950/80 border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                        : 'border-dashed border-slate-800 hover:border-slate-600 bg-slate-900/30'
                    }`}
                  >
                    {arrow ? (
                      <div
                        style={{
                          transform: `rotate(${getDirectionAngle(arrow.direction)}deg)`,
                        }}
                      >
                        <ArrowRight
                          className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_6px_#06b6d4]"
                          strokeWidth={3}
                        />
                      </div>
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-slate-700" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Solvability Status */}
          <div className="mt-5 flex items-center gap-2 text-xs">
            {isSolvableStart ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Valid: {unblocked.length} arrow(s) can escape initially</span>
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Notice: All arrows are currently blocked (Deadlock at start)</span>
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopyJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied JSON!' : 'Copy Level JSON'}</span>
          </button>

          <button
            onClick={handleTestPlay}
            disabled={arrows.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950/50 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Play Test Level</span>
          </button>
        </div>
      </div>
    </div>
  );
};
