"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * ContextualCursor — Element Direction
 * Minimalist, high-precision contextual cursor for desktop pointers.
 * Restrained electric cyan pinpoint dot + smooth lagging outer ring that
 * expands upon hovering interactive elements (links, buttons, inputs).
 * Strictly disabled on touch / mobile devices.
 */
export default function ContextualCursor() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  // Position state (raw cursor and smooth follower)
  const pos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    // Only run on desktop devices with hover support
    if (typeof window === "undefined") return;
    const isTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      !window.matchMedia("(hover: hover)").matches;

    if (isTouch) return;

    setMounted(true);

    const handlePointerMove = (e: PointerEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      if (!isVisible) setIsVisible(true);

      // Instant pinpoint dot positioning
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const handlePointerDown = () => setIsClicking(true);
    const handlePointerUp = () => setIsClicking(false);

    const handlePointerOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(
        'a, button, input, textarea, select, [role="button"], [tabindex="0"], .cursor-pointer, summary'
      );
      setIsHovering(!!interactive);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("mouseover", handlePointerOver, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Smooth physics loop for outer follower ring (spring-like lerp)
    const render = () => {
      const ease = 0.22;
      ringPos.current.x += (pos.current.x - ringPos.current.x) * ease;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * ease;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("mouseover", handlePointerOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isVisible]);

  if (!mounted) return null;

  return (
    <>
      {/* Outer Contextual Ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className={`fixed top-0 left-0 pointer-events-none z-50 -ml-3.5 -mt-3.5 rounded-full transition-[width,height,background-color,border-color,opacity] duration-200 ease-out will-change-transform ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${
          isHovering
            ? "w-10 h-10 -ml-5 -mt-5 border border-cyan-400/80 bg-cyan-500/[0.08] shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            : isClicking
            ? "w-4 h-4 -ml-2 -mt-2 border border-violet-400 bg-violet-500/20"
            : "w-7 h-7 border border-white/20 bg-transparent"
        }`}
      />

      {/* Center Precision Pinpoint Dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className={`fixed top-0 left-0 pointer-events-none z-50 -ml-1 -mt-1 rounded-full bg-cyan-400 transition-[opacity,transform,background-color] duration-150 will-change-transform ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${
          isHovering
            ? "w-1 h-1 -ml-0.5 -mt-0.5 bg-white shadow-[0_0_8px_#00f0ff]"
            : isClicking
            ? "w-2 h-2 -ml-1 -mt-1 bg-cyan-300"
            : "w-2 h-2 shadow-[0_0_6px_#00f0ff]"
        }`}
      />
    </>
  );
}
