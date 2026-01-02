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
     CANVAS POSITION
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
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      setBgImage(img);
    };
  }, []);

  /* -----------------------------
     REDRAW
  ----------------------------- */
  useEffect(() => {
    draw();
  }, [bgImage, fgImage, scale, pos, name]);

  /* -----------------------------
     DRAW
  ----------------------------- */
  const draw = () => {
    if (!bgImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(bgImage, 0, 0);

    /* ---------- TEXT ---------- */
    if (name.trim()) {
      const fontSize = canvas.width * 0.055;
      const y = canvas.height * 0.24;

      ctx.textAlign = "center";
      ctx.lineJoin = "round";

      const drawOutlined = (text: string, font: string, x: number) => {
        ctx.font = font;
        ctx.lineWidth = fontSize * 0.18;
        ctx.strokeStyle = "#ffffff";
        ctx.strokeText(text, x, y);
        ctx.fillStyle = "#000000";
        ctx.fillText(text, x, y);
      };

      const prefix = `${name} is now officially part of the `;
      const web3 = "Web3";
      const suffix = " Talents Program!";

      ctx.font = `${fontSize}px "HelloMissDi"`;
      const w1 = ctx.measureText(prefix).width;

      ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont`;
      const w2 = ctx.measureText(web3).width;

      ctx.font = `${fontSize}px "HelloMissDi"`;
      const w3 = ctx.measureText(suffix).width;

      const total = w1 + w2 + w3;
      let x = canvas.width / 2 - total / 2;

      drawOutlined(prefix, `${fontSize}px "HelloMissDi"`, x + w1 / 2);
      x += w1;

      drawOutlined(
        web3,
        `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont`,
        x + w2 / 2
      );
      x += w2;

      drawOutlined(suffix, `${fontSize}px "HelloMissDi"`, x + w3 / 2);
    }

    /* ---------- CIRCLE ---------- */
    const diameter = bgImage.height / 3;
    const radius = diameter / 2;
    const cx = bgImage.width / 2;
    const cy = bgImage.height * 0.6;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    if (fgImage) {
      const baseHeight = diameter * 0.9;
      const h = baseHeight * scale;
      const w = (fgImage.width / fgImage.height) * h;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(fgImage, pos.x, pos.y, w, h);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 16;
    ctx.strokeStyle = "#2563eb";
    ctx.stroke();
  };

  /* -----------------------------
     UPLOAD (WITH FALLBACK)
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

  /* -----------------------------
     PUBLIC SHARE
  ----------------------------- */
  const shareImage = async () => {
    canvasRef.current!.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], "web3-talents.png", { type: "image/png" });

      // Mobile native share
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Web3 Talents",
          text: "I just joined the Web3 Talents Program 🚀",
        });
      } else {
        // Desktop fallback
        downloadImage();
        navigator.clipboard.writeText(window.location.href);
        alert("Image downloaded. Page link copied to clipboard.");
      }
    });
  };

  /* -----------------------------
     JSX
  ----------------------------- */
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-12">
      <style>{fontStyle}</style>

      <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-center">
        Congratulations — you made it into Web3 Talents 🎉
      </h1>

      <p className="text-gray-400 mb-6 text-center max-w-xl">
        Enter your name, upload your photo and share your official Web3 Talents visual.
      </p>

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

      <div className="w-full max-w-[420px] md:max-w-[520px] mb-6">
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-xl border border-white cursor-grab active:cursor-grabbing"
          style={{ touchAction: "pan-y" }}
          onMouseDown={(e) => startDrag(...Object.values(getCanvasPos(e.clientX, e.clientY)))}
          onMouseMove={(e) =>
            dragging && moveDrag(...Object.values(getCanvasPos(e.clientX, e.clientY)))
          }
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchStart={(e) => {
            const t = e.touches[0];
            startDrag(...Object.values(getCanvasPos(t.clientX, t.clientY)));
          }}
          onTouchMove={(e) => {
            if (!dragging) return;
            e.preventDefault();
            const t = e.touches[0];
            moveDrag(...Object.values(getCanvasPos(t.clientX, t.clientY)));
          }}
          onTouchEnd={stopDrag}
        />
      </div>

      {fgImage && (
        <>
          <input
            type="range"
            min="0.6"
            max="1.6"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full max-w-xs mb-6"
          />

          <div className="flex gap-4">
            <button
              onClick={downloadImage}
              className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-medium"
            >
              Download
            </button>

            <button
              onClick={shareImage}
              className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-xl font-medium"
            >
              Share
            </button>
          </div>
        </>
      )}
    </main>
  );
}
