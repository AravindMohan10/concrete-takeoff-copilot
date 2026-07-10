import type { FootingSchedule, PdfInfo, RenderedPage } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

export const isApiAvailable = Boolean(API_BASE);

function requireApi(): string {
  if (!API_BASE) {
    throw new Error(
      "Backend not configured. Start the FastAPI server locally and set NEXT_PUBLIC_API_URL in frontend/.env.local."
    );
  }
  return API_BASE;
}

function apiHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  const token = process.env.NEXT_PUBLIC_DEMO_ACCESS_TOKEN;
  if (token) headers["X-Demo-Token"] = token;
  return headers;
}

async function postForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${requireApi()}${path}`, {
    method: "POST",
    headers: apiHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail));
  }

  return res.json();
}

export async function getPdfInfo(file: File): Promise<PdfInfo> {
  const form = new FormData();
  form.append("file", file);
  return postForm<PdfInfo>("/api/pdf/info", form);
}

export async function renderPage(file: File, page: number): Promise<RenderedPage> {
  const form = new FormData();
  form.append("file", file);
  form.append("page", String(page));
  return postForm<RenderedPage>("/api/pdf/render", form);
}

export async function extractFootingSchedule(file: File, page: number): Promise<FootingSchedule> {
  const form = new FormData();
  form.append("file", file);
  form.append("page", String(page));
  return postForm<FootingSchedule>("/api/extract/footing-schedule", form);
}

export async function downloadCsv(file: File, page: number): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  form.append("page", String(page));

  const res = await fetch(`${requireApi()}/api/export/csv`, {
    method: "POST",
    headers: apiHeaders(),
    body: form,
  });

  if (!res.ok) {
    throw new Error("CSV export failed");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "footing_takeoff.csv";
  a.click();
  URL.revokeObjectURL(url);
}
