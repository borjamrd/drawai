"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Grid3X3 } from "lucide-react";
import { SceneCanvas } from "@/components/SceneCanvas";
import type { Scene } from "@/lib/genkit/scene-flow";
import { cn } from "@/lib/utils";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [scene, setScene] = useState<Scene | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setScene(null);
    try {
      const res = await fetch("/api/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Scene = await res.json();
      setScene(data);
    } catch {
      setError("Algo salió mal, inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      {/* Top Section: Prompt Input */}
      <div className="w-full max-w-4xl mx-auto px-8 pt-10 pb-6 flex flex-col gap-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            Generador de Escenas
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Describe una escena y la IA la animará con los elementos de tu
            biblioteca.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Un soldado colonial llega al territorio, coloca un mapa en el centro y una flecha señala el norte…"
            className="w-full h-24 resize-none rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all shadow-sm group-hover:shadow-md"
            disabled={isLoading}
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-3">
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium animate-in fade-in slide-in-from-right-2">
                {error}
              </p>
            )}
            <motion.button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-xl bg-zinc-950 dark:bg-white px-5 py-2 text-sm font-medium text-white dark:text-zinc-950 disabled:opacity-40 transition-all hover:opacity-90 shadow-lg"
            >
              {isLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isLoading ? "Generando…" : "Generar"}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Bottom Section: Canvas + Options */}
      <div className="flex-1 flex flex-row items-start justify-center px-8 pb-12 gap-8 max-w-[1200px] mx-auto w-full">
        {/* Center: Canvas */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="w-[800px] h-[450px] rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800" />
                    <div className="absolute inset-0 rounded-full border-4 border-zinc-950 dark:border-white border-t-transparent animate-spin" />
                  </div>
                  <p className="text-sm font-medium text-zinc-500 animate-pulse">
                    Componiendo escena...
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="canvas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
                <SceneCanvas scene={scene} showGrid={showGrid} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Options */}
        <div className="w-48 pt-[48px] flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
              Visualización
            </p>
            <motion.button
              type="button"
              onClick={() => setShowGrid((g) => !g)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium border transition-all duration-200",
                showGrid
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-transparent shadow-md"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600",
              )}
            >
              <div className="flex items-center gap-2.5">
                <Grid3X3 className="h-4 w-4" strokeWidth={showGrid ? 2 : 1.5} />
                <span>Cuadrícula</span>
              </div>
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  showGrid ? "bg-emerald-400" : "bg-zinc-200 dark:bg-zinc-700",
                )}
              />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
