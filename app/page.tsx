"use client";

import { useEffect, useRef, useState } from "react";

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [fgImage, setFgImage] = useState<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [loading, setLoading] = useState(false);

  /* -----------------------------
     LOAD BACKGROUND ONCE
  ----------------------------- */
  useEffect(() => {
    const img = new Image();
    img.src = "/background.png";
    img.onload = () => {
      setBgImage(img);
      const canvas = canvasRef.current!;
      canvas.width = img.width;   // echte Export-Auflösung
      canvas.height = img.height;
      draw(img, null, scale, pos);
    };
  }, []);

  /* -----------------------------
     REDRAW CANVAS
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

    // Background
    ctx.drawImage(bg, 0, 0);

    if (!fg) return;

    // Zielhöhe = 40 % der Background-Höhe
    const targetHeight = bg.height * 0.4 * s;
    const targetWidth = (fg.width / fg.height) * targetHeight;

    // Clamping (bleibt immer im Bild)
    const x = Math.min(
      Math.max(p.x, 0),
      bg.width - targetWidth
    );
    const y = Math.min(
      Math.max(p.y, 0),
      bg.height - targetHeight
    );

    ctx.drawImage(fg, x, y, targetWidth, targetHeight);
  };

  /* -----------------------------
     UPLOAD + BACKGROUND REMOVAL
  ----------------------------- */
  const handleUpload = async (file: File) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/remove-bg", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      alert("Background removal failed");
      setLoading(false);
      return;
    }

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

  /* -----------------------------
     DRAG HANDLING (MOUSE)
  ----------------------------- */
  const onMouseDown = (e: React.MouseEvent) => {
    if (!fgImage) return;
    setDragging(true);
    setDragOffset({
      x: e.nativeEvent.offsetX - pos.x,
      y: e.nativeEvent.offsetY - pos.y,
    });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPos({
      x: e.nativeEvent.offsetX - dragOffset.x,
      y: e.nativeEvent.offsetY - dragOffset.y,
    });
  };

  const onMouseUp = () => setDragging(false);

  /* -----------------------------
     DOWNLOAD
  ----------------------------- */
  const downloadImage = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "web3-talents.png";
      a.click();
    });
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-12">
      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-center">
        Congratulations — you made it into Web3 Talents 🎉
      </h1>
      <p className="text-gray-400 mb-8 text-center max-w-xl">
        Upload your photo, position it freely, and download your final visual.
      </p>

      {/* Upload */}
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

      {/* Canvas (RESPONSIVE!) */}
      <div className="w-full max-w-[420px] md:max-w-[520px] mb-6">
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-xl border cursor-move"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        />
      </div>

      {/* Controls */}
      {fgImage && (
        <>
          <div className="w-full max-w-xs mb-6">
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
            <p className="text-center text-sm text-gray-400 mt-2">
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


