import { describe, expect, it } from "vitest";
import {
  createSyncedDataSignature,
  getSyncedDataSnapshotCounts,
  hasSyncedData,
  mergeSyncedDataSnapshots,
} from "./synced-data";

describe("synced data helpers", () => {
  it("merges countdowns without duplicating the same day and name", () => {
    const mergedSnapshot = mergeSyncedDataSnapshots(
      {
        savedCountdowns: [
          {
            id: "local-1",
            name: "Tet Nguyen Dan",
            dateKey: "2026-02-17",
            createdAt: "2026-03-24T09:00:00.000Z",
          },
        ],
        savedDayNotes: [],
        savedFavoriteDays: [],
      },
      {
        savedCountdowns: [
          {
            id: "cloud-1",
            name: " tet nguyen dan ",
            dateKey: "2026-02-17",
            createdAt: "2026-03-24T08:00:00.000Z",
          },
          {
            id: "cloud-2",
            name: "Vu Lan",
            dateKey: "2026-08-26",
            createdAt: "2026-03-24T07:00:00.000Z",
          },
        ],
        savedDayNotes: [],
        savedFavoriteDays: [],
      }
    );

    expect(mergedSnapshot.savedCountdowns).toHaveLength(2);
    expect(mergedSnapshot.savedCountdowns.map((savedEvent) => savedEvent.name)).toEqual([
      "Tet Nguyen Dan",
      "Vu Lan",
    ]);
  });

  it("keeps the newer day note when both sides wrote to the same day", () => {
    const mergedSnapshot = mergeSyncedDataSnapshots(
      {
        savedCountdowns: [],
        savedDayNotes: [
          {
            dateKey: "2026-03-24",
            note: "Breathe slowly",
            updatedAt: "2026-03-24T10:00:00.000Z",
          },
        ],
        savedFavoriteDays: [],
      },
      {
        savedCountdowns: [],
        savedDayNotes: [
          {
            dateKey: "2026-03-24",
            note: "Read quietly",
            updatedAt: "2026-03-24T11:00:00.000Z",
          },
        ],
        savedFavoriteDays: [],
      }
    );

    expect(mergedSnapshot.savedDayNotes).toEqual([
      {
        dateKey: "2026-03-24",
        note: "Read quietly",
        updatedAt: "2026-03-24T11:00:00.000Z",
      },
    ]);
  });

  it("unions favorite days and reports signature/counts from the merged snapshot", () => {
    const mergedSnapshot = mergeSyncedDataSnapshots(
      {
        savedCountdowns: [],
        savedDayNotes: [],
        savedFavoriteDays: [
          {
            dateKey: "2026-03-24",
            updatedAt: "2026-03-24T08:00:00.000Z",
          },
        ],
      },
      {
        savedCountdowns: [],
        savedDayNotes: [],
        savedFavoriteDays: [
          {
            dateKey: "2026-03-25",
            updatedAt: "2026-03-24T09:00:00.000Z",
          },
        ],
      }
    );

    expect(getSyncedDataSnapshotCounts(mergedSnapshot)).toEqual({
      savedCountdowns: 0,
      savedDayNotes: 0,
      savedFavoriteDays: 2,
    });
    expect(hasSyncedData(mergedSnapshot)).toBe(true);
    expect(createSyncedDataSignature(mergedSnapshot)).toContain("2026-03-24");
    expect(createSyncedDataSignature(mergedSnapshot)).toContain("2026-03-25");
  });
});
