// High-performance 60fps Canvas Particle Overlay component
import React, { useEffect, useRef } from 'react';
import { particleController } from '../utils/particles';

interface ParticleOverlayProps {
  width: number;
  height: number;
}

export const ParticleOverlay: React.FC<ParticleOverlayProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    particleController.bindCanvas(canvasRef.current);
    return () => {
      particleController.bindCanvas(null);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
