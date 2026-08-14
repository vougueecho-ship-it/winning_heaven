'use client';

import React, { useEffect, useRef } from 'react';

export default function ParticlesBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Light Rays Beam Data
    const beams = Array.from({ length: 7 }, (_, i) => ({
      x: (width / 6) * i + Math.random() * 50 - 25,
      angle: (Math.random() - 0.5) * 0.25,
      width: Math.random() * 120 + 80,
      opacity: Math.random() * 0.12 + 0.04,
      speed: Math.random() * 0.002 + 0.001
    }));

    // Floating Celestial Diamond Stars
    const stars = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1,
      maxSize: Math.random() * 3 + 2,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      pulse: Math.random() * Math.PI,
      speedY: Math.random() * 0.4 + 0.15,
      color: Math.random() > 0.4 ? '#ffc800' : '#00f0ff'
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Heavenly Light Beams
      beams.forEach((beam) => {
        beam.opacity += Math.sin(Date.now() * beam.speed) * 0.001;
        const currentOpacity = Math.max(0.02, Math.min(0.18, beam.opacity));

        const gradient = ctx.createLinearGradient(beam.x, 0, beam.x + Math.sin(beam.angle) * height, height);
        gradient.addColorStop(0, 'rgba(255, 200, 0, ' + currentOpacity + ')');
        gradient.addColorStop(0.5, 'rgba(0, 240, 255, ' + currentOpacity * 0.7 + ')');
        gradient.addColorStop(1, 'rgba(4, 6, 18, 0)');

        ctx.save();
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(beam.x - beam.width / 2, 0);
        ctx.lineTo(beam.x + beam.width / 2, 0);
        ctx.lineTo(beam.x + Math.sin(beam.angle) * height + beam.width, height);
        ctx.lineTo(beam.x + Math.sin(beam.angle) * height - beam.width, height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // 2. Draw Floating Celestial Stars & Shimmers
      stars.forEach((star) => {
        star.y -= star.speedY;
        if (star.y < -10) {
          star.y = height + 10;
          star.x = Math.random() * width;
        }

        star.pulse += star.pulseSpeed;
        const alpha = (Math.sin(star.pulse) + 1) / 2 * 0.7 + 0.2;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = star.color;

        // Draw 4-point Diamond Star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas id="particles-canvas" ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}
