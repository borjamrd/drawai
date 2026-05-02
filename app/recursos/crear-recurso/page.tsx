"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Wand2, Sparkles } from "lucide-react";
import Link from "next/link";
import { createResource } from "./actions";

function isPromptPoor(text: string): boolean {
  const words = text.trim().split(/\s+/);
  if (words.length < 4) return true;
  const contextWords = [
    "de pie",
    "sentado",
    "con ",
    "en ",
    "sosteniendo",
    "mirando",
    "perfil",
    "frente",
    "lado",
    "junto",
    "sobre",
    "dentro",
  ];
  const adjectives = [
    "antiguo",
    "moderno",
    "viejo",
    "joven",
    "colonial",
    "medieval",
    "victoriano",
    "clásico",
    "histórico",
  ];
  const lower = text.toLowerCase();
  const hasContext = contextWords.some((w) => lower.includes(w));
  const hasAdjective = adjectives.some((a) => lower.includes(a));
  return !hasContext && !hasAdjective;
}

const STOP_WORDS = [
  "de pie",
  "sentado",
  "sosteniendo",
  "mirando",
  " en ",
  " de ",
  " con ",
  " sin ",
  " sobre ",
  " por ",
  " para ",
  " junto",
];

function suggestName(prompt: string): string {
  const lower = prompt.toLowerCase();
  let cut = prompt.length;
  for (const w of STOP_WORDS) {
    const idx = lower.indexOf(w);
    if (idx > 0 && idx < cut) cut = idx;
  }
  const raw = prompt.slice(0, cut).trim();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function nameToSlug(name: string): string {
  const stopWords = new Set([
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "de",
    "del",
    "al",
    "con",
    "para",
    "por",
    "en",
    "y",
    "a",
  ]);
  return name
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 3)
    .join("-");
}

export default function CrearRecursoPage() {
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSvg, setSelectedSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedPrompt, setSuggestedPrompt] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [descValue, setDescValue] = useState("");

  const slug = nameToSlug(nameValue);

  const runGeneration = async (finalPrompt: string) => {
    setSuggestedPrompt(null);
    setLoading(true);
    setError(null);
    setOptions([]);
    setSelectedSvg(null);
    setNameValue("");
    setDescValue("");
    try {
      const res = await fetch("/api/generate-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOptions(data.options || []);
    } catch {
      setError("No se pudo generar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (isPromptPoor(prompt) && suggestedPrompt === null) {
      setEnriching(true);
      setError(null);
      try {
        const res = await fetch("/api/enrich-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSuggestedPrompt(data.enriched);
      } catch {
        await runGeneration(prompt);
      } finally {
        setEnriching(false);
      }
      return;
    }
    await runGeneration(prompt);
  };

  const handleAcceptSuggestion = async () => {
    const accepted = suggestedPrompt!;
    setPrompt(accepted);
    await runGeneration(accepted);
  };

  const handleDismissSuggestion = async () => {
    await runGeneration(prompt);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh]">
      {/* Left panel: controls */}
      <div className="w-full md:w-[400px] shrink-0 flex flex-col gap-8 px-8 py-10 bg-white dark:bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1">
          <Link
            href="/recursos"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
            Biblioteca
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Nuevo recurso
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Describe el activo y la IA lo dibujará. Selecciona la versión que
            más te guste.
          </p>
        </div>

        {/* Step 1: prompt */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="prompt"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Descripción
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setSuggestedPrompt(null);
              }}
              placeholder="ej: un soldado colonial de pie con uniforme y rifle…"
              rows={3}
              disabled={loading || enriching}
              className="resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow"
            />
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <motion.button
            type="button"
            onClick={handleGenerate}
            disabled={
              loading || enriching || !prompt.trim() || suggestedPrompt !== null
            }
            whileTap={{ scale: 0.97, y: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center gap-2 self-start rounded-lg bg-zinc-950 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-950 disabled:opacity-40 transition-opacity"
          >
            {loading || enriching ? (
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" strokeWidth={1.5} />
            )}
            {loading ? "Creando..." : enriching ? "Analizando…" : "Crear"}
          </motion.button>

          {/* Suggestion banner */}
          <AnimatePresence>
            {suggestedPrompt && (
              <motion.div
                key="suggestion"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 px-4 py-3.5">
                  <div className="flex items-start gap-2.5">
                    <Sparkles
                      className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0"
                      strokeWidth={1.5}
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Sugerencia de estilo
                      </span>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
                        {suggestedPrompt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <motion.button
                      type="button"
                      onClick={handleAcceptSuggestion}
                      whileTap={{ scale: 0.97, y: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="rounded-md bg-zinc-950 dark:bg-white px-3.5 py-1.5 text-xs font-medium text-white dark:text-zinc-950 transition-opacity hover:opacity-80"
                    >
                      Usar sugerencia
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleDismissSuggestion}
                      whileTap={{ scale: 0.97, y: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="rounded-md px-3.5 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    >
                      Continuar sin cambios
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 2: metadata form (shown after selection) */}
        <AnimatePresence>
          {selectedSvg && (
            <motion.form
              key="metadata-form"
              action={createResource}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="flex flex-col gap-5 pt-2 border-t border-zinc-100 dark:border-zinc-800"
            >
              <input type="hidden" name="imageData" value={selectedSvg ?? ""} />
              <input type="hidden" name="id" value={slug} />

              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Metadatos
              </p>

              {/* Name */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="label"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Nombre
                </label>
                <input
                  id="label"
                  name="label"
                  type="text"
                  required
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder="ej: Soldado Colonial"
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow"
                />
                {slug && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                    slug: {slug}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  placeholder="Describe el activo para que la IA entienda cuándo usarlo."
                  rows={3}
                  className="resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow"
                />
              </div>

              <motion.button
                type="submit"
                disabled={!slug || !nameValue.trim() || !descValue.trim()}
                whileTap={{ scale: 0.97, y: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex items-center gap-2 self-start rounded-lg bg-zinc-950 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-950 disabled:opacity-40 transition-opacity hover:opacity-80"
              >
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                Guardar recurso
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Right panel: SVG options + selected preview */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12 bg-white dark:bg-zinc-900 overflow-auto">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4 w-full max-w-lg"
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </motion.div>
          )}

          {options.length > 0 && !loading && (
            <motion.div
              key="options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4 w-full max-w-lg"
            >
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Haz click en la imagen para aceptarla
              </p>
              <div className="grid grid-cols-2 gap-4">
                {options.map((svg, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedSvg(svg);
                      const activePrompt = suggestedPrompt ?? prompt;
                      setNameValue(suggestName(activePrompt));
                      setDescValue(
                        activePrompt.charAt(0).toUpperCase() +
                          activePrompt.slice(1),
                      );
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 20,
                      delay: i * 0.07,
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={[
                      "aspect-square cursor-pointer rounded-xl flex items-center justify-center p-8 border transition-all duration-150",
                      selectedSvg === svg
                        ? "border-zinc-950 dark:border-white bg-white dark:bg-zinc-800 shadow-[0_0_0_2px] shadow-zinc-950 dark:shadow-white"
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 hover:border-zinc-400 dark:hover:border-zinc-500",
                    ].join(" ")}
                  >
                    <img
                      src={`data:image/png;base64,${svg}`}
                      alt={`Variante ${i + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {!options.length && !loading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 text-zinc-400 dark:text-zinc-600"
            >
              <Wand2 className="h-8 w-8" strokeWidth={1.5} />
              <p className="text-sm">Las opciones generadas aparecerán aquí</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
