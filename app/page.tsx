"use client";

import { useEffect, useRef, useState } from "react";

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [fgImage, setFgImage] = useState<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [loading, setLoading] = useState(false);

  // Load background once
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

  // Redraw canvas
  useEffect(() => {
    draw();
  }, [bgImage, fgImage, scale, pos]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !bgImage) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.drawImage(bgImage, 0, 0);

    if (!fgImage) return;

    const height = bgImage.height * 0.4 * scale;
    const width = (fgImage.width / fgImage.height) * height;

    // Clamp inside background
    const x = Math.min(
      Math.max(pos.x, 0),
      bgImage.width - width
    );
    const y = Math.min(
      Math.max(pos.y, 0),
      bgImage.height - height
    );

    ctx.drawImage(fgImage, x, y, width, height);
  };

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
        y: bgImage!.height * 0.45,
      });
      setLoading(false);
    };
  };

  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => {
    if (!fgImage) return;
    setDragging(true);
    setOffset({
      x: e.nativeEvent.offsetX - pos.x,
      y: e.nativeEvent.offsetY - pos.y,
    });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPos({
      x: e.nativeEvent.offsetX - offset.x,
      y: e.nativeEvent.offsetY - offset.y,
    });
  };

  const onMouseUp = () => setDragging(false);

  const download = () => {
    const canvas = canvasRef.current!;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "web3-talents.png";
      a.click();
    });
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-semibold mb-3 text-center">
        Congratulations — you made it into Web3 Talents 🎉
      </h1>

      <p className="text-gray-400 mb-6 text-center">
        Upload your photo, position it, and download your final visual.
      </p>

      <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-xl font-medium mb-4">
        {loading ? "Processing..." : "Upload photo"}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
        />
      </label>

      <canvas
        ref={canvasRef}
        className="border rounded-xl cursor-move mb-4"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      />

      {fgImage && (
        <>
          <div className="w-64 mb-4">
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-center text-sm text-gray-400">
              Resize
            </p>
          </div>

          <button
            onClick={download}
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-medium"
          >
            Confirm & Download
          </button>
        </>
      )}
    </main>
  );
}


