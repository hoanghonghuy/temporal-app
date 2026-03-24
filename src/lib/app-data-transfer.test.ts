import { describe, expect, it, vi } from "vitest";
import {
  applyTemporalDataBundle,
  createTemporalDataBundle,
  createTemporalDataBundleFromSnapshot,
  getTemporalDataBundleCounts,
  getTemporalDataFilename,
  parseTemporalDataBundle,
} from "./app-data-transfer";

describe("app data transfer", () => {
  it("creates a bundle from local storage-backed data", () => {
    const storage = {
      getItem: vi.fn((key: string) => {
        if (key === "temporal-history") {
          return JSON.stringify([{ id: "1", type: "Tool", result: "Done", timestamp: "23/03/2026, 13:00:00" }]);
        }
        if (key === "temporal-saved-countdowns") {
          return JSON.stringify([{ id: "a", name: "Tet", dateKey: "2026-02-17", createdAt: "2026-03-23T00:00:00.000Z" }]);
        }
        if (key === "temporal-day-notes") {
          return JSON.stringify([{ dateKey: "2026-03-23", note: "Quiet mind", updatedAt: "2026-03-23T00:00:00.000Z" }]);
        }
        if (key === "temporal-favorite-days") {
          return JSON.stringify([{ dateKey: "2026-03-24", updatedAt: "2026-03-23T00:00:00.000Z" }]);
        }
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    const bundle = createTemporalDataBundle(storage, new Date("2026-03-23T01:02:03.000Z"));

    expect(bundle.data.history).toHaveLength(1);
    expect(bundle.data.savedCountdowns).toHaveLength(1);
    expect(bundle.data.savedDayNotes).toHaveLength(1);
    expect(bundle.data.savedFavoriteDays).toHaveLength(1);
    expect(getTemporalDataBundleCounts(bundle)).toEqual({
      history: 1,
      savedCountdowns: 1,
      savedDayNotes: 1,
      savedFavoriteDays: 1,
    });
    expect(getTemporalDataFilename(bundle)).toBe("temporal-data-2026-03-23T01-02-03Z.json");
  });

  it("parses and sanitizes imported bundles", () => {
    const bundle = parseTemporalDataBundle({
      app: "temporal",
      version: 1,
      exportedAt: "2026-03-23T01:02:03.000Z",
      data: {
        history: [{ id: "1", type: "Tool", result: "Done", timestamp: "23/03/2026" }],
        savedCountdowns: [{ id: "a", name: "Tet", dateKey: "2026-02-17", createdAt: "2026-03-23T00:00:00.000Z" }],
        savedDayNotes: [{ dateKey: "2026-03-23", note: "  Quiet mind  ", updatedAt: "2026-03-23T00:00:00.000Z" }],
        savedFavoriteDays: [{ dateKey: "2026-03-24", updatedAt: "2026-03-23T00:00:00.000Z" }],
      },
    });

    expect(bundle).not.toBeNull();
    expect(bundle?.data.savedDayNotes[0]?.note).toBe("Quiet mind");
  });

  it("creates a bundle from an explicit snapshot", () => {
    const bundle = createTemporalDataBundleFromSnapshot(
      {
        history: [{ id: "1", type: "Tool", result: "Done", timestamp: "23/03/2026" }],
        savedCountdowns: [{ id: "a", name: "Tet", dateKey: "2026-02-17", createdAt: "2026-03-23T00:00:00.000Z" }],
        savedDayNotes: [{ dateKey: "2026-03-23", note: "  Quiet mind  ", updatedAt: "2026-03-23T00:00:00.000Z" }],
        savedFavoriteDays: [{ dateKey: "2026-03-24", updatedAt: "2026-03-23T00:00:00.000Z" }],
      },
      new Date("2026-03-23T01:02:03.000Z")
    );

    expect(bundle.data.savedDayNotes[0]?.note).toBe("Quiet mind");
    expect(bundle.exportedAt).toBe("2026-03-23T01:02:03.000Z");
  });

  it("applies imported bundles back to storage", () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    applyTemporalDataBundle(
      {
        app: "temporal",
        version: 1,
        exportedAt: "2026-03-23T01:02:03.000Z",
        data: {
          history: [{ id: "1", type: "Tool", result: "Done", timestamp: "23/03/2026" }],
          savedCountdowns: [{ id: "a", name: "Tet", dateKey: "2026-02-17", createdAt: "2026-03-23T00:00:00.000Z" }],
          savedDayNotes: [{ dateKey: "2026-03-23", note: "Quiet mind", updatedAt: "2026-03-23T00:00:00.000Z" }],
          savedFavoriteDays: [{ dateKey: "2026-03-24", updatedAt: "2026-03-23T00:00:00.000Z" }],
        },
      },
      storage
    );

    expect(storage.setItem).toHaveBeenCalledTimes(4);
  });
});
