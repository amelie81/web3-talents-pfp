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

    try {
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        alert("Error: " + error.error);
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      setResultImage(imageUrl);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    setLoading(false);
  };

  const handleConfirm = async () => {
    if (!resultImage) return;

    const background = new Image();
    background.src = "/background.png"; // dein Hintergrundbild aus public
    const fg = new Image();
    fg.src = resultImage;

    background.onload = () => {
      fg.onload = () => {
        const canvas = canvasRef.current!;
        canvas.width = background.width;
        canvas.height = background.height;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Hintergrund zeichnen
        ctx.drawImage(background, 0, 0);

        // Berechne Skalierung für das Vordergrundbild
        const maxWidth = background.width * 0.4; // max 40% Breite
        const scale = Math.min(maxWidth / fg.width, 1); // nie größer als Original
        const fgWidth = fg.width * scale;
        const fgHeight = fg.height * scale;

        // Position unten rechts
        const x = background.width - fgWidth;
        const y = background.height - fgHeight;

        ctx.drawImage(fg, x, y, fgWidth, fgHeight);

        // Neues Bild generieren
        const composedUrl = canvas.toDataURL("image/png");
        setComposedImage(composedUrl);
      };
    };
  };

  return (
    <main className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden">
      <div className="z-10 text-center max-w-xl px-6">
        <h1 className="text-3xl font-semibold mb-4">
          Congratulations — you made it into <br /> Web3 Talents 🎉
        </h1>

        <p className="text-gray-400 mb-6">
          Upload your photo and generate your official Web3 Talents profile
          visual.
        </p>

        <label className="inline-block cursor-pointer bg-white text-black px-6 py-3 rounded-xl font-medium hover:opacity-90 transition mb-4">
          {loading ? "Processing..." : "Choose your photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleUpload(e.target.files[0]);
            }}
          />
        </label>

        {/* Ergebnisbild */}
        {resultImage && (
          <div className="mb-4">
            <img
              src={resultImage}
              alt="Web3 Talents Profile"
              className="w-[260px] md:w-[320px] mx-auto"
            />
          </div>
        )}

        {/* Button bestätigen */}
        {resultImage && (
          <button
            onClick={handleConfirm}
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-medium transition mb-6"
          >
            Bestätigen
          </button>
        )}

        {/* Composed Image */}
        {composedImage && (
          <div>
            <img
              src={composedImage}
              alt="Final Composed"
              className="w-[260px] md:w-[320px] mx-auto"
            />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}
