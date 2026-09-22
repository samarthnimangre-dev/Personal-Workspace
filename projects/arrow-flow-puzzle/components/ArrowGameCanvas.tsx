'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowTile, LevelConfig, ThemeDefinition, HistoryMove } from '@/types/game';
import { traceArrowEscape, findUnblockedArrows, getDirectionDelta, getDirectionAngle } from '@/lib/raycast';
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

// Particle for sparks, debris, trails
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
  rotation?: number;
  rotSpeed?: number;
}

// Floating combo / feedback text
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

// Dynamic state for each arrow in the physics engine
interface ArrowAnimState {
  arrow: ArrowTile;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  homeX: number;
  homeY: number;
  angle: number;
  state: 'idle' | 'launching_escape' | 'launching_blocked' | 'recoil' | 'shattering' | 'done';
  launchStartTime?: number;
  recoilStartTime?: number;
  recoilMaxOffset?: number;
  blockerId?: string;
  isHinted?: boolean;
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

  // References for high-rate physics loop
  const animStatesRef = useRef<Map<string, ArrowAnimState>>(new Map());
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const screenShakeRef = useRef<number>(0);
  const pointerPosRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false });
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

  // Re-initialize when level changes
  useEffect(() => {
    setActiveArrows(level.arrows);
    setMoveHistory([]);
    setMovesCount(0);
    setCombo(0);
    onComboUpdate(0);
    particlesRef.current = [];
    floatingTextsRef.current = [];
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

      // Trigger hint pulse on this arrow
      const state = animStatesRef.current.get(lucky.id);
      if (state) {
        state.isHinted = true;
        setTimeout(() => {
          if (state) state.isHinted = false;
        }, 3200);
      }

      // Spawn celestial hint sparkles around it
      const bl = boardLayoutRef.current;
      const hx = bl.startX + lucky.col * bl.cellSize + bl.cellSize / 2;
      const hy = bl.startY + lucky.row * bl.cellSize + bl.cellSize / 2;
      for (let i = 0; i < 25; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 3;
        particlesRef.current.push({
          x: hx,
          y: hy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color: '#fbbf24',
          size: 2 + Math.random() * 3,
          alpha: 1,
          life: 0,
          maxLife: 40 + Math.random() * 20,
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
      }, idx * 60);
    });
  }, [magnetTrigger]);

  // Trigger level victory
  const checkVictory = useCallback(
    (remainingArrows: ArrowTile[]) => {
      if (remainingArrows.length === 0) {
        sound.playWin();
        try {
          confetti({
            particleCount: 100,
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
    const state = animStatesRef.current.get(arrow.id);
    if (!state || state.state !== 'idle') return;

    state.state = 'launching_escape';
    state.launchStartTime = performance.now();

    const nextCombo = combo + 1;
    setCombo(nextCombo);
    onComboUpdate(nextCombo);
    sound.playWhoosh(nextCombo);

    const newMoves = movesCount + 1;
    setMovesCount(newMoves);
    onMoveMade(newMoves);

    // Save move to history
    setMoveHistory((prev) => [...prev, { arrow, index: prev.length }]);

    // Show floating combo text if combo >= 2
    if (nextCombo >= 2) {
      const bl = boardLayoutRef.current;
      const hx = bl.startX + arrow.col * bl.cellSize + bl.cellSize / 2;
      const hy = bl.startY + arrow.row * bl.cellSize + bl.cellSize / 2;
      floatingTextsRef.current.push({
        id: Math.random().toString(),
        text: nextCombo === 2 ? '2x FLOW!' : nextCombo === 3 ? '3x CASCADE!' : `${nextCombo}x UNSTOPPABLE!`,
        x: hx,
        y: hy - 15,
        color: nextCombo >= 4 ? '#ec4899' : '#06b6d4',
        scale: 1.3,
        alpha: 1,
        createdAt: performance.now(),
      });
    }

    // Schedule arrow removal
    setTimeout(() => {
      setActiveArrows((prev) => {
        const next = prev.filter((a) => a.id !== arrow.id);
        checkVictory(next);
        return next;
      });
    }, 450);
  };

  // Hammer smash disintegration
  const handleExecuteHammer = (arrow: ArrowTile) => {
    const state = animStatesRef.current.get(arrow.id);
    if (!state) return;

    sound.playHammer();
    screenShakeRef.current = 14;
    onDeactivateHammer();

    state.state = 'shattering';

    // Spawn 24 shatter polygon fragments
    const bl = boardLayoutRef.current;
    const hx = bl.startX + arrow.col * bl.cellSize + bl.cellSize / 2;
    const hy = bl.startY + arrow.row * bl.cellSize + bl.cellSize / 2;

    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 8;
      particlesRef.current.push({
        x: hx + (Math.random() - 0.5) * 20,
        y: hy + (Math.random() - 0.5) * 20,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2,
        color: Math.random() > 0.4 ? (arrow.color || theme.accentColor) : '#f43f5e',
        size: 4 + Math.random() * 6,
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
    }, 300);
  };

  // Tap handler (Collision Raycasting & Physics Launch)
  const handleCanvasInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const bl = boardLayoutRef.current;

    // Pick clicked cell
    const col = Math.floor((x - bl.startX) / bl.cellSize);
    const row = Math.floor((y - bl.startY) / bl.cellSize);

    if (col < 0 || col >= level.cols || row < 0 || row >= level.rows) return;

    const clickedArrow = activeArrows.find((a) => a.row === row && a.col === col);
    if (!clickedArrow) return;

    // Check if arrow is currently in an animation
    const state = animStatesRef.current.get(clickedArrow.id);
    if (!state || state.state !== 'idle') return;

    // 1. Hammer Mode
    if (isHammerMode) {
      handleExecuteHammer(clickedArrow);
      return;
    }

    // 2. Raycast Escape Trace
    const res = traceArrowEscape(clickedArrow, activeArrows, level.rows, level.cols);

    if (res.canEscape) {
      handleExecuteEscape(clickedArrow);
    } else {
      // 3. Collision Blocked Rebound Physics
      setCombo(0);
      onComboUpdate(0);
      sound.playBlocked();

      state.state = 'launching_blocked';
      state.launchStartTime = performance.now();
      state.blockerId = res.blockerId;
      state.recoilMaxOffset = bl.cellSize * 0.38;

      // Board micro-shake
      screenShakeRef.current = 6;

      // Blocker arrow subtle reactive wobble
      if (res.blockerId) {
        const blockerState = animStatesRef.current.get(res.blockerId);
        if (blockerState && blockerState.state === 'idle') {
          blockerState.state = 'recoil';
          blockerState.recoilStartTime = performance.now();
          blockerState.recoilMaxOffset = bl.cellSize * 0.12;
        }
      }

      // Spawn collision impact sparks at border between clicked arrow and blocker
      const delta = getDirectionDelta(clickedArrow.direction);
      const impactX = bl.startX + (clickedArrow.col + delta.dCol * 0.5 + 0.5) * bl.cellSize;
      const impactY = bl.startY + (clickedArrow.row + delta.dRow * 0.5 + 0.5) * bl.cellSize;

      for (let i = 0; i < 18; i++) {
        const baseAngle = (getDirectionAngle(clickedArrow.direction) * Math.PI) / 180 + Math.PI;
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

  // Main 60 FPS Render & Physics Loop
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

      // Clear Frame with Deep Contrast
      ctx.clearRect(0, 0, width, height);

      // Compute Responsive Board Layout
      const maxBoardW = Math.min(width - 32, 440);
      const maxBoardH = Math.min(height - 40, 480);
      const cellSize = Math.floor(
        Math.min(maxBoardW / level.cols, maxBoardH / level.rows)
      );
      const boardWidth = cellSize * level.cols;
      const boardHeight = cellSize * level.rows;
      const startX = Math.floor((width - boardWidth) / 2);
      const startY = Math.floor((height - boardHeight) / 2);

      boardLayoutRef.current = { cellSize, startX, startY, boardWidth, boardHeight, width, height };

      // 1. Draw Floating Ambient Dust Particles in Canvas Background
      if (Math.random() < 0.15 && particlesRef.current.length < 80) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: height + 10,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.3 - Math.random() * 0.5,
          color: theme.accentColor,
          size: 1 + Math.random() * 2,
          alpha: 0.15 + Math.random() * 0.25,
          life: 0,
          maxLife: 200 + Math.random() * 100,
        });
      }

      // 2. Render Board Plinth / Glass Slab Background
      ctx.save();
      // Drop Shadow for 3D depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 35;
      ctx.shadowOffsetY = 15;

      // Board Container Rounded Rect
      const pad = 14;
      ctx.beginPath();
      ctx.roundRect(startX - pad, startY - pad, boardWidth + pad * 2, boardHeight + pad * 2, 24);
      ctx.fillStyle = 'rgba(10, 15, 29, 0.85)';
      ctx.fill();
      ctx.restore();

      // Board Border Rim Light
      ctx.beginPath();
      ctx.roundRect(startX - pad, startY - pad, boardWidth + pad * 2, boardHeight + pad * 2, 24);
      ctx.lineWidth = 1.5;
      const borderGrad = ctx.createLinearGradient(startX, startY, startX + boardWidth, startY + boardHeight);
      borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      borderGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.3)');
      borderGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      ctx.strokeStyle = borderGrad;
      ctx.stroke();

      // 3. Draw Grid Slot Foundations (Subtle recessed wells)
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

      // Synchronize Animation States with Active Arrows
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
            currentX: hx,
            currentY: hy,
            targetX: hx,
            targetY: hy,
            homeX: hx,
            homeY: hy,
            angle: ang,
            state: 'idle',
          };
          currentMap.set(arrow.id, st);
        } else {
          st.arrow = arrow;
          st.homeX = hx;
          st.homeY = hy;
          st.angle = ang;
        }
      });

      // 4. Update and Render Each Arrow Entity
      currentMap.forEach((st) => {
        if (st.state === 'done') return;

        const delta = getDirectionDelta(st.arrow.direction);
        const tileColor = st.arrow.color || theme.accentColor;

        let renderX = st.homeX;
        let renderY = st.homeY;
        let scale = 1;
        let alpha = 1;

        // PHYSICS STATE MACHINE
        if (st.state === 'launching_escape') {
          // Accelerate off-screen along raycast vector
          const elapsed = (now - (st.launchStartTime || now)) / 1000;
          const speed = 1200 * Math.pow(elapsed * 2.2, 1.6);
          renderX = st.homeX + Math.cos(st.angle) * speed;
          renderY = st.homeY + Math.sin(st.angle) * speed;
          scale = 1 + elapsed * 0.3;
          alpha = Math.max(0, 1 - elapsed * 1.8);

          // Emit speed trail particles
          if (Math.random() < 0.8) {
            particlesRef.current.push({
              x: renderX + (Math.random() - 0.5) * 10,
              y: renderY + (Math.random() - 0.5) * 10,
              vx: -Math.cos(st.angle) * (1 + Math.random() * 2),
              vy: -Math.sin(st.angle) * (1 + Math.random() * 2),
              color: tileColor,
              size: 3 + Math.random() * 4,
              alpha: 0.9,
              life: 0,
              maxLife: 18 + Math.random() * 10,
            });
          }

          if (elapsed > 0.45) {
            st.state = 'done';
          }
        } else if (st.state === 'launching_blocked') {
          // Forward collision surge
          const elapsed = (now - (st.launchStartTime || now)) / 1000;
          const reachDuration = 0.08;

          if (elapsed < reachDuration) {
            const forwardProgress = elapsed / reachDuration;
            const dist = (st.recoilMaxOffset || 20) * forwardProgress;
            renderX = st.homeX + Math.cos(st.angle) * dist;
            renderY = st.homeY + Math.sin(st.angle) * dist;
          } else {
            // Reached impact point -> switch to damped spring recoil
            st.state = 'recoil';
            st.recoilStartTime = now;
          }
        } else if (st.state === 'recoil') {
          // Damped harmonic oscillation spring: x(t) = A * e^(-γt) * cos(ωt)
          const elapsed = (now - (st.recoilStartTime || now)) / 1000;
          const decay = 18; // Spring damping
          const freq = 42; // Spring frequency
          const envelope = Math.exp(-decay * elapsed);
          const oscillation = Math.cos(freq * elapsed);
          const offset = (st.recoilMaxOffset || 18) * envelope * oscillation;

          renderX = st.homeX + Math.cos(st.angle) * offset;
          renderY = st.homeY + Math.sin(st.angle) * offset;

          if (elapsed > 0.3) {
            st.state = 'idle';
            renderX = st.homeX;
            renderY = st.homeY;
          }
        }

        if (alpha <= 0.01) return;

        // DRAW 3D TACTILE ARROW TILE
        ctx.save();
        ctx.translate(renderX, renderY);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        const tileSize = cellSize - 10;
        const rRadius = Math.max(8, tileSize * 0.22);

        // 3D Drop Shadow underneath tile
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;

        // Base Tactile Capsule Rounded Box
        ctx.beginPath();
        ctx.roundRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize, rRadius);

        // Ambient glow when hovered or hinted
        const isHovered = hoveredArrowIdRef.current === st.arrow.id;
        const isHinted = st.isHinted;

        // Tile Surface Material Gradient
        const tileGrad = ctx.createLinearGradient(0, -tileSize / 2, 0, tileSize / 2);
        if (isHinted) {
          tileGrad.addColorStop(0, '#fef08a');
          tileGrad.addColorStop(1, '#eab308');
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

        // Tile Border Rim Bevel
        ctx.save();
        ctx.translate(renderX, renderY);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.roundRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize, rRadius);
        ctx.lineWidth = isHinted ? 2.5 : isHovered ? 2 : 1.2;
        ctx.strokeStyle = isHinted
          ? '#fbbf24'
          : isHovered
          ? tileColor
          : 'rgba(255, 255, 255, 0.12)';
        ctx.stroke();

        // Gloss Specular Highlight Line on top edge
        ctx.beginPath();
        ctx.roundRect(-tileSize / 2 + 3, -tileSize / 2 + 2, tileSize - 6, tileSize * 0.35, [
          rRadius - 2,
          rRadius - 2,
          2,
          2,
        ]);
        const glossGrad = ctx.createLinearGradient(0, -tileSize / 2, 0, -tileSize / 2 + tileSize * 0.35);
        glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = glossGrad;
        ctx.fill();

        // 5. DRAW THE LUMINOUS NEON ARROW GLYPH
        ctx.save();
        ctx.rotate(st.angle);

        const arrowLen = tileSize * 0.54;
        const headSize = tileSize * 0.24;
        const stemWidth = Math.max(3.5, tileSize * 0.09);

        // Neon Glow Pass
        ctx.shadowColor = tileColor;
        ctx.shadowBlur = isHinted ? 20 : 12;

        // Arrow Stem Line
        ctx.beginPath();
        ctx.moveTo(-arrowLen / 2 + 2, 0);
        ctx.lineTo(arrowLen / 2 - headSize * 0.6, 0);
        ctx.lineWidth = stemWidth;
        ctx.lineCap = 'round';
        ctx.strokeStyle = tileColor;
        ctx.stroke();

        // Arrowhead Chevron
        ctx.beginPath();
        ctx.moveTo(arrowLen / 2 - headSize, -headSize * 0.9);
        ctx.lineTo(arrowLen / 2, 0);
        ctx.lineTo(arrowLen / 2 - headSize, headSize * 0.9);
        ctx.lineWidth = stemWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = tileColor;
        ctx.stroke();

        // White Hot Core Pass for high-energy laser look
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
        ctx.restore();
      });

      // 6. UPDATE AND DRAW PARTICLES
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

        if (p.isShard) {
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

      // 7. DRAW FLOATING COMBO TEXT LABELS
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

  // Pointer move handler for hover highlight
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
        }}
        className="w-full max-w-[480px] h-[360px] sm:h-[420px] md:h-[460px] cursor-pointer rounded-3xl"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
