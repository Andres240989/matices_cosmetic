import { describe, expect, it } from "vitest";
import { INGESTION_LIMITS, findUploadLimitError } from "@/contracts/ingestion";
import { InputLimitError, loadInventory } from "@/pipeline/load-inventory";

const MAX = INGESTION_LIMITS.maxTotalBytes;

describe("findUploadLimitError", () => {
  it("accepts uploads up to 4 MB in total", () => {
    expect(findUploadLimitError([{ name: "a.csv", size: MAX }])).toBeNull();
    expect(findUploadLimitError([{ name: "a.csv", size: MAX - 1 }])).toBeNull();
  });

  it("rejects one byte above 4 MB, even split across files", () => {
    const files = [
      { name: "a.csv", size: MAX / 2 },
      { name: "b.csv", size: MAX / 2 + 1 },
    ];
    expect(findUploadLimitError(files)).toContain("4 MB");
  });

  it("rejects an empty upload and more than 10 files", () => {
    expect(findUploadLimitError([])).toContain("al menos un archivo");
    const eleven = Array.from({ length: 11 }, (_, i) => ({ name: `${i}.csv`, size: 1 }));
    expect(findUploadLimitError(eleven)).toContain("Máximo 10");
  });
});

describe("loadInventory", () => {
  it("refuses uploads over the limit before reading them", async () => {
    const big = { fileName: "grande.csv", bytes: new Uint8Array(MAX + 1) };
    await expect(loadInventory([big])).rejects.toBeInstanceOf(InputLimitError);
  });
});
