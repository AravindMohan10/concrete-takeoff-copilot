"use client";

import { calcVolumeCy } from "@/lib/utils";
import type { FootingRow, FootingSchedule } from "@/lib/types";

interface FootingTableProps {
  schedule: FootingSchedule | null;
  loading?: boolean;
  selectedMark: string | null;
  editedMarks: Set<string>;
  cached?: boolean;
  onSelectMark: (mark: string) => void;
  onUpdateRow: (mark: string, field: keyof FootingRow, value: string | number) => void;
  onAddRow: () => void;
  onDeleteRow: (mark: string) => void;
}

function confidenceColor(c: string) {
  if (c === "high") return "text-emerald-400 bg-emerald-400/10";
  if (c === "low") return "text-amber-400 bg-amber-400/10";
  return "text-zinc-400 bg-zinc-400/10";
}

function EditableCell({
  value,
  onChange,
  type = "text",
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: "text" | "number";
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-w-[3rem] rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-zinc-300 hover:border-zinc-700 focus:border-orange-500/50 focus:bg-zinc-900 focus:outline-none"
    />
  );
}

export function FootingTable({
  schedule,
  loading,
  selectedMark,
  editedMarks,
  cached,
  onSelectMark,
  onUpdateRow,
  onAddRow,
  onDeleteRow,
}: FootingTableProps) {
  const totalCy = schedule?.footings.reduce((sum, f) => sum + f.volume_cy, 0) ?? 0;

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Takeoff</span>
          {schedule && schedule.footings.length > 0 && (
            <span className="text-xs text-zinc-600">
              {schedule.footings.length} footing{schedule.footings.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {cached && schedule && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              saved
            </span>
          )}
          {schedule && schedule.footings.length > 0 && (
            <button
              type="button"
              onClick={onAddRow}
              className="rounded px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              + Add row
            </button>
          )}
          {schedule?.extraction_tier === "strong" && (
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-300">
              enhanced read
            </span>
          )}
          {schedule && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${confidenceColor(schedule.confidence)}`}>
              {schedule.confidence} confidence
            </span>
          )}
        </div>
      </div>

      {schedule && schedule.footings.length > 0 && (
        <div className="border-b border-zinc-800/60 bg-zinc-900/40 px-4 py-2 text-xs text-zinc-500">
          Click a row to select it. Edit any cell to override extracted values before export.
        </div>
      )}

      <div className="flex-1 overflow-auto p-3">
        {loading && (
          <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
            Reading footing schedule…
          </div>
        )}

        {!loading && !schedule && (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-zinc-600">
            <span>Run extraction to see quantities</span>
            <span className="text-xs text-zinc-700">Find the sheet labeled FOOTING SCHEDULE first</span>
          </div>
        )}

        {!loading && schedule && schedule.footings.length === 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
            No footing schedule found on this page. Try another page. Schedules are usually on S1.x sheets.
          </div>
        )}

        {!loading && schedule && schedule.footings.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                <th className="pb-2 pr-2">Mark</th>
                <th className="pb-2 pr-2">L (ft)</th>
                <th className="pb-2 pr-2">W (ft)</th>
                <th className="pb-2 pr-2">D (ft)</th>
                <th className="pb-2 pr-2">CY</th>
                <th className="pb-2 pr-2">Rebar</th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {schedule.footings.map((f) => {
                const selected = selectedMark === f.mark;
                const edited = editedMarks.has(f.mark);
                return (
                  <tr
                    key={f.mark}
                    onClick={() => onSelectMark(f.mark)}
                    className={`cursor-pointer border-b border-zinc-900 transition-colors ${
                      selected
                        ? "bg-orange-500/10 ring-1 ring-inset ring-orange-500/30"
                        : "hover:bg-zinc-900/60"
                    }`}
                  >
                    <td className="py-1.5 pr-2">
                      <span className="font-mono font-medium text-orange-400">{f.mark}</span>
                      {edited && (
                        <span className="ml-1 rounded bg-amber-500/15 px-1 text-[10px] text-amber-400">
                          edited
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 pr-2" onClick={(e) => e.stopPropagation()}>
                      <EditableCell
                        type="number"
                        value={f.length_ft}
                        onChange={(v) => onUpdateRow(f.mark, "length_ft", v)}
                      />
                    </td>
                    <td className="py-1.5 pr-2" onClick={(e) => e.stopPropagation()}>
                      <EditableCell
                        type="number"
                        value={f.width_ft}
                        onChange={(v) => onUpdateRow(f.mark, "width_ft", v)}
                      />
                    </td>
                    <td className="py-1.5 pr-2" onClick={(e) => e.stopPropagation()}>
                      <EditableCell
                        type="number"
                        value={f.depth_ft}
                        onChange={(v) => onUpdateRow(f.mark, "depth_ft", v)}
                      />
                    </td>
                    <td className="py-1.5 pr-2 font-medium text-zinc-100">
                      {calcVolumeCy(f.length_ft, f.width_ft, f.depth_ft)}
                    </td>
                    <td className="py-1.5 pr-2" onClick={(e) => e.stopPropagation()}>
                      <EditableCell
                        value={f.rebar ?? ""}
                        onChange={(v) => onUpdateRow(f.mark, "rebar", v)}
                      />
                    </td>
                    <td className="py-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onDeleteRow(f.mark)}
                        className="text-zinc-600 hover:text-red-400"
                        title="Remove row"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="text-zinc-100">
                <td colSpan={4} className="pt-3 text-xs uppercase tracking-wider text-zinc-500">
                  Total concrete
                </td>
                <td className="pt-3 font-semibold text-orange-400">{totalCy.toFixed(2)} CY</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}

        {schedule?.notes && schedule.notes.length > 0 && (
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <p className="mb-1 text-xs uppercase tracking-wider text-zinc-500">Notes from sheet</p>
            <ul className="list-inside list-disc text-xs text-zinc-400">
              {schedule.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
