"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SceneCanvas } from "@/components/SceneCanvas";
import type { ScenePlan } from "@/lib/presentation";
import { cn } from "@/lib/utils";

// ─── constants ───────────────────────────────────────────────────────────────

const CANVAS_W = 800;
const CANVAS_H = 450;

const THUMB_W = 180;
const THUMB_SCALE = THUMB_W / CANVAS_W;
const THUMB_H = Math.round(CANVAS_H * THUMB_SCALE);

// ─── carousel thumbnail ──────────────────────────────────────────────────────

function Thumbnail({
  plan,
  index,
  isActive,
  onClick,
}: {
  plan: ScenePlan;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200",
        isActive
          ? "ring-2 ring-zinc-950 dark:ring-white shadow-lg scale-[1.04]"
          : "ring-1 ring-zinc-200 dark:ring-zinc-800 opacity-60 hover:opacity-90 hover:ring-zinc-400 dark:hover:ring-zinc-600",
      )}
      style={{ width: THUMB_W, height: THUMB_H }}
    >
      {plan.scene ? (
        <div
          style={{
            transform: `scale(${THUMB_SCALE})`,
            transformOrigin: "top left",
            width: CANVAS_W,
            height: CANVAS_H,
            pointerEvents: "none",
          }}
        >
          <SceneCanvas scene={plan.scene} compact />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
          <span className="text-[10px] font-medium text-zinc-400">
            Sin escena
          </span>
        </div>
      )}

      {/* Scene number badge */}
      <span
        className={cn(
          "absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold",
          isActive
            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
            : "bg-white/80 text-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-400 backdrop-blur-sm",
        )}
      >
        {index + 1}
      </span>
    </button>
  );
}

// ─── hook: track container width for canvas scaling ──────────────────────────

function useContainerScale(ref: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const containerW = entry?.contentRect.width ?? CANVAS_W;
      setScale(containerW / CANVAS_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return scale;
}

// ─── main viewer ──────────────────────────────────────────────────────────────

interface StoryboardViewerProps {
  scenes: ScenePlan[];
  title?: string;
}

export function StoryboardViewer({ scenes }: StoryboardViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasScale = useContainerScale(canvasContainerRef);
  const readyScenes = scenes.filter((s) => s.status === "ready" && s.scene);

  const activeScene = readyScenes[activeIndex];

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setActiveIndex((prev) => Math.min(readyScenes.length - 1, prev + 1));
      }
    },
    [readyScenes.length],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Auto-scroll carousel to keep active thumbnail visible
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;
    const thumb = container.children[activeIndex] as HTMLElement | undefined;
    if (!thumb) return;
    thumb.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex]);

  if (readyScenes.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-zinc-400">
          No hay escenas listas para visualizar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ─── main canvas ──────────────────────────────────────────────── */}
      <div className="relative w-full">
        {/* Scene info bar */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
              {activeIndex + 1}
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {activeScene?.title}
              </h2>
              {activeScene?.excerpt && (
                <p className="line-clamp-1 max-w-[600px] text-xs text-zinc-500 dark:text-zinc-400">
                  {activeScene.excerpt}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveIndex((p) => Math.max(0, p - 1))}
              disabled={activeIndex === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-30 dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="mx-2 font-mono text-xs text-zinc-400">
              {activeIndex + 1} / {readyScenes.length}
            </span>
            <button
              onClick={() =>
                setActiveIndex((p) => Math.min(readyScenes.length - 1, p + 1))
              }
              disabled={activeIndex === readyScenes.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-30 dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Canvas container — ResizeObserver tracks width, canvas scales to fit */}
        <div ref={canvasContainerRef} className="relative w-full">
          <div
            className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)]"
            style={{ height: Math.round(CANVAS_H * canvasScale) }}
          >
            <AnimatePresence mode="wait">
              {activeScene?.scene && (
                <motion.div
                  key={activeScene.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0"
                >
                  <div
                    style={{
                      transform: `scale(${canvasScale})`,
                      transformOrigin: "top left",
                      width: CANVAS_W,
                      height: CANVAS_H,
                    }}
                  >
                    <SceneCanvas scene={activeScene.scene} compact />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── carousel ────────────────────────────────────────────────── */}
      <div className="relative">
        <div
          ref={carouselRef}
          className="flex justify-center gap-3 overflow-x-auto px-1 pb-2"
          style={{ scrollbarWidth: "thin" }}
        >
          {readyScenes.map((plan, i) => (
            <Thumbnail
              key={plan.id}
              plan={plan}
              index={i}
              isActive={i === activeIndex}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600">
        Usa ← → para navegar entre escenas
      </p>
    </div>
  );
}
