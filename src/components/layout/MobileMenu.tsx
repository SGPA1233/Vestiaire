"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { NavLinks } from "./NavLinks";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
        aria-label="Ouvrir le menu"
      >
        ☰
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          // Rendu dans un portail (hors du header en backdrop-blur) : un
          // ancêtre avec backdrop-filter crée son propre bloc englobant pour
          // les descendants position:fixed, ce qui piégeait ce panneau dans
          // la hauteur du header au lieu du plein écran.
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/30"
              onClick={() => setOpen(false)}
            />
            <div className="relative flex h-full w-72 flex-col gap-6 overflow-y-auto bg-brand-green-950 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-white">Menu</span>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-green-100/70 hover:bg-white/10"
                  aria-label="Fermer le menu"
                >
                  ✕
                </button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
