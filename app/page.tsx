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
     TEXT WRAP (Web3: only "3" different font)
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
    let line: string[] = [];
    let offsetY = 0;

    const measureWord = (word: string) => {
      if (word === "Web3") {
        ctx.font = ctx.font;
        const webWidth = ctx.measureText("Web").width;
        ctx.font = ctx.font.replace(/".*?"/, "sans-serif");
        const threeWidth = ctx.measureText("3").width;
        ctx.font = ctx.font.replace("sans-serif", `"HelloMissDi"`);
        return webWidth + threeWidth;
      }
      return ctx.measureText(word + " ").width;
    };

    const drawLine = (words: string[], yPos: number) => {
      let totalWidth = 0;
      words.forEach((w) => (totalWidth += measureWord(w)));

      let startX = x - totalWidth / 2;

      words.forEach((word) => {
        if (word === "Web3") {
          ctx.font = ctx.font;
          const webW = ctx.measureText("Web").width;
          ctx.fillText("Web", startX + webW / 2, yPos);
          startX += webW;

          ctx.font = ctx.font.replace(/".*?"/, "sans-serif");
          const threeW = ctx.measureText("3").width;
          ctx.fillText("3", startX + threeW / 2, yPos);
          startX += threeW + ctx.measureText(" ").width;

          ctx.font = ctx.font.replace("sans-serif", `"HelloMissDi"`);
        } else {
          const w = ctx.measureText(word + " ").width;
          ctx.fillText(word, startX + w / 2, yPos);
          startX += w;
        }
      });
    };

    words.forEach((word) => {
      const testLine = [...line, word];
      let testWidth = 0;
      testLine.forEach((w) => (testWidth += measureWord(w)));

      if (testWidth > maxWidth && line.length > 0) {
        drawLine(line, y + offsetY);
        line = [word];
        offsetY += lineHeight;
      } else {
        line.push(word);
      }
    });

    if (line.length) {
      drawLine(line, y + offsetY);
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
      const fontSize = canvas.width * 0.055;
      ctx.fillStyle = "#ffffff";

      drawTextWithWeb3Fix(
        ctx,
        `${n} is now officially part of the Web3 Talents Program!`,
        canvas.width / 2,
        canvas.height * 0.26,
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
    const imageUrl = URL.createObjectURL(file);

    const img = new Image();
    img.src = imageUrl;
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

  /* -----------------------------
     SHARE / DOWNLOAD
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

      {/* ✅ EINZIGE UI-ERGÄNZUNG */}
      <p className="text-center text-gray-300 mb-6 max-w-md">
        Add your name, upload a photo, adjust its size and position, then download
        or share your personalized graphic.
      </p>

      {/* Rest unverändert */}
    </main>
  );
}
