"use client";

export interface ProcessedFile {
  data: Blob;
  type: "image" | "pdf";
  name: string;
  contentType: string;
}

export async function processReceiptFile(
  file: File,
  maxDim = 1400,
  quality = 0.82
): Promise<ProcessedFile> {
  if (file.type === "application/pdf") {
    return {
      data: file,
      type: "pdf",
      name: file.name,
      contentType: "application/pdf",
    };
  }

  // Resize images via canvas
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  let { width, height } = img;
  const ratio = Math.min(1, maxDim / Math.max(width, height));
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("compression failed"))),
      "image/jpeg",
      quality
    );
  });

  return {
    data: blob,
    type: "image",
    name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    contentType: "image/jpeg",
  };
}
