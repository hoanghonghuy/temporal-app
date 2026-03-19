import { describe, expect, it, vi } from "vitest";
import {
  createSavedCountdownEvent,
  findDuplicateSavedCountdownEvent,
  fromDateKey,
  loadSavedCountdownEvents,
  normalizeSavedCountdownName,
  persistSavedCountdownEvents,
  sanitizeSavedCountdownEvents,
  toDateKey,
} from "./saved-countdowns";

describe("saved countdown helpers", () => {
  it("round-trips local date keys without timezone drift", () => {
    const sourceDate = new Date(2026, 2, 19, 16, 45, 12);
    const dateKey = toDateKey(sourceDate);
    const restoredDate = fromDateKey(dateKey);

    expect(dateKey).toBe("2026-03-19");
    expect(restoredDate).not.toBeNull();
    expect(restoredDate?.getFullYear()).toBe(2026);
    expect(restoredDate?.getMonth()).toBe(2);
    expect(restoredDate?.getDate()).toBe(19);
  });

  it("sanitizes invalid payloads and sorts by nearest date first", () => {
    const savedEvents = sanitizeSavedCountdownEvents([
      {
        id: "far",
        name: "Far event",
        dateKey: "2026-12-01",
        createdAt: "2026-03-19T10:00:00.000Z",
      },
      {
        id: "near",
        name: "Near event",
        dateKey: "2026-04-01",
        createdAt: "2026-03-19T09:00:00.000Z",
      },
      {
        id: "invalid-date",
        name: "Broken",
        dateKey: "2026-13-40",
        createdAt: "2026-03-19T08:00:00.000Z",
      },
      "invalid-row",
    ]);

    expect(savedEvents.map((event) => event.id)).toEqual(["near", "far"]);
  });

  it("normalizes blank names with a localized fallback", () => {
    expect(normalizeSavedCountdownName("   ", "Su kien")).toBe("Su kien");
    expect(normalizeSavedCountdownName("  Tet  ", "Su kien")).toBe("Tet");
  });

  it("detects duplicates by normalized name and date", () => {
    const savedEvents = [
      createSavedCountdownEvent("Tet Nguyen Dan", new Date(2026, 1, 17), "Su kien", new Date("2026-03-19T00:00:00.000Z")),
    ];

    const duplicate = findDuplicateSavedCountdownEvent(
      savedEvents,
      "  tet nguyen dan ",
      new Date(2026, 1, 17),
      "Su kien"
    );

    expect(duplicate?.name).toBe("Tet Nguyen Dan");
  });

  it("loads safely from broken storage payloads", () => {
    const storage = {
      getItem: vi.fn(() => "{broken"),
      setItem: vi.fn(),
    };

    expect(loadSavedCountdownEvents(storage)).toEqual([]);
  });

  it("persists sorted events back to storage", () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };

    persistSavedCountdownEvents(
      [
        {
          id: "late",
          name: "Late",
          dateKey: "2026-08-01",
          createdAt: "2026-03-19T10:00:00.000Z",
        },
        {
          id: "soon",
          name: "Soon",
          dateKey: "2026-04-01",
          createdAt: "2026-03-19T11:00:00.000Z",
        },
      ],
      storage
    );

    expect(storage.setItem).toHaveBeenCalledWith(
      "temporal-saved-countdowns",
      JSON.stringify([
        {
          id: "soon",
          name: "Soon",
          dateKey: "2026-04-01",
          createdAt: "2026-03-19T11:00:00.000Z",
        },
        {
          id: "late",
          name: "Late",
          dateKey: "2026-08-01",
          createdAt: "2026-03-19T10:00:00.000Z",
        },
      ])
    );
  });
});
