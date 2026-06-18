"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number; r: number };

/**
 * Ambient node-field for the hero: a living "ecosystem" of connected points.
 * Pure Canvas 2D (transform/opacity only, no layout). Pauses when off-screen,
 * and renders a single static frame under prefers-reduced-motion.
 */
export function EcosystemCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const context = el.getContext("2d");
    if (!context) return;
    // Explicit non-null types so the nested closures below keep the narrowing.
    const canvas: HTMLCanvasElement = el;
    const ctx: CanvasRenderingContext2D = context;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nodes: Node[] = [];
    let raf = 0;
    let visible = true;

    const INDIGO = "79, 70, 229";

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(46, Math.floor((width * height) / 22000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.8,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const linkDist = Math.min(150, width / 6);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.5;
            ctx.strokeStyle = `rgba(${INDIGO}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = `rgba(${INDIGO}, 0.8)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step() {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    resize();
    if (reduce) {
      draw();
    } else {
      raf = requestAnimationFrame(step);
    }

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const io = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        if (nowVisible === visible) return;
        visible = nowVisible;
        if (reduce) return;
        if (visible) {
          raf = requestAnimationFrame(step);
        } else {
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
