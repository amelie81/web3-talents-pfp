import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const image = formData.get("image") as File | null;

  if (!image) {
    return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
  }

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing REMOVE_BG_API_KEY" }, { status: 500 });
  }

  // Konvertiere File in Blob, damit Node es korrekt senden kann
  const arrayBuffer = await image.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "image/png" });

  const removeBgForm = new FormData();
  removeBgForm.append("image_file", blob, "upload.png");
  removeBgForm.append("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
    },
    body: removeBgForm,
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: errorText }, { status: 500 });
  }

  const buffer = await response.arrayBuffer();

  return new Response(buffer, {
    headers: { "Content-Type": "image/png" },
  });
}
