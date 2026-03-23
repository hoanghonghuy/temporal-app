import { describe, expect, it, vi } from "vitest";
import {
  loadSavedDayNotes,
  persistSavedDayNotes,
  removeSavedDayNote,
  upsertSavedDayNote,
} from "./saved-day-notes";

describe("saved day notes helpers", () => {
  it("upserts a trimmed note for the selected day", () => {
    const notes = upsertSavedDayNote([], new Date(2026, 2, 23), "  Keep the heart clear  ", new Date("2026-03-23T00:00:00.000Z"));

    expect(notes).toEqual([
      {
        dateKey: "2026-03-23",
        note: "Keep the heart clear",
        updatedAt: "2026-03-23T00:00:00.000Z",
      },
    ]);
  });

  it("replaces an existing note for the same day", () => {
    const notes = upsertSavedDayNote(
      [
        {
          dateKey: "2026-03-23",
          note: "Old",
          updatedAt: "2026-03-22T00:00:00.000Z",
        },
      ],
      new Date(2026, 2, 23),
      "New",
      new Date("2026-03-23T00:00:00.000Z")
    );

    expect(notes).toEqual([
      {
        dateKey: "2026-03-23",
        note: "New",
        updatedAt: "2026-03-23T00:00:00.000Z",
      },
    ]);
  });

  it("removes a note when the day is cleared", () => {
    const notes = removeSavedDayNote(
      [
        {
          dateKey: "2026-03-23",
          note: "Clear this",
          updatedAt: "2026-03-23T00:00:00.000Z",
        },
      ],
      new Date(2026, 2, 23)
    );

    expect(notes).toEqual([]);
  });

  it("loads safely from broken storage", () => {
    const storage = {
      getItem: vi.fn(() => "{broken"),
      setItem: vi.fn(),
    };

    expect(loadSavedDayNotes(storage)).toEqual([]);
  });

  it("persists sorted notes back to storage", () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };

    persistSavedDayNotes(
      [
        {
          dateKey: "2026-05-01",
          note: "Later",
          updatedAt: "2026-03-23T00:00:00.000Z",
        },
        {
          dateKey: "2026-03-24",
          note: "Sooner",
          updatedAt: "2026-03-23T00:00:00.000Z",
        },
      ],
      storage
    );

    expect(storage.setItem).toHaveBeenCalledWith(
      "temporal-day-notes",
      JSON.stringify([
        {
          dateKey: "2026-03-24",
          note: "Sooner",
          updatedAt: "2026-03-23T00:00:00.000Z",
        },
        {
          dateKey: "2026-05-01",
          note: "Later",
          updatedAt: "2026-03-23T00:00:00.000Z",
        },
      ])
    );
  });
});
