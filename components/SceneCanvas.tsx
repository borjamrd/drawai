"use client";

import { useEffect, useState } from "react";
import { motion, type TargetAndTransition } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useAssetsMap } from "@/lib/svg-library-client";
import type { Scene } from "@/lib/genkit/scene-flow";

type EntryEffect = "fade" | "slide_left" | "slide_right" | "slide_up" | "zoom" | "bounce";

const FONT_SIZE_PX: Record<string, number> = {
  xs: 10, sm: 13, md: 16, lg: 22, xl: 30, "2xl": 42, "3xl": 60,
};

const FONT_WEIGHT_MAP: Record<string, string | number> = {
  normal: 400, medium: 500, semibold: 600, bold: 700,
};

const BACKGROUND_COLORS: Record<string, string> = {
  white: "#FFFFFF",
  "light-warm": "#FDF8F3",
  dark: "#1C1C1E",
  slate: "#1E293B",
};

const ENTRY_VARIANTS: Record<
  EntryEffect,
  { initial: TargetAndTransition; animate: TargetAndTransition }
> = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  slide_left: {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0 },
  },
  slide_right: {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
  },
  slide_up: { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 } },
  zoom: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
  },
  bounce: { initial: { opacity: 0, y: -40 }, animate: { opacity: 1, y: 0 } },
};

// 800×450 canvas → 16 cols × 9 rows of 50px squares (exact fit)
const GRID_COLS = 16;
const GRID_ROWS = 9;
const GRID_CELLS = GRID_COLS * GRID_ROWS;

interface SceneCanvasProps {
  scene: Scene | null;
  showGrid?: boolean;
  compact?: boolean;
}

export function SceneCanvas({ scene, showGrid = false, compact = false }: SceneCanvasProps) {
  const SVG_LIBRARY_MAP = useAssetsMap();
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    if (!scene) return;
    const timers = scene.elements.map((el, i) =>
      setTimeout(
        () => setVisibleIndices((prev) => new Set([...prev, i])),
        el.entry_time_ms,
      ),
    );
    return () => {
      timers.forEach(clearTimeout);
      setVisibleIndices(new Set());
    };
  }, [scene, playKey]);

  return (
    <div className="flex flex-col gap-3">
      {!compact && <div className="flex items-center justify-between min-h-[36px]">
        {scene ? (
          <>
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 tracking-tight">
              {scene.title}
            </h2>
            <motion.button
              onClick={() => setPlayKey((k) => k + 1)}
              whileTap={{ scale: 0.96, y: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
              Repetir
            </motion.button>
          </>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-600 font-medium uppercase tracking-wider">
            Lienzo
          </span>
        )}
      </div>}

      <div
        className="relative w-[800px] h-[450px] border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]"
        style={{ background: BACKGROUND_COLORS[scene?.background ?? "white"] }}
      >
        {/* Hover cells — rendered below scene elements */}
        {showGrid && (
          <div
            className="absolute inset-0"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
            }}
          >
            {Array.from({ length: GRID_CELLS }).map((_, i) => (
              <div
                key={i}
                className="hover:bg-zinc-100 dark:hover:bg-zinc-900/30 transition-colors duration-150"
              />
            ))}
          </div>
        )}

        {scene?.elements.map((el, i) => {
          if (!visibleIndices.has(i)) return null;
          const variant = ENTRY_VARIANTS[el.entry_effect];
          const motionProps = {
            initial: variant.initial,
            animate: variant.animate,
            transition:
              el.entry_effect === "bounce"
                ? ({ type: "spring", stiffness: 300, damping: 10 } as const)
                : ({ type: "spring", stiffness: 100, damping: 20 } as const),
          };

          if (el.type === "image") {
            const asset = SVG_LIBRARY_MAP[el.library_id];
            if (!asset) return null;
            return (
              <div
                key={`${playKey}-${i}`}
                className="absolute"
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.width_pct}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <motion.div {...motionProps}>
                  <img
                    src={asset.svgPath}
                    alt={asset.label}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </motion.div>
              </div>
            );
          }

          if (el.type === "text") {
            return (
              <motion.div
                key={`${playKey}-${i}`}
                {...motionProps}
                className="absolute"
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.width_pct}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: `${FONT_SIZE_PX[el.font_size] ?? 16}px`,
                  color: el.color,
                  fontWeight: FONT_WEIGHT_MAP[el.font_weight ?? "normal"],
                  textAlign: el.text_align ?? "center",
                  fontStyle: el.font_style ?? "normal",
                  lineHeight: 1.25,
                  userSelect: "none",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {el.content}
              </motion.div>
            );
          }

          return null;
        })}

        {/* SVG grid lines — crisp 0.5px via pattern, always on top */}
        {showGrid && (
          <svg
            className="absolute inset-0 pointer-events-none text-zinc-300 dark:text-zinc-700"
            width="800"
            height="450"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="canvas-grid"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                {/* Top and left edges of each cell → forms full grid when tiled */}
                <path
                  d="M 50 0 L 0 0 L 0 50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  shapeRendering="crispEdges"
                />
              </pattern>
            </defs>
            <rect width="800" height="450" fill="url(#canvas-grid)" />
          </svg>
        )}
      </div>
    </div>
  );
}
