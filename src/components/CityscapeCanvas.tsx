"use client";
import { useEffect, useRef } from "react";

export function CityscapeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Sky gradient — indigo to deep navy
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#3730a3");
    grad.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    const rng = (seed: number) => ((Math.sin(seed) * 43758.5453) % 1 + 1) % 1;
    for (let i = 0; i < 80; i++) {
      const x = rng(i * 3.1) * W;
      const y = rng(i * 7.3) * (H * 0.55);
      const r = rng(i * 1.7) * 1.2 + 0.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Building data: [x, yTop, width]  (drawn to canvas bottom)
    const buildings: [number, number, number][] = [
      [0, H * 0.55, 48], [44, H * 0.42, 32], [72, H * 0.62, 38],
      [106, H * 0.28, 26], [128, H * 0.48, 42], [166, H * 0.64, 26],
      [188, H * 0.18, 28], [212, H * 0.52, 36], [244, H * 0.38, 22],
      [262, H * 0.14, 20], [278, H * 0.52, 38], [312, H * 0.26, 30],
      [338, H * 0.58, 34], [368, H * 0.36, 26], [390, H * 0.20, 24],
      [410, H * 0.44, 40], [446, H * 0.60, 22], [464, H * 0.32, 28],
      [488, H * 0.50, 36], [520, H * 0.24, 20], [536, H * 0.46, 42],
      [574, H * 0.34, 26], [596, H * 0.56, 30], [622, H * 0.22, 38],
      [656, H * 0.48, 24], [676, H * 0.16, 22], [694, H * 0.42, 46],
      [736, H * 0.60, 28], [760, H * 0.30, 32], [788, H * 0.52, 52],
    ];

    buildings.forEach(([x, yTop, w]) => {
      // Building silhouette
      ctx.fillStyle = "#111118";
      ctx.fillRect(x, yTop, w, H - yTop);

      // Windows — warm amber glow
      for (let wx = x + 4; wx < x + w - 3; wx += 7) {
        for (let wy = yTop + 6; wy < H - 6; wy += 10) {
          if (rng(wx * 13 + wy * 7) > 0.42) {
            ctx.fillStyle = `rgba(253,224,71,${0.25 + rng(wx + wy) * 0.35})`;
            ctx.fillRect(wx, wy, 4, 5);
          }
        }
      }

      // Clean top edge
      ctx.fillStyle = "#111118";
      ctx.fillRect(x, yTop, w, 3);
    });

    // Reunion Tower (Dallas landmark) — ball on a stick
    const tx = 262;
    ctx.fillStyle = "#111118";
    ctx.fillRect(tx + 7, H * 0.14, 6, H * 0.14);
    ctx.fillStyle = "#4f46e5";
    ctx.beginPath();
    ctx.arc(tx + 10, H * 0.11, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(165,180,252,0.6)";
    ctx.beginPath();
    ctx.arc(tx + 10, H * 0.11, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#818cf8";
    ctx.beginPath();
    ctx.arc(tx + 10, H * 0.11, 5, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={280}
      className="w-full block"
      style={{ display: "block" }}
      aria-hidden="true"
    />
  );
}
