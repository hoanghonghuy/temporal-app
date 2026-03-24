package syncdata

import (
	"context"
	"errors"
	"testing"
	"time"

	"temporal-app/backend/internal/store"
)

type fakeRepository struct {
	createCountdownInput store.CountdownUpsertParams
}

func (f *fakeRepository) ListCountdowns(context.Context, string) ([]store.Countdown, error) {
	return nil, nil
}

func (f *fakeRepository) CreateCountdown(_ context.Context, params store.CountdownUpsertParams, now time.Time) (store.Countdown, error) {
	f.createCountdownInput = params
	return store.Countdown{
		ID:        "countdown-1",
		UserID:    params.UserID,
		Name:      params.Name,
		DateKey:   params.DateKey,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

func (f *fakeRepository) UpdateCountdown(context.Context, string, store.CountdownUpsertParams, time.Time) (store.Countdown, error) {
	return store.Countdown{}, nil
}

func (f *fakeRepository) DeleteCountdown(context.Context, string, string) error {
	return nil
}

func (f *fakeRepository) ListDayNotes(context.Context, string) ([]store.DayNote, error) {
	return nil, nil
}

func (f *fakeRepository) FindDayNote(context.Context, string, time.Time) (store.DayNote, error) {
	return store.DayNote{}, nil
}

func (f *fakeRepository) UpsertDayNote(context.Context, string, time.Time, string, time.Time) (store.DayNote, error) {
	return store.DayNote{}, nil
}

func (f *fakeRepository) DeleteDayNote(context.Context, string, time.Time) error {
	return nil
}

func (f *fakeRepository) ListFavoriteDays(context.Context, string) ([]store.FavoriteDay, error) {
	return nil, nil
}

func (f *fakeRepository) FindFavoriteDay(context.Context, string, time.Time) (store.FavoriteDay, error) {
	return store.FavoriteDay{}, nil
}

func (f *fakeRepository) UpsertFavoriteDay(context.Context, string, time.Time, time.Time) (store.FavoriteDay, error) {
	return store.FavoriteDay{}, nil
}

func (f *fakeRepository) DeleteFavoriteDay(context.Context, string, time.Time) error {
	return nil
}

func TestCreateCountdownNormalizesInput(t *testing.T) {
	repo := &fakeRepository{}
	service := NewService(repo)

	countdown, err := service.CreateCountdown(context.Background(), "user-1", "  Sinh nhat  ", "2026-08-09")
	if err != nil {
		t.Fatalf("expected countdown to be created, got error %v", err)
	}

	if repo.createCountdownInput.Name != "Sinh nhat" {
		t.Fatalf("expected name to be trimmed, got %q", repo.createCountdownInput.Name)
	}

	if repo.createCountdownInput.UserID != "user-1" {
		t.Fatalf("expected user id to be passed through, got %q", repo.createCountdownInput.UserID)
	}

	if store.FormatDateKey(repo.createCountdownInput.DateKey) != "2026-08-09" {
		t.Fatalf("expected date key 2026-08-09, got %s", store.FormatDateKey(repo.createCountdownInput.DateKey))
	}

	if countdown.ID == "" {
		t.Fatal("expected countdown response to include an id")
	}
}

func TestCreateCountdownRejectsInvalidDate(t *testing.T) {
	service := NewService(&fakeRepository{})
	_, err := service.CreateCountdown(context.Background(), "user-1", "Su kien", "2026-02-31")
	if !errors.Is(err, ErrInvalidDateKey) {
		t.Fatalf("expected invalid date key error, got %v", err)
	}
}
