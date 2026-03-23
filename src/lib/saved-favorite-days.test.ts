import { describe, expect, it, vi } from "vitest";
import {
  loadSavedFavoriteDays,
  persistSavedFavoriteDays,
  toggleSavedFavoriteDay,
} from "./saved-favorite-days";

describe("saved favorite days helpers", () => {
  it("adds a favorite day when toggled on", () => {
    const days = toggleSavedFavoriteDay([], new Date(2026, 2, 23), new Date("2026-03-23T00:00:00.000Z"));

    expect(days).toEqual([
      {
        dateKey: "2026-03-23",
        updatedAt: "2026-03-23T00:00:00.000Z",
      },
    ]);
  });

  it("removes a favorite day when toggled again", () => {
    const days = toggleSavedFavoriteDay(
      [
        {
          dateKey: "2026-03-23",
          updatedAt: "2026-03-23T00:00:00.000Z",
        },
      ],
      new Date(2026, 2, 23),
      new Date("2026-03-24T00:00:00.000Z")
    );

    expect(days).toEqual([]);
  });

  it("loads safely from broken storage", () => {
    const storage = {
      getItem: vi.fn(() => "{broken"),
      setItem: vi.fn(),
    };

    expect(loadSavedFavoriteDays(storage)).toEqual([]);
  });

  it("persists sorted favorite days back to storage", () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };

    persistSavedFavoriteDays(
      [
        {
          dateKey: "2026-05-01",
          updatedAt: "2026-03-23T00:00:00.000Z",
        },
        {
          dateKey: "2026-03-24",
          updatedAt: "2026-03-23T00:00:00.000Z",
        },
      ],
      storage
    );

    expect(storage.setItem).toHaveBeenCalledWith(
      "temporal-favorite-days",
      JSON.stringify([
        {
          dateKey: "2026-03-24",
          updatedAt: "2026-03-23T00:00:00.000Z",
        },
        {
          dateKey: "2026-05-01",
          updatedAt: "2026-03-23T00:00:00.000Z",
        },
      ])
    );
  });
});
