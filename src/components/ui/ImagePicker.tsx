"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/Field";

const MAX_SIZE = 1000;

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
        resolve(canvas.toDataURL("image/jpeg", 0.88));
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="hidden"
      />
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <button
            type="button"
            onClick={() => (preview ? setLightboxOpen(true) : fileInputRef.current?.click())}
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-cream-100"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl text-brand-green-950/20">📦</span>
            )}
          </button>
          <div ref={menuRef} className="absolute bottom-1 right-1">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Réglages de la photo"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white/95 text-xs shadow-sm hover:bg-white"
            >
              ⚙️
            </button>
            {menuOpen && (
              <div className="absolute bottom-7 right-0 z-10 w-44 overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="block w-full px-3 py-2 text-left text-xs text-brand-green-950/80 hover:bg-cream-100"
                >
                  Choisir un fichier
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setPreview(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-cream-100"
                  >
                    Retirer la photo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {lightboxOpen && preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setLightboxOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
