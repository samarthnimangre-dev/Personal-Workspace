// High-performance 60fps Canvas Particle Engine for tactile escape sparks and victory confetti
// Fully self-contained, stops RAF loop when idle to ensure zero battery/CPU overhead

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  rotation?: number;
  rotSpeed?: number;
  isConfetti?: boolean;
}

export interface ParticleTrigger {
  burstEscape: (x: number, y: number, color: string, angleDeg: number) => void;
  burstWin: (width: number, height: number) => void;
}

export class ParticleSystemController implements ParticleTrigger {
  private particles: Particle[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private isRunning: boolean = false;

  public bindCanvas(canvas: HTMLCanvasElement | null) {
    if (!canvas && this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
      this.isRunning = false;
    }
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
  }

  private startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    const render = () => {
      if (!this.ctx || !this.canvas) {
        this.isRunning = false;
        return;
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.isConfetti) {
          p.vy += 0.18; // gravity
          p.vx *= 0.99; // drag
          if (p.rotation !== undefined && p.rotSpeed !== undefined) {
            p.rotation += p.rotSpeed;
          }
        } else {
          p.vx *= 0.94; // friction
          p.vy *= 0.94;
        }

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.alpha);

        if (p.isConfetti) {
          this.ctx.translate(p.x, p.y);
          if (p.rotation) this.ctx.rotate(p.rotation);
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.radius, -p.radius * 0.6, p.radius * 2, p.radius * 1.2);
        } else {
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          this.ctx.fillStyle = p.color;
          this.ctx.fill();
        }

        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animId = requestAnimationFrame(render);
      } else {
        this.isRunning = false;
        this.animId = null;
      }
    };

    this.animId = requestAnimationFrame(render);
  }

  public burstEscape(x: number, y: number, color: string, angleDeg: number) {
    const baseRad = (angleDeg * Math.PI) / 180;
    const count = 14;

    for (let i = 0; i < count; i++) {
      // Fan out around the exit angle
      const spread = (Math.random() - 0.5) * 0.9;
      const angle = baseRad + spread;
      const speed = 2.5 + Math.random() * 4.5;

      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2.5,
        color,
        alpha: 1,
        decay: 0.025 + Math.random() * 0.02,
      });
    }

    this.startLoop();
  }

  public burstWin(width: number, height: number) {
    const palette = ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#f43f5e'];
    const count = 70;

    // Dynamically calculate spawn baseline to guarantee confetti spawns inside canvas on all board sizes
    const spawnBaseY = Math.min(height * 0.65, Math.max(40, height - 50));
    const yJitter = Math.min(30, height * 0.15);

    for (let i = 0; i < count; i++) {
      const x = width * 0.5 + (Math.random() - 0.5) * (width * 0.7);
      const y = Math.max(20, Math.min(height - 15, spawnBaseY + (Math.random() - 0.5) * yJitter * 2));
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const speed = 4 + Math.random() * 6.5;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 3,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        decay: 0.012 + Math.random() * 0.015,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        isConfetti: true,
      });
    }

    this.startLoop();
  }

  public clear() {
    this.particles = [];
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.isRunning = false;
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

export const particleController = new ParticleSystemController();
