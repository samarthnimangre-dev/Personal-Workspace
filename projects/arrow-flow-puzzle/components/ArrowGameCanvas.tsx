'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowTile, LevelConfig, ThemeDefinition, HistoryMove } from '@/types/game';
import {
  traceArrowEscape,
  findUnblockedArrows,
  getDirectionDelta,
  getDirectionAngle,
  rotateDirection90CW,
} from '@/lib/raycast';
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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  drag?: number;
  gravity?: number;
  isShard?: boolean;
  isIce?: boolean;
  rotation?: number;
  rotSpeed?: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  alpha: number;
  createdAt: number;
}

interface ArrowAnimState {
  arrow: ArrowTile;
  homeX: number;
  homeY: number;
  renderX: number;
  renderY: number;
  baseAngle: number;
  visualAngle: number;
  targetVisualAngle: number;
  state: 'idle' | 'launching_escape' | 'launching_blocked' | 'recoil' | 'shattering' | 'done';
  launchStartTime?: number;
  recoilStartTime?: number;
  recoilMaxOffset?: number;
  isHinted?: boolean;
  iceHitsLeft: number;
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Gameplay state
  const [activeArrows, setActiveArrows] = useState<ArrowTile[]>([]);
  const [moveHistory, setMoveHistory] = useState<HistoryMove[]>([]);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);

  // Physics & Particle systems
  const animStatesRef = useRef<Map<string, ArrowAnimState>>(new Map());
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const screenShakeRef = useRef<number>(0);

  // 2.5D Isometric Tilt Matrix
  const tiltXRef = useRef<number>(0);
  const tiltYRef = useRef<number>(0);
  const targetTiltXRef = useRef<number>(0);
  const targetTiltYRef = useRef<number>(0);

  const hoveredArrowIdRef = useRef<string | null>(null);
  const boardLayoutRef = useRef<{
    cellSize: number;
    startX: number;
    startY: number;
    boardWidth: number;
    boardHeight: number;
    width: number;
    height: number;
  }>({
    cellSize: 64,
    startX: 0,
    startY: 0,
    boardWidth: 300,
    boardHeight: 300,
    width: 400,
    height: 400,
  });

  // Re-initialize level
  useEffect(() => {
    setActiveArrows(level.arrows);
    setMoveHistory([]);
    setMovesCount(0);
    setCombo(0);
    onComboUpdate(0);
    particlesRef.current = [];
    shockwavesRef.current = [];
    floatingTextsRef.current = [];
    animStatesRef.current.clear();
  }, [level, onComboUpdate]);

  // Handle Undo
  useEffect(() => {
    if (undoTrigger === 0 || moveHistory.length === 0) return;
    const last = moveHistory[moveHistory.length - 1];
    setActiveArrows((prev) => [...prev, last.arrow]);
    setMoveHistory((prev) => prev.slice(0, -1));
    sound.playTap();
  }, [undoTrigger]);

  // Handle Hint
  useEffect(() => {
    if (hintTrigger === 0) return;
    const unblocked = findUnblockedArrows(activeArrows, level.rows, level.cols);
    if (unblocked.length > 0) {
      const lucky = unblocked[0];
      sound.playHint();

      const st = animStatesRef.current.get(lucky.id);
      if (st) {
        st.isHinted = true;
        setTimeout(() => {
          if (st) st.isHinted = false;
        }, 3200);
      }

      const bl = boardLayoutRef.current;
      const hx = bl.startX + lucky.col * bl.cellSize + bl.cellSize / 2;
      const hy = bl.startY + lucky.row * bl.cellSize + bl.cellSize / 2;
      for (let i = 0; i < 28; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * 3.5;
        particlesRef.current.push({
          x: hx,
          y: hy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color: '#fbbf24',
          size: 2.5 + Math.random() * 3.5,
          alpha: 1,
          life: 0,
          maxLife: 45 + Math.random() * 20,
        });
      }
    } else {
      sound.playBlocked();
    }
  }, [hintTrigger, activeArrows, level.rows, level.cols]);

  // Handle Super Magnet
  useEffect(() => {
    if (magnetTrigger === 0) return;
    const unblocked = findUnblockedArrows(activeArrows, level.rows, level.cols);
    if (unblocked.length === 0) {
      sound.playBlocked();
      return;
    }

    sound.playMagnet();
    unblocked.forEach((arr, idx) => {
      setTimeout(() => {
        handleExecuteEscape(arr);
      }, idx * 65);
    });
  }, [magnetTrigger]);

  // Check victory
  const checkVictory = useCallback(
    (remaining: ArrowTile[]) => {
      // Victory occurs when all arrows (except non-blocking bombs) have escaped
      const remainingGameArrows = remaining.filter((a) => !a.isBomb);
      if (remainingGameArrows.length === 0) {
        sound.playWin();
        try {
          confetti({
            particleCount: 110,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#a855f7'],
          });
        } catch {}
        onLevelComplete(movesCount + 1, level.parMoves);
      }
    },
    [movesCount, level.parMoves, onLevelComplete]
  );

  // Launch unblocked arrow free
  const handleExecuteEscape = (arrow: ArrowTile) => {
    const st = animStatesRef.current.get(arrow.id);
    if (!st || st.state !== 'idle') return;

    st.state = 'launching_escape';
    st.launchStartTime = performance.now();

    const nextCombo = combo + 1;
    setCombo(nextCombo);
    onComboUpdate(nextCombo);
    sound.playWhoosh(nextCombo);

    const newMoves = movesCount + 1;
    setMovesCount(newMoves);
    onMoveMade(newMoves);

    setMoveHistory((prev) => [...prev, { arrow, index: prev.length }]);

    if (nextCombo >= 2) {
      const bl = boardLayoutRef.current;
      const hx = bl.startX + arrow.col * bl.cellSize + bl.cellSize / 2;
      const hy = bl.startY + arrow.row * bl.cellSize + bl.cellSize / 2;
      floatingTextsRef.current.push({
        id: Math.random().toString(),
        text: nextCombo === 2 ? '2x FLOW!' : nextCombo === 3 ? '3x CASCADE!' : `${nextCombo}x UNSTOPPABLE!`,
        x: hx,
        y: hy - 18,
        color: nextCombo >= 4 ? '#ec4899' : '#06b6d4',
        scale: 1.35,
        alpha: 1,
        createdAt: performance.now(),
      });
    }

    setTimeout(() => {
      setActiveArrows((prev) => {
        const next = prev.filter((a) => a.id !== arrow.id);
        checkVictory(next);
        return next;
      });
    }, 420);
  };

  // Hammer smash disintegration
  const handleExecuteHammer = (arrow: ArrowTile) => {
    const st = animStatesRef.current.get(arrow.id);
    if (!st) return;

    sound.playHammer();
    screenShakeRef.current = 14;
    onDeactivateHammer();

    st.state = 'shattering';

    const bl = boardLayoutRef.current;
    const hx = bl.startX + arrow.col * bl.cellSize + bl.cellSize / 2;
    const hy = bl.startY + arrow.row * bl.cellSize + bl.cellSize / 2;

    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 3.5 + Math.random() * 8;
      particlesRef.current.push({
        x: hx + (Math.random() - 0.5) * 16,
        y: hy + (Math.random() - 0.5) * 16,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2,
        color: Math.random() > 0.4 ? (arrow.color || theme.accentColor) : '#f43f5e',
        size: 4 + Math.random() * 5,
        alpha: 1,
        life: 0,
        maxLife: 35 + Math.random() * 20,
        drag: 0.94,
        gravity: 0.35,
        isShard: true,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.4,
      });
    }

    setTimeout(() => {
      setActiveArrows((prev) => {
        const next = prev.filter((a) => a.id !== arrow.id);
        checkVictory(next);
        return next;
      });
    }, 280);
  };

  // Detonate TNT Bomb tile
  const handleExecuteBomb = (bombTile: ArrowTile) => {
    sound.playBomb();
    screenShakeRef.current = 18;

    const bl = boardLayoutRef.current;
    const hx = bl.startX + bombTile.col * bl.cellSize + bl.cellSize / 2;
    const hy = bl.startY + bombTile.row * bl.cellSize + bl.cellSize / 2;

    // Expanding shockwave ring
    shockwavesRef.current.push({
      x: hx,
      y: hy,
      radius: 10,
      maxRadius: bl.cellSize * 2.2,
      color: '#f97316',
      alpha: 1,
      lineWidth: 5,
    });

    // 35 fiery explosion sparks
    for (let i = 0; i < 35; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 4 + Math.random() * 10;
      particlesRef.current.push({
        x: hx,
        y: hy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1,
        color: Math.random() > 0.5 ? '#ef4444' : Math.random() > 0.3 ? '#f97316' : '#fbbf24',
        size: 4 + Math.random() * 6,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        drag: 0.92,
        gravity: 0.25,
      });
    }

    // Clear bomb itself + shatter ice / remove blockers in 3x3 radius
    setTimeout(() => {
      setActiveArrows((prev) => {
        const next = prev
          .map((a) => {
            if (a.id === bombTile.id) return null; // Remove bomb
            const dr = Math.abs(a.row - bombTile.row);
            const dc = Math.abs(a.col - bombTile.col);
            if (dr <= 1 && dc <= 1) {
              if (a.isFrozen) {
                // Shatter ice
                return { ...a, isFrozen: false, hitsLeft: 0 };
              }
              // If standard blocker in blast, disintegrate it!
              return null;
            }
            return a;
          })
          .filter(Boolean) as ArrowTile[];

        checkVictory(next);
        return next;
      });
    }, 200);
  };

  // Shatter ice on frozen arrow
  const handleChipIce = (frozenArrow: ArrowTile) => {
    sound.playIceCrack();
    screenShakeRef.current = 6;

    const bl = boardLayoutRef.current;
    const hx = bl.startX + frozenArrow.col * bl.cellSize + bl.cellSize / 2;
    const hy = bl.startY + frozenArrow.row * bl.cellSize + bl.cellSize / 2;

    // Spawn 20 crystal ice shards
    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 6;
      particlesRef.current.push({
        x: hx + (Math.random() - 0.5) * 15,
        y: hy + (Math.random() - 0.5) * 15,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1,
        color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
        size: 3 + Math.random() * 4.5,
        alpha: 1,
        life: 0,
        maxLife: 28 + Math.random() * 15,
        drag: 0.93,
        gravity: 0.3,
        isIce: true,
      });
    }

    setActiveArrows((prev) =>
      prev.map((a) => {
        if (a.id === frozenArrow.id) {
          const nextHits = (a.hitsLeft ?? 1) - 1;
          return {
            ...a,
            hitsLeft: nextHits,
            isFrozen: nextHits > 0,
          };
        }
        return a;
      })
    );
  };

  // Main canvas interaction picking
  const handleCanvasInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const bl = boardLayoutRef.current;
    const col = Math.floor((x - bl.startX) / bl.cellSize);
    const row = Math.floor((y - bl.startY) / bl.cellSize);

    if (col < 0 || col >= level.cols || row < 0 || row >= level.rows) return;

    const clicked = activeArrows.find((a) => a.row === row && a.col === col);
    if (!clicked) return;

    const st = animStatesRef.current.get(clicked.id);
    if (!st || st.state !== 'idle') return;

    // 1. Hammer Mode
    if (isHammerMode) {
      handleExecuteHammer(clicked);
      return;
    }

    // 2. TNT Bomb Block
    if (clicked.isBomb) {
      handleExecuteBomb(clicked);
      return;
    }

    // 3. Frozen Block (Tapped directly)
    if (clicked.isFrozen && (clicked.hitsLeft ?? 1) > 0) {
      handleChipIce(clicked);
      return;
    }

    // 4. Raycast Escape Trace
    const res = traceArrowEscape(clicked, activeArrows, level.rows, level.cols);

    if (res.canEscape) {
      handleExecuteEscape(clicked);
    } else {
      // 5. Blocked Collision & Physics
      setCombo(0);
      onComboUpdate(0);

      // Check if blocker is frozen — bumping it chips the ice!
      if (res.blockerId) {
        const blocker = activeArrows.find((a) => a.id === res.blockerId);
        if (blocker && blocker.isFrozen) {
          handleChipIce(blocker);
        }
      }

      // Check if arrow is a Pivot Arrow (Rotates 90° CW on collision!)
      if (clicked.isPivot) {
        sound.playPivot();
        const nextDir = rotateDirection90CW(clicked.direction);
        st.state = 'launching_blocked';
        st.launchStartTime = performance.now();
        st.recoilMaxOffset = bl.cellSize * 0.32;
        screenShakeRef.current = 5;

        // Smoothly rotate visual angle by +90 degrees
        st.targetVisualAngle = st.visualAngle + Math.PI / 2;

        // Update active arrow direction
        setTimeout(() => {
          setActiveArrows((prev) =>
            prev.map((a) => (a.id === clicked.id ? { ...a, direction: nextDir } : a))
          );
        }, 180);
      } else {
        // Standard Rebound Physics
        sound.playBlocked();
        st.state = 'launching_blocked';
        st.launchStartTime = performance.now();
        st.recoilMaxOffset = bl.cellSize * 0.38;
        screenShakeRef.current = 6;
      }

      // Spawn collision impact sparks at border
      const delta = getDirectionDelta(clicked.direction);
      const impactX = bl.startX + (clicked.col + delta.dCol * 0.5 + 0.5) * bl.cellSize;
      const impactY = bl.startY + (clicked.row + delta.dRow * 0.5 + 0.5) * bl.cellSize;

      for (let i = 0; i < 18; i++) {
        const baseAngle = (getDirectionAngle(clicked.direction) * Math.PI) / 180 + Math.PI;
        const spreadAngle = baseAngle + (Math.random() - 0.5) * 1.8;
        const speed = 2 + Math.random() * 5;
        particlesRef.current.push({
          x: impactX,
          y: impactY,
          vx: Math.cos(spreadAngle) * speed,
          vy: Math.sin(spreadAngle) * speed,
          color: Math.random() > 0.3 ? '#f43f5e' : '#fbbf24',
          size: 2 + Math.random() * 3.5,
          alpha: 1,
          life: 0,
          maxLife: 20 + Math.random() * 15,
          drag: 0.92,
        });
      }
    }
  };

  // 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Smooth 2.5D Isometric Tilt Matrix (Lerp towards target)
      tiltXRef.current += (targetTiltXRef.current - tiltXRef.current) * 0.08;
      tiltYRef.current += (targetTiltYRef.current - tiltYRef.current) * 0.08;

      // Screen Shake
      let shakeX = 0;
      let shakeY = 0;
      if (screenShakeRef.current > 0.1) {
        shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        screenShakeRef.current *= 0.88;
      } else {
        screenShakeRef.current = 0;
      }
      ctx.translate(shakeX, shakeY);

      // Clear Frame
      ctx.clearRect(0, 0, width, height);

      // Layout Calculation
      const maxBoardW = Math.min(width - 28, 440);
      const maxBoardH = Math.min(height - 36, 480);
      const cellSize = Math.floor(Math.min(maxBoardW / level.cols, maxBoardH / level.rows));
      const boardWidth = cellSize * level.cols;
      const boardHeight = cellSize * level.rows;
      const startX = Math.floor((width - boardWidth) / 2);
      const startY = Math.floor((height - boardHeight) / 2);

      boardLayoutRef.current = { cellSize, startX, startY, boardWidth, boardHeight, width, height };

      // Draw Floating Ambient Background Particles
      if (Math.random() < 0.15 && particlesRef.current.length < 70) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: height + 10,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.3 - Math.random() * 0.5,
          color: theme.accentColor,
          size: 1.5 + Math.random() * 2,
          alpha: 0.15 + Math.random() * 0.25,
          life: 0,
          maxLife: 180 + Math.random() * 100,
        });
      }

      // Board Plinth Base with 2.5D Perspective Projection
      ctx.save();
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.translate(centerX, centerY);
      ctx.transform(1, tiltYRef.current * 0.04, tiltXRef.current * 0.04, 1, 0, 0);
      ctx.translate(-centerX, -centerY);

      // Deep 3D Drop Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 38;
      ctx.shadowOffsetY = 16 + tiltYRef.current * 10;
      ctx.shadowOffsetX = tiltXRef.current * 10;

      const pad = 14;
      ctx.beginPath();
      ctx.roundRect(startX - pad, startY - pad, boardWidth + pad * 2, boardHeight + pad * 2, 24);
      ctx.fillStyle = 'rgba(10, 15, 29, 0.9)';
      ctx.fill();
      ctx.restore();

      // Board Rim Glow
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.transform(1, tiltYRef.current * 0.04, tiltXRef.current * 0.04, 1, 0, 0);
      ctx.translate(-centerX, -centerY);

      ctx.beginPath();
      ctx.roundRect(startX - pad, startY - pad, boardWidth + pad * 2, boardHeight + pad * 2, 24);
      ctx.lineWidth = 1.5;
      const borderGrad = ctx.createLinearGradient(startX, startY, startX + boardWidth, startY + boardHeight);
      borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
      borderGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.35)');
      borderGrad.addColorStop(1, 'rgba(255, 255, 255, 0.06)');
      ctx.strokeStyle = borderGrad;
      ctx.stroke();

      // Draw Grid Slots
      for (let r = 0; r < level.rows; r++) {
        for (let c = 0; c < level.cols; c++) {
          const gx = startX + c * cellSize;
          const gy = startY + r * cellSize;
          const inset = 5;

          ctx.beginPath();
          ctx.roundRect(gx + inset, gy + inset, cellSize - inset * 2, cellSize - inset * 2, 12);
          ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
          ctx.fill();

          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.stroke();
        }
      }

      // Synchronize Animation States
      const now = performance.now();
      const currentMap = animStatesRef.current;

      activeArrows.forEach((arrow) => {
        const hx = startX + arrow.col * cellSize + cellSize / 2;
        const hy = startY + arrow.row * cellSize + cellSize / 2;
        const ang = (getDirectionAngle(arrow.direction) * Math.PI) / 180;

        let st = currentMap.get(arrow.id);
        if (!st) {
          st = {
            arrow,
            homeX: hx,
            homeY: hy,
            renderX: hx,
            renderY: hy,
            baseAngle: ang,
            visualAngle: ang,
            targetVisualAngle: ang,
            state: 'idle',
            iceHitsLeft: arrow.hitsLeft ?? (arrow.isFrozen ? 1 : 0),
          };
          currentMap.set(arrow.id, st);
        } else {
          st.arrow = arrow;
          st.homeX = hx;
          st.homeY = hy;
          st.baseAngle = ang;
        }
      });

      // Update & Render Each Tile
      currentMap.forEach((st) => {
        if (st.state === 'done') return;

        let renderX = st.homeX;
        let renderY = st.homeY;
        let scale = 1;
        let alpha = 1;

        // Smoothly interpolate visual angle (for Pivot 90° rotations)
        st.visualAngle += (st.targetVisualAngle - st.visualAngle) * 0.2;

        // Physics State Machine
        if (st.state === 'launching_escape') {
          const elapsed = (now - (st.launchStartTime || now)) / 1000;
          const speed = 1250 * Math.pow(elapsed * 2.2, 1.6);
          renderX = st.homeX + Math.cos(st.visualAngle) * speed;
          renderY = st.homeY + Math.sin(st.visualAngle) * speed;
          scale = 1 + elapsed * 0.35;
          alpha = Math.max(0, 1 - elapsed * 1.8);

          if (Math.random() < 0.85) {
            particlesRef.current.push({
              x: renderX + (Math.random() - 0.5) * 10,
              y: renderY + (Math.random() - 0.5) * 10,
              vx: -Math.cos(st.visualAngle) * (1 + Math.random() * 2),
              vy: -Math.sin(st.visualAngle) * (1 + Math.random() * 2),
              color: st.arrow.color || theme.accentColor,
              size: 3 + Math.random() * 4,
              alpha: 0.9,
              life: 0,
              maxLife: 18 + Math.random() * 10,
            });
          }

          if (elapsed > 0.42) {
            st.state = 'done';
          }
        } else if (st.state === 'launching_blocked') {
          const elapsed = (now - (st.launchStartTime || now)) / 1000;
          const reach = 0.08;

          if (elapsed < reach) {
            const dist = (st.recoilMaxOffset || 20) * (elapsed / reach);
            renderX = st.homeX + Math.cos(st.visualAngle) * dist;
            renderY = st.homeY + Math.sin(st.visualAngle) * dist;
          } else {
            st.state = 'recoil';
            st.recoilStartTime = now;
          }
        } else if (st.state === 'recoil') {
          const elapsed = (now - (st.recoilStartTime || now)) / 1000;
          const offset = (st.recoilMaxOffset || 18) * Math.exp(-18 * elapsed) * Math.cos(42 * elapsed);

          renderX = st.homeX + Math.cos(st.visualAngle) * offset;
          renderY = st.homeY + Math.sin(st.visualAngle) * offset;

          if (elapsed > 0.28) {
            st.state = 'idle';
            renderX = st.homeX;
            renderY = st.homeY;
          }
        }

        if (alpha <= 0.01) return;

        // Render Tile Entity
        ctx.save();
        ctx.translate(renderX, renderY);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        const tileSize = cellSize - 10;
        const rRadius = Math.max(8, tileSize * 0.22);
        const isHovered = hoveredArrowIdRef.current === st.arrow.id;

        // 3D Tile Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;

        ctx.beginPath();
        ctx.roundRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize, rRadius);

        // Surface Material
        const tileGrad = ctx.createLinearGradient(0, -tileSize / 2, 0, tileSize / 2);
        if (st.isHinted) {
          tileGrad.addColorStop(0, '#fef08a');
          tileGrad.addColorStop(1, '#eab308');
        } else if (st.arrow.isBomb) {
          tileGrad.addColorStop(0, '#7f1d1d');
          tileGrad.addColorStop(1, '#450a0a');
        } else if (st.arrow.isPivot) {
          tileGrad.addColorStop(0, '#2e1065');
          tileGrad.addColorStop(1, '#1e1b4b');
        } else if (isHovered) {
          tileGrad.addColorStop(0, '#1e293b');
          tileGrad.addColorStop(1, '#0f172a');
        } else {
          tileGrad.addColorStop(0, '#111827');
          tileGrad.addColorStop(0.6, '#0b0f19');
          tileGrad.addColorStop(1, '#030712');
        }
        ctx.fillStyle = tileGrad;
        ctx.fill();
        ctx.restore();

        // Rim Bevel Border
        ctx.save();
        ctx.translate(renderX, renderY);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.roundRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize, rRadius);
        ctx.lineWidth = st.isHinted ? 2.5 : isHovered ? 2 : 1.2;
        ctx.strokeStyle = st.isHinted
          ? '#fbbf24'
          : st.arrow.isBomb
          ? '#ef4444'
          : st.arrow.isPivot
          ? '#c084fc'
          : isHovered
          ? st.arrow.color || theme.accentColor
          : 'rgba(255, 255, 255, 0.12)';
        ctx.stroke();

        // Top Gloss Specular Highlight Line
        ctx.beginPath();
        ctx.roundRect(-tileSize / 2 + 3, -tileSize / 2 + 2, tileSize - 6, tileSize * 0.35, [
          rRadius - 2,
          rRadius - 2,
          2,
          2,
        ]);
        const gloss = ctx.createLinearGradient(0, -tileSize / 2, 0, -tileSize / 2 + tileSize * 0.35);
        gloss.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        gloss.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = gloss;
        ctx.fill();

        // Render Special Mechanics Overlay
        if (st.arrow.isBomb) {
          // TNT Bomb Icon with glowing pulsating fuse
          ctx.save();
          ctx.font = `bold ${Math.floor(tileSize * 0.44)}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 14;
          ctx.fillText('💣', 0, 1);
          ctx.restore();
        } else {
          // If Pivot Arrow: Draw circular golden pivot ring
          if (st.arrow.isPivot) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, tileSize * 0.38, 0, Math.PI * 2);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
          }

          // Luminous Neon Arrow Glyph
          ctx.save();
          ctx.rotate(st.visualAngle);

          const arrowLen = tileSize * 0.54;
          const headSize = tileSize * 0.24;
          const stemWidth = Math.max(3.5, tileSize * 0.09);
          const arrowColor = st.arrow.color || (st.arrow.isPivot ? '#c084fc' : theme.accentColor);

          ctx.shadowColor = arrowColor;
          ctx.shadowBlur = st.isHinted ? 20 : 12;

          // Arrow Stem
          ctx.beginPath();
          ctx.moveTo(-arrowLen / 2 + 2, 0);
          ctx.lineTo(arrowLen / 2 - headSize * 0.6, 0);
          ctx.lineWidth = stemWidth;
          ctx.lineCap = 'round';
          ctx.strokeStyle = arrowColor;
          ctx.stroke();

          // Arrow Head
          ctx.beginPath();
          ctx.moveTo(arrowLen / 2 - headSize, -headSize * 0.9);
          ctx.lineTo(arrowLen / 2, 0);
          ctx.lineTo(arrowLen / 2 - headSize, headSize * 0.9);
          ctx.lineWidth = stemWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = arrowColor;
          ctx.stroke();

          // White-hot laser core
          ctx.shadowBlur = 0;
          ctx.lineWidth = stemWidth * 0.45;
          ctx.strokeStyle = '#ffffff';

          ctx.beginPath();
          ctx.moveTo(-arrowLen / 2 + 2, 0);
          ctx.lineTo(arrowLen / 2 - headSize * 0.6, 0);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(arrowLen / 2 - headSize * 0.95, -headSize * 0.85);
          ctx.lineTo(arrowLen / 2 - 1, 0);
          ctx.lineTo(arrowLen / 2 - headSize * 0.95, headSize * 0.85);
          ctx.stroke();

          ctx.restore();
        }

        // Render Frozen Ice Crystal Crust Overlay
        if (st.arrow.isFrozen) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize, rRadius);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.fill();

          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.7)';
          ctx.stroke();

          // Ice fracture crack lines
          ctx.beginPath();
          ctx.moveTo(-tileSize * 0.3, -tileSize * 0.2);
          ctx.lineTo(0, 0);
          ctx.lineTo(tileSize * 0.25, -tileSize * 0.3);
          ctx.moveTo(0, 0);
          ctx.lineTo(-tileSize * 0.1, tileSize * 0.3);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.stroke();

          // Frost Icon
          ctx.font = `${Math.floor(tileSize * 0.26)}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('❄️', tileSize * 0.28, -tileSize * 0.28);
          ctx.restore();
        }

        ctx.restore();
      });

      ctx.restore(); // Restore board tilt

      // Render Expanding Shockwave Rings
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += 5.5;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.lineWidth = sw.lineWidth * sw.alpha;
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.stroke();
        ctx.restore();

        if (sw.radius >= sw.maxRadius) {
          shockwavesRef.current.splice(i, 1);
        }
      }

      // Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        if (p.drag) {
          p.vx *= p.drag;
          p.vy *= p.drag;
        }
        if (p.gravity) {
          p.vy += p.gravity;
        }

        const lifeRatio = p.life / p.maxLife;
        const currentAlpha = Math.max(0, p.alpha * (1 - lifeRatio));

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = p.color;

        if (p.isShard || p.isIce) {
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined && p.rotSpeed !== undefined) {
            p.rotation += p.rotSpeed;
            ctx.rotate(p.rotation);
          }
          ctx.beginPath();
          ctx.moveTo(-p.size, -p.size / 2);
          ctx.lineTo(p.size, 0);
          ctx.lineTo(0, p.size);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Render Floating Combo Labels
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        const age = (now - ft.createdAt) / 1000;
        if (age > 1.2) {
          floatingTextsRef.current.splice(i, 1);
          continue;
        }

        const yOffset = age * 40;
        const currentAlpha = Math.max(0, 1 - age / 1.2);
        const currentScale = ft.scale * (1 + Math.sin(age * 6) * 0.15);

        ctx.save();
        ctx.translate(ft.x, ft.y - yOffset);
        ctx.scale(currentScale, currentScale);
        ctx.globalAlpha = currentAlpha;

        ctx.font = '900 16px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ft.text, 0, 0);

        ctx.lineWidth = 1;
        ctx.strokeStyle = ft.color;
        ctx.strokeText(ft.text, 0, 0);
        ctx.restore();
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeArrows, level, theme]);

  // Pointer move handler with 2.5D tilt tracking
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Track 2.5D Isometric Tilt Matrix
    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;
    targetTiltXRef.current = normX * 0.8;
    targetTiltYRef.current = normY * 0.8;

    const bl = boardLayoutRef.current;
    const col = Math.floor((x - bl.startX) / bl.cellSize);
    const row = Math.floor((y - bl.startY) / bl.cellSize);

    if (col >= 0 && col < level.cols && row >= 0 && row < level.rows) {
      const found = activeArrows.find((a) => a.row === row && a.col === col);
      hoveredArrowIdRef.current = found ? found.id : null;
    } else {
      hoveredArrowIdRef.current = null;
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none touch-none">
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => handleCanvasInteraction(e.clientX, e.clientY)}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          hoveredArrowIdRef.current = null;
          targetTiltXRef.current = 0;
          targetTiltYRef.current = 0;
        }}
        className="w-full max-w-[480px] h-[360px] sm:h-[420px] md:h-[460px] cursor-pointer rounded-3xl"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
