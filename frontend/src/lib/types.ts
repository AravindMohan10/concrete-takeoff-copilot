export interface FootingRow {
  mark: string;
  length_ft: number;
  width_ft: number;
  depth_ft: number;
  rebar: string | null;
  volume_cy: number;
}

export interface FootingSchedule {
  sheet_title: string | null;
  scale: string | null;
  footings: FootingRow[];
  notes: string[];
  confidence: "low" | "medium" | "high";
  model_used: string | null;
  extraction_tier: "fast" | "strong" | null;
}

export interface PdfInfo {
  filename: string;
  page_count: number;
}

export interface RenderedPage {
  page: number;
  image: string;
}
