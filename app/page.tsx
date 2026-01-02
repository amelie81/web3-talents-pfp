"use client";

import { useState, useRef } from "react";

export default function Page() {
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [composedImage, setComposedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    setResultImage(URL.createObjectURL(blob));
    setLoading(false);
  };

  const handleConfirm = () => {
    if (!resultImage || !canvasRef.current) return;

    const background = new Image();
    const fg = new Image();

    background.src = "/background.png";
    fg.src = resultImage;

    background.onload = () => {
      fg.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        canvas.width = background.width;
        canvas.height = background.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1️⃣ Background zeichnen
        ctx.drawImage(background, 0, 0);

        // 2️⃣ Zielhöhe = 40 % der Background-HÖHE
        const targetHeight = background.height * 0.4;

        // 3️⃣ Skalierung über HÖHE (Breite automatisch)
        const scale = targetHeight / fg.height;
        let fgWidth = fg.width * scale;
        let fgHeight = fg.height * scale;

        // 4️⃣ Clamping: niemals größer als Background
        if (fgWidth > background.width) {
          const clampScale = background.width / fgWidth;
          fgWidth *= clampScale;
          fgHeight *= clampScale;
        }

        // 5️⃣ Position unten rechts
        const x = background.width - fgWidth;
        const y = background.height - fgHeight;

        ctx.drawImage(fg, x, y, fgWidth, fgHeight);

        // 6️⃣ Finales Bild
        setComposedImage(canvas.toDataURL("image/png"));
      };
    };
  };

  const downloadImage = () => {
    if (!composedImage) return;
    const link = document.createElement("a");
    link.href = composedImage;
    link.download = "web3-talents.png";
    link.click();
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-semibold mb-4 text-center">
        Congratulations — you made it into <br /> Web3 Talents 🎉
      </h1>

      <p className="text-gray-400 mb-6 text-center">
        Upload your photo and generate your official Web3 Talents visual.
      </p>

      <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-xl font-medium hover:opacity-90 transition mb-6">
        {loading ? "Processing..." : "Choose your photo"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
        />
      </label>

      {resultImage && (
        <button
          onClick={handleConfirm}
          className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-medium mb-6"
        >
          Confirm placement
        </button>
      )}

      {composedImage && (
        <>
          <img
            src={composedImage}
            alt="Final"
            className="w-[320px] mb-4"
          />
          <button
            onClick={downloadImage}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-xl font-medium"
          >
            Download image
          </button>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}

