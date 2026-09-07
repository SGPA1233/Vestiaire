"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { ParsedEmployeeRow } from "@/lib/import-csv";
import { previewEmployeeImport, confirmEmployeeImport } from "./actions";

export function EmployeeImportWizard() {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<{ rows: ParsedEmployeeRow[]; errors: string[] } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState<number | null>(null);

  function handlePreview() {
    setDone(null);
    startTransition(async () => {
      const result = await previewEmployeeImport(text);
      setPreview(result);
    });
  }

  function handleConfirm() {
    if (!preview) return;
    startTransition(async () => {
      const result = await confirmEmployeeImport(preview.rows);
      setDone(result.imported);
      setPreview(null);
      setText("");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"prenom;nom;actif;operationnel;tshirt;veste;pantalon;chaussures\nChloé;Padé;oui;oui;S;S;34;39"}
        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      <div>
        <Button type="button" variant="secondary" onClick={handlePreview} disabled={isPending || !text.trim()}>
          Aperçu
        </Button>
      </div>

      {preview && (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">{preview.rows.length}</span> collaborateur(s)
            détecté(s)
            {preview.errors.length > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-amber-600">{preview.errors.length}</span>{" "}
                ligne(s) avec erreur
              </>
            )}
          </p>
          {preview.errors.length > 0 && (
            <ul className="list-inside list-disc text-xs text-amber-600">
              {preview.errors.slice(0, 10).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          {preview.rows.length > 0 && (
            <ul className="max-h-48 overflow-y-auto text-sm text-slate-600">
              {preview.rows.map((r, i) => (
                <li key={i}>
                  {r.firstName} {r.lastName}
                  {!r.active ? " (inactif)" : ""}
                  {!r.operational ? " (non opérationnel)" : ""}
                </li>
              ))}
            </ul>
          )}
          {preview.rows.length > 0 && (
            <div>
              <Button type="button" onClick={handleConfirm} disabled={isPending}>
                {isPending ? "Import..." : `Confirmer l'import de ${preview.rows.length} collaborateur(s)`}
              </Button>
            </div>
          )}
        </div>
      )}

      {done !== null && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {done} collaborateur(s) importé(s) avec succès.
        </p>
      )}
    </div>
  );
}
