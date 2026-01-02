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

  /* ---------------- BACKGROUND LOAD ---------------- */
  useEffect(() => {
    const img = new Image();
    img.src = "/background.png";
    img.onload = () => {
      setBgImage(img);
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      draw(img, null, scale, pos);
    };
  }, []);

  /* ---------------- REDRAW ---------------- */
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

    ctx.drawImage(bg, 0, 0);

    if (!fg) return;

    const targetHeight = bg.height * 0.4 * s;
    const targetWidth = (fg.width / fg.height) * targetHeight;

    const x = Math.min(Math.max(p.x, 0), bg.width - targetWidth);
    const y = Math.min(Math.max(p.y, 0), bg.height - targetHeight);

    ctx.drawImage(fg, x, y, targetWidth, targetHeight);
  };

  /* ---------------- UPLOAD ---------------- */
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
      setFgImage(img);
      setScale(1);
      setPos({
        x: bgImage!.width * 0.55,
        y: bgImage!.height * 0.55,
      });
      setLoading(false);
    };
  };

  /* ---------------- DRAG LOGIC ---------------- */
  const isInsideImage = (x: number, y: number) => {
    if (!bgImage || !fgImage) return false;

    const h = bgImage.height * 0.4 * scale;
    const w = (fgImage.width / fgImage.height) * h;

    return (
      x >= pos.x &&
      x <= pos.x + w &&
      y >= pos.y &&
      y <= pos.y + h
    );
  };

  const startDrag = (x: number, y: number) => {
    if (!isInsideImage(x, y)) return;
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

  /* ---------------- MOUSE EVENTS ---------------- */
  const onMouseDown = (e: React.MouseEvent) =>
    startDrag(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  const onMouseMove = (e: React.MouseEvent) =>
    moveDrag(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  const onMouseUp = stopDrag;

  /* ---------------- TOUCH EVENTS ---------------- */
  const getTouchPos = (e: React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x:
        ((touch.clientX - rect.left) / rect.width) *
        canvasRef.current!.width,
      y:
        ((touch.clientY - rect.top) / rect.height) *
        canvasRef.current!.height,
    };
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const p = getTouchPos(e);
    startDrag(p.x, p.y);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const p = getTouchPos(e);
    moveDrag(p.x, p.y);
  };

  const onTouchEnd = stopDrag;

  /* ---------------- DOWNLOAD ---------------- */
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
        Upload your photo, drag it into position, resize it and download your
        final visual.
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
          onMouseUp={onMouseUp}
          onMouseLeave={stopDrag}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      </div>

      {fgImage && (
        <>
          <div className="w-full max-w-xs mb-6 border border-white rounded-xl px-4 py-3">
            <input
              type="range"
              min="0.6"
              max="1.4"
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



