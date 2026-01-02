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
     WRAPPED TEXT WITH WEB3 FIX
  ----------------------------- */
  const drawWrappedTextWithWeb3Fix = (
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    startY: number,
    maxWidth: number,
    lineHeight: number,
    fontSize: number
  ) => {
    const words = text.split(" ");
    let line: string[] = [];
    let y = startY;

    const measureWord = (word: string) => {
      if (word === "Web3") {
        ctx.font = `${fontSize}px "HelloMissDi"`;
        const w1 = ctx.measureText("Web").width;
        ctx.font = `${fontSize}px sans-serif`;
        const w2 = ctx.measureText("3").width;
        return w1 + w2;
      }
      ctx.font = `${fontSize}px "HelloMissDi"`;
      return ctx.measureText(word).width;
    };

    const drawLine = (words: string[], y: number) => {
      let totalWidth = 0;

      words.forEach((w) => {
        totalWidth += measureWord(w + " ");
      });

      let x = centerX - totalWidth / 2;

      words.forEach((word) => {
        if (word === "Web3") {
          ctx.font = `${fontSize}px "HelloMissDi"`;
          ctx.fillText("Web", x + ctx.measureText("Web").width / 2, y);
          x += ctx.measureText("Web").width;

          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillText("3", x + ctx.measureText("3").width / 2, y);
          x += ctx.measureText("3").width + ctx.measureText(" ").width;
        } else {
          ctx.font = `${fontSize}px "HelloMissDi"`;
          const w = ctx.measureText(word + " ").width;
          ctx.fillText(word, x + w / 2, y);
          x += w;
        }
      });
    };

    words.forEach((word) => {
      const testLine = [...line, word];
      let testWidth = 0;

      testLine.forEach((w) => {
        testWidth += measureWord(w + " ");
      });

      if (testWidth > maxWidth && line.length > 0) {
        drawLine(line, y);
        line = [word];
        y += lineHeight;
      } else {
        line.push(word);
      }
    });

    if (line.length) {
      drawLine(line, y);
    }
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

    ctx.drawImage(bg, 0, 0);

    const frame = canvas.width * 0.015;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = frame;
    ctx.strokeRect(
      frame / 2,
      frame / 2,
      canvas.width - frame,
      canvas.height - frame
    );

    if (n.trim()) {
      const margin = canvas.width * 0.08;
      const fontSize = canvas.width * 0.055;
      const lineHeight = fontSize * 1.25;

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";

      drawWrappedTextWithWeb3Fix(
        ctx,
        `${n} is now officially part of the Web3 Talents Program!`,
        canvas.width / 2,
        canvas.height * 0.26,
        canvas.width - margin * 2,
        lineHeight,
        fontSize
      );
    }

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
    const url = URL.createObjectURL(file);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      const diameter = bgImage!.height / 3;
      const baseHeight = diameter * 0.9;

      setFgImage(img);
      setScale(1);
      setPos({
        x: bgImage!.width / 2 - (img.width * baseHeight) / img.height / 2,
        y: bgImage!.height * 0.6 - baseHeight / 2,
      });
      setLoading(false);
    };
  };

  const downloadImage = async () => {
    const canvas = canvasRef.current!;
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/png")
    );
    if (!blob) return;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "web3-talents.png";
    a.click();
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-12">
      <style>{fontStyle}</style>

      <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-center">
        Congratulations — you made it into Web3 Talents 🎉
      </h1>

      <p className="text-center text-gray-300 mb-6 max-w-md">
        Add your name, upload a photo, adjust its position, and download or share
        your personalized Web3 Talents graphic.
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

      <div className="w-full max-w-[420px] md:max-w-[520px] mb-4">
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-xl border border-white"
        />
      </div>

      {fgImage && (
        <button
          onClick={downloadImage}
          className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-medium"
        >
          Download
        </button>
      )}
    </main>
  );
}
