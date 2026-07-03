import type { FootingRow } from "./types";

export function calcVolumeCy(lengthFt: number, widthFt: number, depthFt: number): number {
  return Math.round(((lengthFt * widthFt * depthFt) / 27) * 100) / 100;
}

export function scheduleToCsv(footings: FootingRow[]): string {
  const lines = ["mark,length_ft,width_ft,depth_ft,volume_cy,rebar"];
  for (const f of footings) {
    const rebar = (f.rebar ?? "").replace(/,/g, ";");
    lines.push(`${f.mark},${f.length_ft},${f.width_ft},${f.depth_ft},${f.volume_cy},${rebar}`);
  }
  const total = footings.reduce((sum, f) => sum + f.volume_cy, 0);
  lines.push(`TOTAL,,,,${Math.round(total * 100) / 100},`);
  return lines.join("\n") + "\n";
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
