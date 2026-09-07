"use client";

import { useRef, useState } from "react";
import { Label } from "@/components/ui/Field";

const MAX_SIZE = 320;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas non supporté"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("Image invalide"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.readAsDataURL(file);
  });
}

export function ImagePicker({
  name,
  defaultValue,
  label = "Photo de l'article (facultatif)",
}: {
  name: string;
  defaultValue?: string | null;
  label?: string;
}) {
  const [preview, setPreview] = useState<string | null>(defaultValue ?? null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Sélectionnez un fichier image.");
      return;
    }
    try {
      const dataUrl = await resizeImage(file);
      setPreview(dataUrl);
      if (inputRef.current) inputRef.current.value = dataUrl;
    } catch {
      setError("Impossible de traiter cette image.");
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <input ref={inputRef} type="hidden" name={name} defaultValue={defaultValue ?? ""} />
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-cream-100">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl text-brand-green-950/20">📦</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="text-sm text-brand-green-950/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-green-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-green-800"
          />
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="self-start text-xs text-red-600 hover:underline"
            >
              Retirer la photo
            </button>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
