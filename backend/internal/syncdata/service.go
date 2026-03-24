package syncdata

import (
	"context"
	"errors"
	"strings"
	"time"

	"temporal-app/backend/internal/store"
)

var (
	ErrInvalidDateKey       = errors.New("sync: invalid date key")
	ErrInvalidCountdownName = errors.New("sync: countdown name is required")
	ErrInvalidCountdownID   = errors.New("sync: countdown id is required")
)

type Repository interface {
	ListCountdowns(ctx context.Context, userID string) ([]store.Countdown, error)
	CreateCountdown(ctx context.Context, params store.CountdownUpsertParams, now time.Time) (store.Countdown, error)
	UpdateCountdown(ctx context.Context, countdownID string, params store.CountdownUpsertParams, now time.Time) (store.Countdown, error)
	DeleteCountdown(ctx context.Context, userID string, countdownID string) error
	ListDayNotes(ctx context.Context, userID string) ([]store.DayNote, error)
	FindDayNote(ctx context.Context, userID string, dateKey time.Time) (store.DayNote, error)
	UpsertDayNote(ctx context.Context, userID string, dateKey time.Time, note string, now time.Time) (store.DayNote, error)
	DeleteDayNote(ctx context.Context, userID string, dateKey time.Time) error
	ListFavoriteDays(ctx context.Context, userID string) ([]store.FavoriteDay, error)
	FindFavoriteDay(ctx context.Context, userID string, dateKey time.Time) (store.FavoriteDay, error)
	UpsertFavoriteDay(ctx context.Context, userID string, dateKey time.Time, now time.Time) (store.FavoriteDay, error)
	DeleteFavoriteDay(ctx context.Context, userID string, dateKey time.Time) error
}

type Service struct {
	repo  Repository
	clock func() time.Time
}

func NewService(repo Repository) *Service {
	return &Service{
		repo:  repo,
		clock: time.Now,
	}
}

func (s *Service) ListCountdowns(ctx context.Context, userID string) ([]store.Countdown, error) {
	return s.repo.ListCountdowns(ctx, strings.TrimSpace(userID))
}

func (s *Service) CreateCountdown(ctx context.Context, userID string, name string, dateKey string) (store.Countdown, error) {
	parsedDate, err := parseDateKey(dateKey)
	if err != nil {
		return store.Countdown{}, err
	}

	normalizedName := strings.TrimSpace(name)
	if normalizedName == "" {
		return store.Countdown{}, ErrInvalidCountdownName
	}

	return s.repo.CreateCountdown(ctx, store.CountdownUpsertParams{
		UserID:  strings.TrimSpace(userID),
		Name:    normalizedName,
		DateKey: parsedDate,
	}, s.clock().UTC())
}

func (s *Service) UpdateCountdown(ctx context.Context, userID string, countdownID string, name string, dateKey string) (store.Countdown, error) {
	if strings.TrimSpace(countdownID) == "" {
		return store.Countdown{}, ErrInvalidCountdownID
	}

	parsedDate, err := parseDateKey(dateKey)
	if err != nil {
		return store.Countdown{}, err
	}

	normalizedName := strings.TrimSpace(name)
	if normalizedName == "" {
		return store.Countdown{}, ErrInvalidCountdownName
	}

	return s.repo.UpdateCountdown(ctx, strings.TrimSpace(countdownID), store.CountdownUpsertParams{
		UserID:  strings.TrimSpace(userID),
		Name:    normalizedName,
		DateKey: parsedDate,
	}, s.clock().UTC())
}

func (s *Service) DeleteCountdown(ctx context.Context, userID string, countdownID string) error {
	if strings.TrimSpace(countdownID) == "" {
		return ErrInvalidCountdownID
	}

	return s.repo.DeleteCountdown(ctx, strings.TrimSpace(userID), strings.TrimSpace(countdownID))
}

func (s *Service) ListDayNotes(ctx context.Context, userID string) ([]store.DayNote, error) {
	return s.repo.ListDayNotes(ctx, strings.TrimSpace(userID))
}

func (s *Service) GetDayNote(ctx context.Context, userID string, dateKey string) (store.DayNote, error) {
	parsedDate, err := parseDateKey(dateKey)
	if err != nil {
		return store.DayNote{}, err
	}

	return s.repo.FindDayNote(ctx, strings.TrimSpace(userID), parsedDate)
}

func (s *Service) PutDayNote(ctx context.Context, userID string, dateKey string, note string) (store.DayNote, error) {
	parsedDate, err := parseDateKey(dateKey)
	if err != nil {
		return store.DayNote{}, err
	}

	return s.repo.UpsertDayNote(ctx, strings.TrimSpace(userID), parsedDate, strings.TrimSpace(note), s.clock().UTC())
}

func (s *Service) DeleteDayNote(ctx context.Context, userID string, dateKey string) error {
	parsedDate, err := parseDateKey(dateKey)
	if err != nil {
		return err
	}

	return s.repo.DeleteDayNote(ctx, strings.TrimSpace(userID), parsedDate)
}

func (s *Service) ListFavoriteDays(ctx context.Context, userID string) ([]store.FavoriteDay, error) {
	return s.repo.ListFavoriteDays(ctx, strings.TrimSpace(userID))
}

func (s *Service) GetFavoriteDay(ctx context.Context, userID string, dateKey string) (store.FavoriteDay, error) {
	parsedDate, err := parseDateKey(dateKey)
	if err != nil {
		return store.FavoriteDay{}, err
	}

	return s.repo.FindFavoriteDay(ctx, strings.TrimSpace(userID), parsedDate)
}

func (s *Service) PutFavoriteDay(ctx context.Context, userID string, dateKey string) (store.FavoriteDay, error) {
	parsedDate, err := parseDateKey(dateKey)
	if err != nil {
		return store.FavoriteDay{}, err
	}

	return s.repo.UpsertFavoriteDay(ctx, strings.TrimSpace(userID), parsedDate, s.clock().UTC())
}

func (s *Service) DeleteFavoriteDay(ctx context.Context, userID string, dateKey string) error {
	parsedDate, err := parseDateKey(dateKey)
	if err != nil {
		return err
	}

	return s.repo.DeleteFavoriteDay(ctx, strings.TrimSpace(userID), parsedDate)
}

func parseDateKey(value string) (time.Time, error) {
	parsedDate, err := store.ParseDateKey(value)
	if err != nil {
		return time.Time{}, ErrInvalidDateKey
	}

	return parsedDate, nil
}
