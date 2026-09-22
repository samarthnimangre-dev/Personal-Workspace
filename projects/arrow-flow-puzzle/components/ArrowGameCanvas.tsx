'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowTile, LevelConfig, ThemeDefinition, HistoryMove } from '@/types/game';
import { ArrowTileComponent } from './ArrowTileComponent';
import { traceArrowEscape, findUnblockedArrows } from '@/lib/raycast';
import { sound } from '@/lib/audio';
import confetti from 'canvas-confetti';

interface ArrowGameCanvasProps {
  level: LevelConfig;
  theme: ThemeDefinition;
  isHammerMode: boolean;
  onDeactivateHammer: () => void;
  onLevelComplete: (moves: number, parMoves: number) => void;
  onMoveMade: (movesCount: number) => void;
  onComboUpdate: (combo: number) => void;
  onRequestHint: () => void;
  onRequestUndo: () => void;
  undoTrigger: number;
  hintTrigger: number;
  magnetTrigger: number;
}

export const ArrowGameCanvas: React.FC<ArrowGameCanvasProps> = ({
  level,
  theme,
  isHammerMode,
  onDeactivateHammer,
  onLevelComplete,
  onMoveMade,
  onComboUpdate,
  undoTrigger,
  hintTrigger,
  magnetTrigger,
}) => {
  const [arrows, setArrows] = useState<ArrowTile[]>([]);
  const [blockedId, setBlockedId] = useState<string | null>(null);
  const [targetBlockerId, setTargetBlockerId] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<HistoryMove[]>([]);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState<number>(56);

  // Initialize level arrows
  useEffect(() => {
    setArrows(level.arrows.map((a) => ({ ...a, isRemoving: false, isHinted: false })));
    setMoveHistory([]);
    setMovesCount(0);
    setCombo(0);
    onComboUpdate(0);
    setBlockedId(null);
    setTargetBlockerId(null);
  }, [level, onComboUpdate]);

  // Handle responsive grid sizing based on viewport and row/col count
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const maxWidth = Math.min(window.innerWidth - 32, 480);
      const maxHeight = Math.min(window.innerHeight - 280, 520);

      const sizeByWidth = Math.floor((maxWidth - (level.cols + 1) * 8) / level.cols);
      const sizeByHeight = Math.floor((maxHeight - (level.rows + 1) * 8) / level.rows);

      const calculated = Math.min(Math.max(42, Math.min(sizeByWidth, sizeByHeight)), 76);
      setCellSize(calculated);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [level.rows, level.cols]);

  // Handle Undo Trigger from Parent
  useEffect(() => {
    if (undoTrigger === 0 || moveHistory.length === 0) return;

    const lastMove = moveHistory[moveHistory.length - 1];
    setArrows((prev) => [...prev, { ...lastMove.arrow, isRemoving: false, isHinted: false }]);
    setMoveHistory((prev) => prev.slice(0, -1));
    sound.playTap();
  }, [undoTrigger]);

  // Handle Hint Trigger from Parent
  useEffect(() => {
    if (hintTrigger === 0) return;

    const unblocked = findUnblockedArrows(arrows, level.rows, level.cols);
    if (unblocked.length > 0) {
      const luckyArrow = unblocked[0];
      sound.playHint();
      setArrows((prev) =>
        prev.map((a) => (a.id === luckyArrow.id ? { ...a, isHinted: true } : a))
      );

      // Auto-clear hint beacon after 3 seconds
      setTimeout(() => {
        setArrows((prev) => prev.map((a) => (a.id === luckyArrow.id ? { ...a, isHinted: false } : a)));
      }, 3000);
    } else {
      sound.playBlocked();
    }
  }, [hintTrigger]);

  // Handle Super Magnet Trigger from Parent (Clears all currently free arrows simultaneously)
  useEffect(() => {
    if (magnetTrigger === 0) return;

    const unblocked = findUnblockedArrows(arrows, level.rows, level.cols);
    if (unblocked.length === 0) {
      sound.playBlocked();
      return;
    }

    sound.playMagnet();

    // Mark all unblocked as removing
    const unblockedIds = new Set(unblocked.map((u) => u.id));
    setArrows((prev) =>
      prev.map((a) => (unblockedIds.has(a.id) ? { ...a, isRemoving: true } : a))
    );

    setTimeout(() => {
      setArrows((prev) => {
        const remaining = prev.filter((a) => !unblockedIds.has(a.id));
        if (remaining.length === 0) {
          triggerVictory();
        }
        return remaining;
      });
    }, 320);
  }, [magnetTrigger]);

  // Check victory condition
  const triggerVictory = useCallback(() => {
    sound.playWin();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'],
      });
    } catch {
      // Confetti fallback
    }
    onLevelComplete(movesCount + 1, level.parMoves);
  }, [movesCount, level.parMoves, onLevelComplete]);

  // Player clicks an arrow
  const handleArrowClick = (clickedArrow: ArrowTile) => {
    // 1. Hammer Mode Execution
    if (isHammerMode) {
      sound.playHammer();
      onDeactivateHammer();

      // Disintegrate arrow immediately
      setArrows((prev) => prev.filter((a) => a.id !== clickedArrow.id));
      const nextRemaining = arrows.filter((a) => a.id !== clickedArrow.id);
      if (nextRemaining.length === 0) {
        triggerVictory();
      }
      return;
    }

    // 2. Standard Collision Raycast
    const res = traceArrowEscape(clickedArrow, arrows, level.rows, level.cols);

    if (res.canEscape) {
      // SUCCESS: Arrow can fly free!
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      onComboUpdate(nextCombo);
      sound.playWhoosh(nextCombo);

      const newMoves = movesCount + 1;
      setMovesCount(newMoves);
      onMoveMade(newMoves);

      // Record move for Undo
      setMoveHistory((prev) => [...prev, { arrow: clickedArrow, index: prev.length }]);

      // Mark arrow as removing to trigger smooth launch CSS animation
      setArrows((prev) =>
        prev.map((a) => (a.id === clickedArrow.id ? { ...a, isRemoving: true, isHinted: false } : a))
      );

      // Remove from array after animation finishes
      setTimeout(() => {
        setArrows((prev) => {
          const remaining = prev.filter((a) => a.id !== clickedArrow.id);
          if (remaining.length === 0) {
            triggerVictory();
          }
          return remaining;
        });
      }, 300);
    } else {
      // BLOCKED: Path obstructed by another arrow
      setCombo(0);
      onComboUpdate(0);
      sound.playBlocked();

      setBlockedId(clickedArrow.id);
      if (res.blockerId) {
        setTargetBlockerId(res.blockerId);
      }

      // Clear shake and blocker highlights after 400ms
      setTimeout(() => {
        setBlockedId(null);
        setTargetBlockerId(null);
      }, 400);
    }
  };

  // Build grid layout matrix
  const gridCells = [];
  const arrowMap = new Map<string, ArrowTile>();
  for (const a of arrows) {
    arrowMap.set(`${a.row},${a.col}`, a);
  }

  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      const key = `${r},${c}`;
      const arrow = arrowMap.get(key);
      gridCells.push({ r, c, arrow, key });
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-3 sm:p-5 select-none w-full">
      {/* Game Board Container */}
      <div
        ref={containerRef}
        className={`
          relative rounded-3xl p-4 sm:p-6 backdrop-blur-xl border
          shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300
          ${theme.boardBg}
        `}
      >
        {/* Subtle grid border background */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${level.rows}, ${cellSize}px)`,
            gridTemplateColumns: `repeat(${level.cols}, ${cellSize}px)`,
            gap: '8px',
          }}
          className="relative"
        >
          {gridCells.map(({ r, c, arrow, key }) => (
            <div
              key={key}
              style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
              className={`
                rounded-xl flex items-center justify-center border border-dashed
                ${theme.gridBorder} transition-colors
              `}
            >
              {arrow && (
                <ArrowTileComponent
                  arrow={arrow}
                  cellSize={cellSize}
                  theme={theme}
                  isHammerMode={isHammerMode}
                  isBlocked={blockedId === arrow.id || targetBlockerId === arrow.id}
                  onClick={handleArrowClick}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
