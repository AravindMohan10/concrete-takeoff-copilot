"use client";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-10 transition-colors ${
        disabled
          ? "cursor-not-allowed border-zinc-700 bg-zinc-900/50 opacity-50"
          : "border-zinc-600 bg-zinc-900 hover:border-orange-500/60 hover:bg-zinc-900/80"
      }`}
    >
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
      <div className="mb-3 text-3xl">📄</div>
      <p className="text-sm font-medium text-zinc-200">Drop a structural PDF here</p>
      <p className="mt-1 text-xs text-zinc-500">Foundation plans with footing schedules work best</p>
    </label>
  );
}
