import { describe, expect, it } from "vitest";
import { calcVolumeCy, scheduleToCsv } from "./utils";
import type { FootingRow } from "./types";

describe("calcVolumeCy", () => {
  it("computes cubic yards from feet dimensions", () => {
    expect(calcVolumeCy(4, 4, 1)).toBe(0.59);
    expect(calcVolumeCy(5, 5, 1.5)).toBe(1.39);
  });
});

describe("scheduleToCsv", () => {
  it("exports rows and total CY", () => {
    const footings: FootingRow[] = [
      { mark: "F1", length_ft: 4, width_ft: 4, depth_ft: 1, rebar: null, volume_cy: 0.59 },
      { mark: "F2", length_ft: 5, width_ft: 5, depth_ft: 1.5, rebar: "#5 @ 10", volume_cy: 1.39 },
    ];
    const csv = scheduleToCsv(footings);
    expect(csv).toContain("mark,length_ft,width_ft,depth_ft,volume_cy,rebar");
    expect(csv).toContain("F1,4,4,1,0.59,");
    expect(csv).toContain("TOTAL,,,,1.98,");
  });
});
