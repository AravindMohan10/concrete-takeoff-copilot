"use client";

import { useEffect, useState } from "react";

interface PdfViewerProps {
  imageBase64: string | null;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  selectedMark?: string | null;
  footingCount?: number;
}

const MIN_ZOOM = 50;
const MAX_ZOOM = 300;
const ZOOM_STEP = 25;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function PdfViewer({
  imageBase64,
  page,
  pageCount,
  onPageChange,
  loading,
  selectedMark,
  footingCount,
}: PdfViewerProps) {
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    setZoom(100);
  }, [page, imageBase64]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => clampZoom(z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Drawing</span>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-1">
            <button
              type="button"
              disabled={!imageBase64 || zoom <= MIN_ZOOM}
              onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
              className="rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
              title="Zoom out"
            >
              −
            </button>
            <span className="min-w-[3rem] text-center text-xs text-zinc-400">{zoom}%</span>
            <button
              type="button"
              disabled={!imageBase64 || zoom >= MAX_ZOOM}
              onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
              className="rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
              title="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              disabled={!imageBase64 || zoom === 100}
              onClick={() => setZoom(100)}
              className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
              title="Reset zoom"
            >
              Fit
            </button>
          </div>
          <button
            type="button"
            disabled={page <= 0 || loading}
            onClick={() => onPageChange(page - 1)}
            className="rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
          >
            ←
          </button>
          <span className="min-w-[80px] text-center text-sm text-zinc-300">
            Page {page + 1} / {pageCount || "-"}
          </span>
          <button
            type="button"
            disabled={page >= pageCount - 1 || loading}
            onClick={() => onPageChange(page + 1)}
            className="rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>

      {selectedMark && (
        <div className="border-b border-orange-500/20 bg-orange-500/5 px-4 py-2 text-xs text-orange-300">
          Reviewing footing <span className="font-mono font-semibold">{selectedMark}</span>
          {footingCount ? ` · ${footingCount} total on this sheet` : ""}
        </div>
      )}

      <div
        className="relative flex-1 overflow-auto p-3"
        onWheel={handleWheel}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/70">
            <span className="text-sm text-zinc-400">Rendering page…</span>
          </div>
        )}
        {imageBase64 ? (
          <div className="min-w-min">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${imageBase64}`}
              alt={`PDF page ${page + 1}`}
              className="mx-auto block rounded border border-zinc-800 shadow-lg"
              style={{
                width: `${zoom}%`,
                maxWidth: zoom <= 100 ? "100%" : "none",
              }}
              draggable={false}
            />
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-600">
            Upload a PDF to preview
          </div>
        )}
        {imageBase64 && (
          <p className="mt-2 text-center text-[10px] text-zinc-600">
            Ctrl + scroll to zoom · {zoom}%
          </p>
        )}
      </div>
    </div>
  );
}
