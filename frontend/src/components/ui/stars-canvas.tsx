"use client";

import { useEffect, useRef } from "react";

type StarsCanvasProps = {
  transparent?: boolean;
  maxStars?: number;
  hue?: number;
  brightness?: number;
  speedMultiplier?: number;
  twinkleIntensity?: number;
  className?: string;
  paused?: boolean;
};

type Star = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  jitterAmp: number;
  jitterFreq: number;
  driftPhase: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
};

export function StarsCanvas({
  transparent = true,
  maxStars = 760,
  hue = 210,
  brightness = 0.9,
  speedMultiplier = 0.07,
  twinkleIntensity = 48,
  className = "",
  paused = false,
}: StarsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const stars: Star[] = [];

    const texture = document.createElement("canvas");
    const textureCtx = texture.getContext("2d");
    if (!textureCtx) return;

    texture.width = 96;
    texture.height = 96;
    const half = texture.width / 2;
    const gradient = textureCtx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0.03, "#ffffff");
    gradient.addColorStop(0.14, `hsl(${hue}, 92%, 86%)`);
    gradient.addColorStop(0.42, `hsl(${hue}, 78%, 34%)`);
    gradient.addColorStop(1, "transparent");

    textureCtx.fillStyle = gradient;
    textureCtx.beginPath();
    textureCtx.arc(half, half, half, 0, Math.PI * 2);
    textureCtx.fill();

    const random = (min: number, max?: number) => {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      if (min > max) [min, max] = [max, min];
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    function createStar(): Star {
      const driftScale = (Math.random() * 0.35 + 0.15) * speedMultiplier;
      const baseVx = (Math.random() - 0.5) * driftScale;
      const baseVy = (Math.random() - 0.5) * driftScale;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: baseVx,
        vy: baseVy,
        baseVx,
        baseVy,
        jitterAmp: Math.random() * 0.00275 + 0.000625,
        jitterFreq: Math.random() * 0.0016 + 0.00035,
        driftPhase: Math.random() * Math.PI * 2,
        radius: Math.random() * 2.1 + 0.9,
        alpha: (Math.random() * 0.62 + 0.32) * brightness,
        twinkleSpeed: Math.random() * 0.004 + 0.0012,
        twinkleOffset: Math.random() * Math.PI * 2,
      };
    }

    for (let i = 0; i < maxStars; i += 1) {
      stars.push(createStar());
    }

    const animate = () => {
      if (paused) return;
      const now = performance.now();

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = transparent ? "rgba(0, 0, 0, 0)" : "rgba(5, 8, 18, 1)";
      ctx.clearRect(0, 0, width, height);
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "lighter";
      for (const star of stars) {
        // Subtle chaotic motion: combines smooth drift with tiny random gusts.
        const driftNoiseX = Math.sin(now * star.jitterFreq + star.driftPhase) * star.jitterAmp;
        const driftNoiseY = Math.cos(now * (star.jitterFreq * 0.87) + star.driftPhase * 1.31) * star.jitterAmp;
        star.vx = star.baseVx + driftNoiseX;
        star.vy = star.baseVy + driftNoiseY;

        if (Math.random() < 1 / (twinkleIntensity * 1.6)) {
          star.baseVx += (Math.random() - 0.5) * 0.000875;
          star.baseVy += (Math.random() - 0.5) * 0.000875;
        }

        star.x += star.vx;
        star.y += star.vy;

        if (star.x < -4) star.x = width + 4;
        if (star.x > width + 4) star.x = -4;
        if (star.y < -4) star.y = height + 4;
        if (star.y > height + 4) star.y = -4;

        const twinkleWave = 0.72 + 0.28 * Math.sin(now * star.twinkleSpeed + star.twinkleOffset);
        ctx.globalAlpha = Math.min(1, star.alpha * twinkleWave);
        ctx.drawImage(texture, star.x - star.radius / 2, star.y - star.radius / 2, star.radius, star.radius);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", onResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [transparent, maxStars, hue, brightness, speedMultiplier, twinkleIntensity, paused]);

  return <canvas ref={canvasRef} className={`fixed inset-0 h-full w-full ${className}`} style={{ display: "block" }} />;
}

