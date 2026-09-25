"use client";

import { useState } from "react";
import { Modal } from "../Modal";
import { TECHNIQUES, TECHNIQUE_CATEGORIES, type Technique, type TechniqueCategory } from "@/lib/benchmarks/techniques";

interface Props {
  open: boolean;
  onClose: () => void;
  onUse: (technique: Technique) => void;
}

/** Browsable catalog of common LLM testing techniques -- picking one adds a pre-filled test case. */
export function TechniqueLibrary({ open, onClose, onUse }: Props) {
  const [category, setCategory] = useState<TechniqueCategory>("safety");
  const [justAdded, setJustAdded] = useState<string | null>(null);

  function handleUse(t: Technique) {
    onUse(t);
    setJustAdded(t.id);
    setTimeout(() => setJustAdded((id) => (id === t.id ? null : id)), 1400);
  }

  return (
    <Modal open={open} onClose={onClose} title="LLM testing techniques" maxWidthClassName="max-w-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex w-fit gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
          {TECHNIQUE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${
                category === c.id ? "bg-cyan-300/10 text-cyan-100" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          {TECHNIQUES.filter((t) => t.category === category).map((t) => (
            <div key={t.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-100">{t.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">{t.description}</p>
                  <p className="mt-2 rounded-md border border-white/5 bg-black/30 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-neutral-500">
                    {t.promptTemplate}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUse(t)}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                    justAdded === t.id
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"
                  }`}
                >
                  {justAdded === t.id ? "Added" : "Use"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
