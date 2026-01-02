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
     LOAD BACKGROUND (WAIT FOR FONT)
  ----------------------------- */
  useEffect(() => {
    const load = async () => {
      await document.fonts.load('10px "HelloMissDi"');

      const img = new Image();
      img.src = "/background.png";
      img.onload = () => {
        setBgImage(img);
        const canvas = canvasRef.current!;
        canvas.width = img.width;
        canvas.height = img.height;
        draw(img, null, scale, pos, name);
      };
    };

    load();
  }, []);

  /* -----------------------------
     REDRAW
  ----------------------------- */
  useEffect(() => {
    draw(bgImage, fgImage, scale, pos, name);
  }, [bgImage, fgImage, scale, pos, name]);

  /* -----------------------------
     TEXT WRAP
  ----------------------------- */
  const drawWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
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

    // Text
    if (n.trim()) {
      const margin = canvas.width * 0.08;
      const fontSize = canvas.width * 0.055;
      const lineHeight = fontSize * 1.25;

      ctx.font = `${fontSize}px "HelloMissDi"`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";

      drawWrappedText(
        ctx,
        `${n} is now officially part of the Web3 Talents Program!`,
        canvas.width / 2,
        canvas.height * 0.26,
        canvas.width - margin * 2,
        lineHeight
      );
    }

    // Circle
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
     UPLOAD
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
     DRAG
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

  /* -----------------------------
     SHARE
  ----------------------------- */
  const shareImage = async () => {
    const canvas = canvasRef.current!;
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/png")
    );
    if (!blob) return;

    const file = new File([blob], "web3-talents.png", { type: "image/png" });

    if ("share" in navigator) {
      await (navigator as any).share({
        files: [file],
        title: "Web3 Talents",
        text: "I’m officially part of the Web3 Talents Program 🚀",
      });
    }
  };

  /* -----------------------------
     DOWNLOAD
  ----------------------------- */
  const downloadImage = async () => {
    const canvas = canvasRef.current!;
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/png")
    );
    if (!blob) return;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "web3-talents.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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

      {fgImage && (
        <div className="flex gap-4">
          <button
            onClick={shareImage}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-xl font-medium"
          >
            Share
          </button>
          <button
            onClick={downloadImage}
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-medium"
          >
            Download
          </button>
        </div>
      )}
    </main>
  );
}
