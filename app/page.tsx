"use client";

import { useEffect, useRef, useState } from "react";

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [fgImage, setFgImage] = useState<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [loading, setLoading] = useState(false);

  /* -----------------------------
     CANVAS COORDINATE HELPER
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
    img.src = "/background1.png";
    img.onload = () => {
      setBgImage(img);
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      draw(img, null, scale, pos);
    };
  }, []);

  /* -----------------------------
     REDRAW
  ----------------------------- */
  useEffect(() => {
    draw(bgImage, fgImage, scale, pos);
  }, [bgImage, fgImage, scale, pos]);

  const draw = (
    bg: HTMLImageElement | null,
    fg: HTMLImageElement | null,
    s: number,
    p: { x: number; y: number }
  ) => {
    if (!bg || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Background */
    ctx.drawImage(bg, 0, 0);

    /* Circle geometry */
    const diameter = bg.height / 3;
    const radius = diameter / 2;
    const cx = bg.width / 2;
    const cy = bg.height * 0.6; // weiter nach oben

    /* White fill */
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

    /* Thicker blue border */
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 16; // deutlich dicker
    ctx.strokeStyle = "#2563eb"; // blue
    ctx.stroke();
  };

  /* -----------------------------
     UPLOAD
  ----------------------------- */
  const handleUpload = async (file: File) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/remove-bg", {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    const img = new Image();
    img.src = URL.createObjectURL(blob);

    img.onload = () => {
      const diameter = bgImage!.height / 3;
      const baseHeight = diameter * 0.9;
      const initialScale = baseHeight / img.height;

      setFgImage(img);
      setScale(1);

      // AUTOMATISCH IM KREIS ZENTRIERT
      setPos({
        x: bgImage!.width / 2 - (img.width * initialScale) / 2,
        y: bgImage!.height * 0.6 - (img.height * initialScale) / 2,
      });

      setLoading(false);
    };
  };

  /* -----------------------------
     DRAG LOGIC
  ----------------------------- */
  const startDrag = (x: number, y: number) => {
    setDragging(true);
    dragOffset.current = { x: x - pos.x, y: y - pos.y };
  };

  const moveDrag = (x: number, y: number) => {
    if (!dragging) return;
    setPos({
      x: x - dragOffset.current.x,
      y: y - dragOffset.current.y,
    });
  };

  const stopDrag = () => setDragging(false);

  /* -----------------------------
     MOUSE EVENTS
  ----------------------------- */
  const onMouseDown = (e: React.MouseEvent) => {
    const p = getCanvasPos(e.clientX, e.clientY);
    startDrag(p.x, p.y);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const p = getCanvasPos(e.clientX, e.clientY);
    moveDrag(p.x, p.y);
  };

  /* -----------------------------
     TOUCH EVENTS
  ----------------------------- */
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    const p = getCanvasPos(t.clientX, t.clientY);
    startDrag(p.x, p.y);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    const p = getCanvasPos(t.clientX, t.clientY);
    moveDrag(p.x, p.y);
  };

  /* -----------------------------
     DOWNLOAD
  ----------------------------- */
  const downloadImage = () => {
    canvasRef.current!.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "web3-talents.png";
      a.click();
    });
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-12">
      <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-center">
        Congratulations — you made it into Web3 Talents 🎉
      </h1>

      <p className="text-gray-400 mb-8 text-center max-w-xl">
        Upload your photo, adjust it inside the circle and download your final
        visual.
      </p>

      <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-xl font-medium mb-6">
        {loading ? "Processing..." : "Upload photo"}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) =>
            e.target.files && handleUpload(e.target.files[0])
          }
        />
      </label>

      <div className="w-full max-w-[420px] md:max-w-[520px] mb-6">
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-xl border border-white cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={stopDrag}
        />
      </div>

      {fgImage && (
        <>
          <div className="w-full max-w-xs mb-6 border border-white rounded-xl px-4 py-3">
            <input
              type="range"
              min="0.6"
              max="1.6"
              step="0.01"
              value={scale}
              onChange={(e) =>
                setScale(Number(e.target.value))
              }
              className="w-full"
            />
            <p className="text-center text-sm text-gray-300 mt-2">
              Resize photo
            </p>
          </div>

          <button
            onClick={downloadImage}
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-medium"
          >
            Confirm & Download
          </button>
        </>
      )}
    </main>
  );
}
