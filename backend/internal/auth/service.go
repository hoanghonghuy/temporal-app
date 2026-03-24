package auth

import (
	"context"
	"errors"
	"net/mail"
	"strings"
	"time"

	"temporal-app/backend/internal/store"
)

var (
	ErrInvalidEmail        = errors.New("auth: invalid email")
	ErrWeakPassword        = errors.New("auth: password must be at least 8 characters")
	ErrInvalidDisplayName  = errors.New("auth: display name is too long")
	ErrEmailTaken          = errors.New("auth: email already exists")
	ErrInvalidCredentials  = errors.New("auth: invalid credentials")
	ErrInvalidRefreshToken = errors.New("auth: invalid refresh token")
	ErrTokenSecretMissing  = errors.New("auth: access token configuration missing")
)

type SessionMetadata struct {
	UserAgent string
	IPAddress string
}

type Session struct {
	AccessToken     string
	RefreshToken    string
	AccessExpiresAt time.Time
	AccessExpiresIn int64
	User            store.User
}

type Repository interface {
	FindUserByID(ctx context.Context, userID string) (store.User, error)
	FindUserByEmail(ctx context.Context, email string) (store.UserCredentials, error)
	CreateUser(ctx context.Context, params store.CreateUserParams) (store.User, error)
	CreateRefreshToken(ctx context.Context, params store.CreateRefreshTokenParams) error
	FindActiveRefreshTokenByHash(ctx context.Context, tokenHash string, now time.Time) (store.RefreshTokenWithUser, error)
	RevokeRefreshTokenByHash(ctx context.Context, tokenHash string, revokedAt time.Time) error
}

type Service struct {
	repo            Repository
	tokenManager    *TokenManager
	clock           func() time.Time
	refreshTokenTTL time.Duration
}

func NewService(repo Repository, tokenManager *TokenManager, refreshTokenTTL time.Duration) *Service {
	return &Service{
		repo:            repo,
		tokenManager:    tokenManager,
		clock:           time.Now,
		refreshTokenTTL: refreshTokenTTL,
	}
}

func (s *Service) Register(ctx context.Context, email string, password string, displayName string, metadata SessionMetadata) (Session, error) {
	normalizedEmail, normalizedDisplayName, err := normalizeRegistrationInput(email, displayName)
	if err != nil {
		return Session{}, err
	}

	if len(password) < 8 {
		return Session{}, ErrWeakPassword
	}

	passwordHash, err := hashPassword(password)
	if err != nil {
		return Session{}, err
	}

	user, err := s.repo.CreateUser(ctx, store.CreateUserParams{
		Email:        normalizedEmail,
		PasswordHash: passwordHash,
		DisplayName:  normalizedDisplayName,
	})
	if err != nil {
		if errors.Is(err, store.ErrConflict) {
			return Session{}, ErrEmailTaken
		}

		return Session{}, err
	}

	return s.issueSession(ctx, user, metadata)
}

func (s *Service) Login(ctx context.Context, email string, password string, metadata SessionMetadata) (Session, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	if normalizedEmail == "" {
		return Session{}, ErrInvalidCredentials
	}

	user, err := s.repo.FindUserByEmail(ctx, normalizedEmail)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return Session{}, ErrInvalidCredentials
		}

		return Session{}, err
	}

	if err := verifyPassword(password, user.PasswordHash); err != nil {
		return Session{}, ErrInvalidCredentials
	}

	return s.issueSession(ctx, user.User, metadata)
}

func (s *Service) Refresh(ctx context.Context, refreshToken string, metadata SessionMetadata) (Session, error) {
	if strings.TrimSpace(refreshToken) == "" {
		return Session{}, ErrInvalidRefreshToken
	}

	now := s.clock().UTC()
	record, err := s.repo.FindActiveRefreshTokenByHash(ctx, HashRefreshToken(refreshToken), now)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return Session{}, ErrInvalidRefreshToken
		}

		return Session{}, err
	}

	if err := s.repo.RevokeRefreshTokenByHash(ctx, record.TokenHash, now); err != nil && !errors.Is(err, store.ErrNotFound) {
		return Session{}, err
	}

	return s.issueSession(ctx, record.User, metadata)
}

func (s *Service) Logout(ctx context.Context, refreshToken string) error {
	if strings.TrimSpace(refreshToken) == "" {
		return ErrInvalidRefreshToken
	}

	err := s.repo.RevokeRefreshTokenByHash(ctx, HashRefreshToken(refreshToken), s.clock().UTC())
	if err != nil && errors.Is(err, store.ErrNotFound) {
		return nil
	}

	return err
}

func (s *Service) Me(ctx context.Context, userID string) (store.User, error) {
	if strings.TrimSpace(userID) == "" {
		return store.User{}, ErrInvalidAccessToken
	}

	return s.repo.FindUserByID(ctx, userID)
}

func (s *Service) ParseAccessToken(token string, now time.Time) (Claims, error) {
	if s.tokenManager == nil {
		return Claims{}, ErrTokenSecretMissing
	}

	return s.tokenManager.ParseAccessToken(token, now)
}

func (s *Service) issueSession(ctx context.Context, user store.User, metadata SessionMetadata) (Session, error) {
	if s.tokenManager == nil {
		return Session{}, ErrTokenSecretMissing
	}

	now := s.clock().UTC()
	accessToken, accessExpiresAt, err := s.tokenManager.CreateAccessToken(user, now)
	if err != nil {
		return Session{}, err
	}

	refreshToken, refreshTokenHash, err := NewRefreshToken()
	if err != nil {
		return Session{}, err
	}

	if err := s.repo.CreateRefreshToken(ctx, store.CreateRefreshTokenParams{
		UserID:    user.ID,
		TokenHash: refreshTokenHash,
		UserAgent: metadata.UserAgent,
		IPAddress: metadata.IPAddress,
		ExpiresAt: now.Add(s.refreshTokenTTL),
	}); err != nil {
		return Session{}, err
	}

	return Session{
		AccessToken:     accessToken,
		RefreshToken:    refreshToken,
		AccessExpiresAt: accessExpiresAt,
		AccessExpiresIn: int64(accessExpiresAt.Sub(now).Seconds()),
		User:            user,
	}, nil
}

func normalizeRegistrationInput(email string, displayName string) (normalizedEmail string, normalizedDisplayName string, err error) {
	normalizedEmail = strings.ToLower(strings.TrimSpace(email))
	if normalizedEmail == "" {
		return "", "", ErrInvalidEmail
	}

	address, parseErr := mail.ParseAddress(normalizedEmail)
	if parseErr != nil || !strings.EqualFold(address.Address, normalizedEmail) {
		return "", "", ErrInvalidEmail
	}

	normalizedDisplayName = strings.TrimSpace(displayName)
	if len(normalizedDisplayName) > 120 {
		return "", "", ErrInvalidDisplayName
	}

	return normalizedEmail, normalizedDisplayName, nil
}
