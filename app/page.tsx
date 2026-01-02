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

  const [loading, setLoading] = useState(false);

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

    /* BACKGROUND */
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
      const web = "Web";
      const three = "3";
      const suffix = " Talents Program!";

      // Measure widths
      ctx.font = `${fontSize}px "HelloMissDi"`;
      const wPrefix = ctx.measureText(prefix).width;
      const wWeb = ctx.measureText(web).width;
      const wSuffix = ctx.measureText(suffix).width;

      ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont`;
      const wThree = ctx.measureText(three).width;

      const totalWidth = wPrefix + wWeb + wThree + wSuffix;
      let x = canvas.width / 2 - totalWidth / 2;

      // PREFIX – HelloMissDi
      drawOutlined(prefix, `${fontSize}px "HelloMissDi"`, x + wPrefix / 2);
      x += wPrefix;

      // "Web" – HelloMissDi
      drawOutlined(web, `${fontSize}px "HelloMissDi"`, x + wWeb / 2);
      x += wWeb;

      // "3" – STANDARD FONT ONLY
      drawOutlined(
        three,
        `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont`,
        x + wThree / 2
      );
      x += wThree;

      // SUFFIX – HelloMissDi
      drawOutlined(suffix, `${fontSize}px "HelloMissDi"`, x + wSuffix / 2);
    }

    /* ---------- PROFILE CIRCLE ---------- */
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

    /* ---------- GLOBAL WHITE BORDER ---------- */
    ctx.lineWidth = Math.max(8, canvas.width * 0.006);
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(
      ctx.lineWidth / 2,
      ctx.lineWidth / 2,
      canvas.width - ctx.lineWidth,
      canvas.height - ctx.lineWidth
    );
  };

  /* -----------------------------
     UPLOAD (FALLBACK SAFE)
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

      setFgImage(img);
      setScale(1);
      setPos({
        x: bgImage!.width / 2 - (img.width * baseHeight) / (2 * img.height),
        y: bgImage!.height * 0.6 - baseHeight / 2,
      });
      setLoading(false);
    };
  };

  /* -----------------------------
     DOWNLOAD / SHARE
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

  const shareImage = async () => {
    canvasRef.current!.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "web3-talents.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Web3 Talents",
          text: "I just joined the Web3 Talents Program 🚀",
        });
      } else {
        downloadImage();
        navigator.clipboard.writeText(window.location.href);
        alert("Image downloaded & page link copied.");
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
          className="w-full h-auto rounded-xl border border-white"
        />
      </div>

      {fgImage && (
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
      )}
    </main>
  );
}

