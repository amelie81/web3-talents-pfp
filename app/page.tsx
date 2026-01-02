"use client";

import { useEffect, useRef, useState } from "react";

/* -----------------------------
   CUSTOM FONT
----------------------------- */
const fontStyle = `
@font-face {
  font-family: "HelloMissDi";
  src: url("/HelloMissDi.otf") format("opentype");
  font-weight: normal;
  font-style: normal;
}
`;

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [fgImage, setFgImage] = useState<HTMLImageElement | null>(null);

  const [name, setName] = useState("");
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [loading, setLoading] = useState(false);
  const [fontReady, setFontReady] = useState(false);

  /* -----------------------------
     LOAD FONT FIRST
  ----------------------------- */
  useEffect(() => {
    document.fonts.load('20px "HelloMissDi"').then(() => {
      setFontReady(true);
    });
  }, []);

  /* -----------------------------
     CANVAS COORD HELPER
  ----------------------------- */
  const getCanvasPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  /* -----------------------------
     LOAD BACKGROUND
  ----------------------------- */
  useEffect(() => {
    const img = new Image();
    img.src = "/background.png";
    img.onload = () => {
      setBgImage(img);
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
    };
  }, []);

  /* -----------------------------
     REDRAW
  ----------------------------- */
  useEffect(() => {
    if (!fontReady) return;
    draw(bgImage, fgImage, scale, pos, name);
  }, [bgImage, fgImage, scale, pos, name, fontReady]);

  /* -----------------------------
     TEXT WRAP
  ----------------------------- */
  const drawWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    font: string
  ) => {
    ctx.font = font;
    const words = text.split(" ");
    let line = "";
    let offsetY = 0;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
        ctx.fillText(line, x, y + offsetY);
        line = words[i] + " ";
        offsetY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y + offsetY);
  };

  /* -----------------------------
     DRAW
  ----------------------------- */
  const draw = (
    bg: HTMLImageElement | null,
    fg: HTMLImageElement | null,
    s: number,
    p: { x: number; y: number },
    n: string
  ) => {
    if (!bg || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.drawImage(bg, 0, 0);

    // White frame
    const frame = canvas.width * 0.015;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = frame;
    ctx.strokeRect(
      frame / 2,
      frame / 2,
      canvas.width - frame,
      canvas.height - frame
    );

    // ----- TEXT -----
    if (n.trim()) {
      const margin = canvas.width * 0.08;
      const fontSize = canvas.width * 0.055;
      const lineHeight = fontSize * 1.25;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";

      // Line 1 (custom font)
      drawWrappedText(
        ctx,
        `${n} is now officially part of the`,
        canvas.width / 2,
        canvas.height * 0.25,
        canvas.width - margin * 2,
        lineHeight,
        `${fontSize}px "HelloMissDi"`
      );

      // Line 2: Web3 Talents (nur die 3 System-Font)
      const baseY = canvas.height * 0.25 + lineHeight * 1.4;

      ctx.font = `${fontSize}px "HelloMissDi"`;
      const webText = "Web";
      const webWidth = ctx.measureText(webText).width;

      ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont`;
      const threeText = "3";
      const threeWidth = ctx.measureText(threeText).width;

      ctx.font = `${fontSize}px "HelloMissDi"`;
      const talentsText = " Talents Program!";
      const talentsWidth = ctx.measureText(talentsText).width;

      const totalWidth = webWidth + threeWidth + talentsWidth;
      let startX = canvas.width / 2 - totalWidth / 2;

      ctx.font = `${fontSize}px "HelloMissDi"`;
      ctx.fillText(webText, startX + webWidth / 2, baseY);
      startX += webWidth;

      ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont`;
      ctx.fillText(threeText, startX + threeWidth / 2, baseY);
      startX += threeWidth;

      ctx.font = `${fontSize}px "HelloMissDi"`;
      ctx.fillText(talentsText, startX + talentsWidth / 2, baseY);
    }

    // ----- CIRCLE -----
    const diameter = bg.height / 3;
    const radius = diameter / 2;
    const cx = bg.width / 2;
    const cy = bg.height * 0.6;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    if (fg) {
      const baseHeight = diameter * 0.9;
      const height = baseHeight * s;
      const width = (fg.width / fg.height) * height;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(fg, p.x, p.y, width, height);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 16;
    ctx.strokeStyle = "#2563eb";
    ctx.stroke();
  };

  /* -----------------------------
     UPLOAD (remove.bg fallback)
  ----------------------------- */
  const handleUpload = async (file: File) => {
    setLoading(true);
    let imageUrl: string;

    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/remove-bg", { method: "POST", body: fd });
      imageUrl = res.ok
        ? URL.createObjectURL(await res.blob())
        : URL.createObjectURL(file);
    } catch {
      imageUrl = URL.createObjectURL(file);
    }

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const diameter = bgImage!.height / 3;
      const baseHeight = diameter * 0.9;
      const initialScale = baseHeight / img.height;

      setFgImage(img);
      setScale(1);
      setPos({
        x: bgImage!.width / 2 - (img.width * initialScale) / 2,
        y: bgImage!.height * 0.6 - (img.height * initialScale) / 2,
      });
      setLoading(false);
    };
  };

  /* -----------------------------
     DRAG HELPERS
  ----------------------------- */
  const startDrag = (x: number, y: number) => {
    setDragging(true);
    dragOffset.current = { x: x - pos.x, y: y - pos.y };
  };

  const moveDrag = (x: number, y: number) => {
    if (!dragging) return;
    setPos({ x: x - dragOffset.current.x, y: y - dragOffset.current.y });
  };

  const stopDrag = () => setDragging(false);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-12">
      <style>{fontStyle}</style>

      <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-center">
        Congratulations — you made it into Web3 Talents 🎉
      </h1>

      <input
        type="text"
        maxLength={30}
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 px-4 py-3 rounded-xl w-full max-w-sm text-white text-center bg-transparent border border-white placeholder-gray-400"
      />

      <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-xl font-medium mb-6">
        {loading ? "Processing..." : "Upload photo"}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
        />
      </label>

      <div className="w-full max-w-[420px] md:max-w-[520px] mb-4">
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-xl border border-white cursor-grab active:cursor-grabbing"
          style={{ touchAction: "pan-y" }}
          onMouseDown={(e) => {
            const p = getCanvasPos(e.clientX, e.clientY);
            startDrag(p.x, p.y);
          }}
          onMouseMove={(e) => {
            if (!dragging) return;
            const p = getCanvasPos(e.clientX, e.clientY);
            moveDrag(p.x, p.y);
          }}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchStart={(e) => {
            const t = e.touches[0];
            const p = getCanvasPos(t.clientX, t.clientY);
            startDrag(p.x, p.y);
          }}
          onTouchMove={(e) => {
            if (!dragging) return;
            e.preventDefault();
            const t = e.touches[0];
            const p = getCanvasPos(t.clientX, t.clientY);
            moveDrag(p.x, p.y);
          }}
          onTouchEnd={stopDrag}
        />
      </div>

      {fgImage && (
        <div className="w-full max-w-xs mb-6 border border-white rounded-xl px-4 py-3">
          <input
            type="range"
            min="0.6"
            max="1.6"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-center text-sm text-gray-300 mt-2">
            Resize photo
          </p>
        </div>
      )}
    </main>
  );
}
