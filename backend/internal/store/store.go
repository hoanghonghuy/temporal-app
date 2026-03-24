package store

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
)

const dateLayout = "2006-01-02"

var (
	ErrNotFound = errors.New("store: not found")
	ErrConflict = errors.New("store: conflict")
)

type Store struct {
	db *sql.DB
}

type User struct {
	ID          string
	Email       string
	DisplayName string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type UserCredentials struct {
	User
	PasswordHash string
}

type RefreshToken struct {
	ID        string
	UserID    string
	TokenHash string
	UserAgent string
	IPAddress string
	ExpiresAt time.Time
	CreatedAt time.Time
	RevokedAt *time.Time
}

type RefreshTokenWithUser struct {
	RefreshToken
	User User
}

type Countdown struct {
	ID        string
	UserID    string
	Name      string
	DateKey   time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

type DayNote struct {
	UserID    string
	DateKey   time.Time
	Note      string
	CreatedAt time.Time
	UpdatedAt time.Time
}

type FavoriteDay struct {
	UserID    string
	DateKey   time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

type CreateUserParams struct {
	Email        string
	PasswordHash string
	DisplayName  string
}

type CreateRefreshTokenParams struct {
	UserID    string
	TokenHash string
	UserAgent string
	IPAddress string
	ExpiresAt time.Time
}

type CountdownUpsertParams struct {
	UserID  string
	Name    string
	DateKey time.Time
}

func New(db *sql.DB) *Store {
	return &Store{db: db}
}

func (s *Store) FindUserByID(ctx context.Context, userID string) (User, error) {
	const query = `
		SELECT id, email, COALESCE(display_name, ''), created_at, updated_at
		FROM users
		WHERE id = $1
		LIMIT 1
	`

	var user User
	err := s.db.QueryRowContext(ctx, query, userID).Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	return user, mapError(err)
}

func (s *Store) FindUserByEmail(ctx context.Context, email string) (UserCredentials, error) {
	const query = `
		SELECT id, email, COALESCE(display_name, ''), password_hash, created_at, updated_at
		FROM users
		WHERE lower(email) = lower($1)
		LIMIT 1
	`

	var user UserCredentials
	err := s.db.QueryRowContext(ctx, query, strings.TrimSpace(email)).Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	return user, mapError(err)
}

func (s *Store) CreateUser(ctx context.Context, params CreateUserParams) (User, error) {
	const query = `
		INSERT INTO users (email, password_hash, display_name)
		VALUES (lower($1), $2, NULLIF($3, ''))
		RETURNING id, email, COALESCE(display_name, ''), created_at, updated_at
	`

	var user User
	err := s.db.QueryRowContext(ctx, query, strings.TrimSpace(params.Email), params.PasswordHash, strings.TrimSpace(params.DisplayName)).Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	return user, mapError(err)
}

func (s *Store) CreateRefreshToken(ctx context.Context, params CreateRefreshTokenParams) error {
	const query = `
		INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at)
		VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, '')::inet, $5)
	`

	_, err := s.db.ExecContext(
		ctx,
		query,
		params.UserID,
		params.TokenHash,
		strings.TrimSpace(params.UserAgent),
		strings.TrimSpace(params.IPAddress),
		params.ExpiresAt,
	)

	return mapError(err)
}

func (s *Store) FindActiveRefreshTokenByHash(ctx context.Context, tokenHash string, now time.Time) (RefreshTokenWithUser, error) {
	const query = `
		SELECT
			rt.id,
			rt.user_id,
			rt.token_hash,
			COALESCE(rt.user_agent, ''),
			COALESCE(host(rt.ip_address), ''),
			rt.expires_at,
			rt.created_at,
			rt.revoked_at,
			u.id,
			u.email,
			COALESCE(u.display_name, ''),
			u.created_at,
			u.updated_at
		FROM refresh_tokens rt
		INNER JOIN users u ON u.id = rt.user_id
		WHERE rt.token_hash = $1
		  AND rt.revoked_at IS NULL
		  AND rt.expires_at > $2
		LIMIT 1
	`

	var token RefreshTokenWithUser
	var revokedAt sql.NullTime

	err := s.db.QueryRowContext(ctx, query, tokenHash, now).Scan(
		&token.ID,
		&token.UserID,
		&token.TokenHash,
		&token.UserAgent,
		&token.IPAddress,
		&token.ExpiresAt,
		&token.CreatedAt,
		&revokedAt,
		&token.User.ID,
		&token.User.Email,
		&token.User.DisplayName,
		&token.User.CreatedAt,
		&token.User.UpdatedAt,
	)
	if err != nil {
		return RefreshTokenWithUser{}, mapError(err)
	}

	if revokedAt.Valid {
		token.RevokedAt = &revokedAt.Time
	}

	return token, nil
}

func (s *Store) RevokeRefreshTokenByHash(ctx context.Context, tokenHash string, revokedAt time.Time) error {
	const query = `
		UPDATE refresh_tokens
		SET revoked_at = $2
		WHERE token_hash = $1
		  AND revoked_at IS NULL
	`

	result, err := s.db.ExecContext(ctx, query, tokenHash, revokedAt)
	if err != nil {
		return mapError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (s *Store) ListCountdowns(ctx context.Context, userID string) ([]Countdown, error) {
	const query = `
		SELECT id, user_id, name, date_key, created_at, updated_at
		FROM countdowns
		WHERE user_id = $1
		ORDER BY date_key ASC, created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, mapError(err)
	}
	defer rows.Close()

	var countdowns []Countdown
	for rows.Next() {
		var countdown Countdown
		if err := rows.Scan(
			&countdown.ID,
			&countdown.UserID,
			&countdown.Name,
			&countdown.DateKey,
			&countdown.CreatedAt,
			&countdown.UpdatedAt,
		); err != nil {
			return nil, err
		}

		countdowns = append(countdowns, countdown)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return countdowns, nil
}

func (s *Store) CreateCountdown(ctx context.Context, params CountdownUpsertParams, now time.Time) (Countdown, error) {
	const query = `
		INSERT INTO countdowns (user_id, name, date_key, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $4)
		RETURNING id, user_id, name, date_key, created_at, updated_at
	`

	var countdown Countdown
	err := s.db.QueryRowContext(ctx, query, params.UserID, strings.TrimSpace(params.Name), params.DateKey, now).Scan(
		&countdown.ID,
		&countdown.UserID,
		&countdown.Name,
		&countdown.DateKey,
		&countdown.CreatedAt,
		&countdown.UpdatedAt,
	)

	return countdown, mapError(err)
}

func (s *Store) UpdateCountdown(ctx context.Context, countdownID string, params CountdownUpsertParams, now time.Time) (Countdown, error) {
	const query = `
		UPDATE countdowns
		SET name = $3, date_key = $4, updated_at = $5
		WHERE user_id = $1
		  AND id = $2
		RETURNING id, user_id, name, date_key, created_at, updated_at
	`

	var countdown Countdown
	err := s.db.QueryRowContext(ctx, query, params.UserID, countdownID, strings.TrimSpace(params.Name), params.DateKey, now).Scan(
		&countdown.ID,
		&countdown.UserID,
		&countdown.Name,
		&countdown.DateKey,
		&countdown.CreatedAt,
		&countdown.UpdatedAt,
	)

	return countdown, mapError(err)
}

func (s *Store) DeleteCountdown(ctx context.Context, userID string, countdownID string) error {
	const query = `
		DELETE FROM countdowns
		WHERE user_id = $1
		  AND id = $2
	`

	result, err := s.db.ExecContext(ctx, query, userID, countdownID)
	if err != nil {
		return mapError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (s *Store) ListDayNotes(ctx context.Context, userID string) ([]DayNote, error) {
	const query = `
		SELECT user_id, date_key, note, created_at, updated_at
		FROM day_notes
		WHERE user_id = $1
		ORDER BY date_key ASC
	`

	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, mapError(err)
	}
	defer rows.Close()

	var notes []DayNote
	for rows.Next() {
		var note DayNote
		if err := rows.Scan(&note.UserID, &note.DateKey, &note.Note, &note.CreatedAt, &note.UpdatedAt); err != nil {
			return nil, err
		}

		notes = append(notes, note)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return notes, nil
}

func (s *Store) FindDayNote(ctx context.Context, userID string, dateKey time.Time) (DayNote, error) {
	const query = `
		SELECT user_id, date_key, note, created_at, updated_at
		FROM day_notes
		WHERE user_id = $1
		  AND date_key = $2
		LIMIT 1
	`

	var note DayNote
	err := s.db.QueryRowContext(ctx, query, userID, dateKey).Scan(&note.UserID, &note.DateKey, &note.Note, &note.CreatedAt, &note.UpdatedAt)
	return note, mapError(err)
}

func (s *Store) UpsertDayNote(ctx context.Context, userID string, dateKey time.Time, note string, now time.Time) (DayNote, error) {
	const query = `
		INSERT INTO day_notes (user_id, date_key, note, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $4)
		ON CONFLICT (user_id, date_key)
		DO UPDATE SET
			note = EXCLUDED.note,
			updated_at = EXCLUDED.updated_at
		RETURNING user_id, date_key, note, created_at, updated_at
	`

	var savedNote DayNote
	err := s.db.QueryRowContext(ctx, query, userID, dateKey, strings.TrimSpace(note), now).Scan(
		&savedNote.UserID,
		&savedNote.DateKey,
		&savedNote.Note,
		&savedNote.CreatedAt,
		&savedNote.UpdatedAt,
	)

	return savedNote, mapError(err)
}

func (s *Store) DeleteDayNote(ctx context.Context, userID string, dateKey time.Time) error {
	const query = `
		DELETE FROM day_notes
		WHERE user_id = $1
		  AND date_key = $2
	`

	result, err := s.db.ExecContext(ctx, query, userID, dateKey)
	if err != nil {
		return mapError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (s *Store) ListFavoriteDays(ctx context.Context, userID string) ([]FavoriteDay, error) {
	const query = `
		SELECT user_id, date_key, created_at, updated_at
		FROM favorite_days
		WHERE user_id = $1
		ORDER BY date_key ASC
	`

	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, mapError(err)
	}
	defer rows.Close()

	var days []FavoriteDay
	for rows.Next() {
		var day FavoriteDay
		if err := rows.Scan(&day.UserID, &day.DateKey, &day.CreatedAt, &day.UpdatedAt); err != nil {
			return nil, err
		}

		days = append(days, day)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return days, nil
}

func (s *Store) FindFavoriteDay(ctx context.Context, userID string, dateKey time.Time) (FavoriteDay, error) {
	const query = `
		SELECT user_id, date_key, created_at, updated_at
		FROM favorite_days
		WHERE user_id = $1
		  AND date_key = $2
		LIMIT 1
	`

	var day FavoriteDay
	err := s.db.QueryRowContext(ctx, query, userID, dateKey).Scan(&day.UserID, &day.DateKey, &day.CreatedAt, &day.UpdatedAt)
	return day, mapError(err)
}

func (s *Store) UpsertFavoriteDay(ctx context.Context, userID string, dateKey time.Time, now time.Time) (FavoriteDay, error) {
	const query = `
		INSERT INTO favorite_days (user_id, date_key, created_at, updated_at)
		VALUES ($1, $2, $3, $3)
		ON CONFLICT (user_id, date_key)
		DO UPDATE SET updated_at = EXCLUDED.updated_at
		RETURNING user_id, date_key, created_at, updated_at
	`

	var day FavoriteDay
	err := s.db.QueryRowContext(ctx, query, userID, dateKey, now).Scan(&day.UserID, &day.DateKey, &day.CreatedAt, &day.UpdatedAt)
	return day, mapError(err)
}

func (s *Store) DeleteFavoriteDay(ctx context.Context, userID string, dateKey time.Time) error {
	const query = `
		DELETE FROM favorite_days
		WHERE user_id = $1
		  AND date_key = $2
	`

	result, err := s.db.ExecContext(ctx, query, userID, dateKey)
	if err != nil {
		return mapError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func FormatDateKey(dateKey time.Time) string {
	return dateKey.UTC().Format(dateLayout)
}

func ParseDateKey(value string) (time.Time, error) {
	return time.Parse(dateLayout, strings.TrimSpace(value))
}

func mapError(err error) error {
	if err == nil {
		return nil
	}

	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return ErrConflict
	}

	return err
}
