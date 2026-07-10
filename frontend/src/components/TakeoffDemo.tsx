"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FootingTable } from "@/components/FootingTable";
import { PdfViewer } from "@/components/PdfViewer";
import { UploadZone } from "@/components/UploadZone";
import { extractFootingSchedule, getPdfInfo, isApiAvailable, renderPage } from "@/lib/api";
import type { FootingRow, FootingSchedule } from "@/lib/types";
import { calcVolumeCy, downloadTextFile, scheduleToCsv } from "@/lib/utils";

interface TakeoffDemoProps {
  compact?: boolean;
}

interface PageCacheEntry {
  schedule: FootingSchedule;
  selectedMark: string | null;
  editedMarks: Set<string>;
}

function nextFootingMark(existing: FootingRow[]): string {
  const nums = existing
    .map((f) => f.mark.match(/^F(\d+)$/i)?.[1])
    .filter(Boolean)
    .map(Number);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : existing.length + 1;
  return `F${next}`;
}

export function TakeoffDemo({ compact }: TakeoffDemoProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<FootingSchedule | null>(null);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [editedMarks, setEditedMarks] = useState<Set<string>>(new Set());
  const [rendering, setRendering] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedPage, setCachedPage] = useState(false);
  const [cachedPageCount, setCachedPageCount] = useState(0);

  const pageCacheRef = useRef<Map<number, PageCacheEntry>>(new Map());

  const resetTakeoff = () => {
    setSchedule(null);
    setSelectedMark(null);
    setEditedMarks(new Set());
    setCachedPage(false);
  };

  const clearPageCache = () => {
    pageCacheRef.current.clear();
    setCachedPageCount(0);
  };

  // Keep cache in sync as user edits the current page
  useEffect(() => {
    if (schedule === null) return;
    pageCacheRef.current.set(page, {
      schedule,
      selectedMark,
      editedMarks: new Set(editedMarks),
    });
    setCachedPageCount(pageCacheRef.current.size);
  }, [page, schedule, selectedMark, editedMarks]);

  const restorePageFromCache = (pageIndex: number) => {
    const cached = pageCacheRef.current.get(pageIndex);
    if (cached) {
      setSchedule(cached.schedule);
      setSelectedMark(cached.selectedMark);
      setEditedMarks(new Set(cached.editedMarks));
      setCachedPage(true);
    } else {
      resetTakeoff();
    }
  };

  const loadPage = useCallback(async (f: File, pageIndex: number) => {
    setRendering(true);
    setError(null);
    try {
      const rendered = await renderPage(f, pageIndex);
      setImage(rendered.image);
      setPage(rendered.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to render page");
    } finally {
      setRendering(false);
    }
  }, []);

  const handleFileSelect = async (f: File) => {
    setFile(f);
    clearPageCache();
    resetTakeoff();
    setImage(null);
    setPage(0);
    setError(null);

    try {
      const info = await getPdfInfo(f);
      setPageCount(info.page_count);
      await loadPage(f, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read PDF");
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (!file || newPage === page) return;
    await loadPage(file, newPage);
    restorePageFromCache(newPage);
  };

  const handleExtract = async () => {
    if (!file) return;
    setExtracting(true);
    setError(null);
    setCachedPage(false);
    try {
      const result = await extractFootingSchedule(file, page);
      setSchedule(result);
      setEditedMarks(new Set());
      if (result.footings.length > 0) {
        setSelectedMark(result.footings[0].mark);
      } else {
        setSelectedMark(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const handleExport = () => {
    if (!schedule || schedule.footings.length === 0) return;
    const csv = scheduleToCsv(schedule.footings);
    const suffix = editedMarks.size > 0 ? "_reviewed" : "";
    downloadTextFile(csv, `footing_takeoff${suffix}.csv`);
  };

  const handleUpdateRow = (mark: string, field: keyof FootingRow, value: string | number) => {
    setSchedule((prev) => {
      if (!prev) return prev;
      const footings = prev.footings.map((row) => {
        if (row.mark !== mark) return row;
        const updated = { ...row };
        if (field === "rebar") {
          updated.rebar = String(value) || null;
        } else if (field === "mark") {
          updated.mark = String(value);
        } else {
          const num = typeof value === "number" ? value : parseFloat(value);
          if (Number.isNaN(num)) return row;
          updated[field] = num;
          updated.volume_cy = calcVolumeCy(updated.length_ft, updated.width_ft, updated.depth_ft);
        }
        return updated;
      });
      return { ...prev, footings };
    });
    setEditedMarks((prev) => new Set(prev).add(mark));
  };

  const handleAddRow = () => {
    setSchedule((prev) => {
      if (!prev) return prev;
      const mark = nextFootingMark(prev.footings);
      const newRow: FootingRow = {
        mark,
        length_ft: 4,
        width_ft: 4,
        depth_ft: 1,
        rebar: null,
        volume_cy: calcVolumeCy(4, 4, 1),
      };
      setSelectedMark(mark);
      setEditedMarks((s) => new Set(s).add(mark));
      return { ...prev, footings: [...prev.footings, newRow] };
    });
  };

  const handleDeleteRow = (mark: string) => {
    setSchedule((prev) => {
      if (!prev) return prev;
      const footings = prev.footings.filter((r) => r.mark !== mark);
      return { ...prev, footings };
    });
    setEditedMarks((prev) => {
      const next = new Set(prev);
      next.delete(mark);
      return next;
    });
    if (selectedMark === mark) {
      setSelectedMark(schedule?.footings.find((f) => f.mark !== mark)?.mark ?? null);
    }
  };

  const totalCy = schedule?.footings.reduce((s, f) => s + f.volume_cy, 0) ?? 0;
  const extractLabel = cachedPage ? "Re-extract" : "Extract Schedule";

  return (
    <div className={compact ? "" : "min-h-screen bg-zinc-950 text-zinc-100"}>
      {!compact && (
        <header className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link href="/" className="group">
              <h1 className="text-lg font-semibold tracking-tight group-hover:text-orange-400 transition-colors">
                Concrete Takeoff <span className="text-orange-500">Copilot</span>
              </h1>
              <p className="text-xs text-zinc-500">Extract, review, edit, export</p>
            </Link>
            {file && (
              <ActionButtons
                extracting={extracting}
                rendering={rendering}
                canExport={!!schedule && schedule.footings.length > 0}
                editedCount={editedMarks.size}
                extractLabel={extractLabel}
                onExtract={handleExtract}
                onExport={handleExport}
              />
            )}
          </div>
        </header>
      )}

      <div className={compact ? "" : "mx-auto max-w-7xl px-6 py-6"}>
        {compact && file && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-zinc-500">
              {schedule && schedule.footings.length > 0 && (
                <>
                  {schedule.footings.length} footings · {totalCy.toFixed(2)} CY total
                  {editedMarks.size > 0 && ` · ${editedMarks.size} edited`}
                  {" · "}
                </>
              )}
              {cachedPageCount > 0 && `${cachedPageCount} page${cachedPageCount !== 1 ? "s" : ""} saved`}
              {cachedPage && cachedPageCount > 0 && " · showing saved results"}
            </span>
            <ActionButtons
              extracting={extracting}
              rendering={rendering}
              canExport={!!schedule && schedule.footings.length > 0}
              editedCount={editedMarks.size}
              extractLabel={extractLabel}
              onExtract={handleExtract}
              onExport={handleExport}
            />
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!isApiAvailable ? (
          <div className={compact ? "mx-auto max-w-lg" : "mx-auto max-w-lg pt-12"}>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <p className="text-sm font-medium text-zinc-200">Run locally to try extraction</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Start the FastAPI backend on port 8000, then run this frontend at{" "}
                <code className="text-zinc-400">localhost:3002</code>. See the repo README for setup.
              </p>
              <a
                href="https://github.com/AravindMohan10/concrete-takeoff-copilot"
                className="mt-6 inline-block rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-500"
              >
                View setup on GitHub
              </a>
            </div>
          </div>
        ) : !file ? (
          <div className={compact ? "mx-auto max-w-lg" : "mx-auto max-w-lg pt-12"}>
            <UploadZone onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-4 lg:grid-cols-2 ${
              compact ? "min-h-[560px]" : "h-[calc(100vh-140px)]"
            }`}
          >
            <PdfViewer
              imageBase64={image}
              page={page}
              pageCount={pageCount}
              onPageChange={handlePageChange}
              loading={rendering}
              selectedMark={selectedMark}
              footingCount={schedule?.footings.length}
            />
            <FootingTable
              schedule={schedule}
              loading={extracting}
              selectedMark={selectedMark}
              editedMarks={editedMarks}
              cached={cachedPage}
              onSelectMark={setSelectedMark}
              onUpdateRow={handleUpdateRow}
              onAddRow={handleAddRow}
              onDeleteRow={handleDeleteRow}
            />
          </div>
        )}

        {file && (
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
            <span>{file.name}</span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                clearPageCache();
                resetTakeoff();
                setImage(null);
              }}
              className="text-zinc-500 hover:text-zinc-300"
            >
              Upload different file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButtons({
  extracting,
  rendering,
  canExport,
  editedCount,
  extractLabel,
  onExtract,
  onExport,
}: {
  extracting: boolean;
  rendering: boolean;
  canExport: boolean;
  editedCount: number;
  extractLabel: string;
  onExtract: () => void;
  onExport: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onExtract}
        disabled={extracting || rendering}
        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-40"
      >
        {extracting ? "Extracting…" : extractLabel}
      </button>
      <button
        type="button"
        onClick={onExport}
        disabled={!canExport || extracting}
        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
      >
        {editedCount > 0 ? "Export reviewed CSV" : "Export CSV"}
      </button>
    </div>
  );
}
