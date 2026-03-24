package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"temporal-app/backend/internal/store"
)

var (
	ErrInvalidAccessToken = errors.New("auth: invalid access token")
	ErrExpiredAccessToken = errors.New("auth: expired access token")
)

var encodedTokenHeader = base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"HS256","typ":"JWT"}`))

type Claims struct {
	Subject     string `json:"sub"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName,omitempty"`
	ExpiresAt   int64  `json:"exp"`
	IssuedAt    int64  `json:"iat"`
}

type TokenManager struct {
	secret []byte
	ttl    time.Duration
}

func NewTokenManager(secret string, ttl time.Duration) (*TokenManager, error) {
	trimmed := strings.TrimSpace(secret)
	if trimmed == "" {
		return nil, errors.New("auth: access token secret is required")
	}

	if ttl <= 0 {
		return nil, errors.New("auth: access token ttl must be positive")
	}

	return &TokenManager{
		secret: []byte(trimmed),
		ttl:    ttl,
	}, nil
}

func (m *TokenManager) CreateAccessToken(user store.User, now time.Time) (string, time.Time, error) {
	expiresAt := now.Add(m.ttl)
	claims := Claims{
		Subject:     user.ID,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		ExpiresAt:   expiresAt.Unix(),
		IssuedAt:    now.Unix(),
	}

	payload, err := json.Marshal(claims)
	if err != nil {
		return "", time.Time{}, err
	}

	encodedPayload := base64.RawURLEncoding.EncodeToString(payload)
	unsignedToken := fmt.Sprintf("%s.%s", encodedTokenHeader, encodedPayload)
	signature := m.sign(unsignedToken)

	return fmt.Sprintf("%s.%s", unsignedToken, signature), expiresAt, nil
}

func (m *TokenManager) ParseAccessToken(token string, now time.Time) (Claims, error) {
	parts := strings.Split(strings.TrimSpace(token), ".")
	if len(parts) != 3 {
		return Claims{}, ErrInvalidAccessToken
	}

	unsignedToken := fmt.Sprintf("%s.%s", parts[0], parts[1])
	expectedSignature := m.sign(unsignedToken)
	if !hmac.Equal([]byte(expectedSignature), []byte(parts[2])) {
		return Claims{}, ErrInvalidAccessToken
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return Claims{}, ErrInvalidAccessToken
	}

	var claims Claims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return Claims{}, ErrInvalidAccessToken
	}

	if claims.Subject == "" || claims.Email == "" || claims.ExpiresAt == 0 {
		return Claims{}, ErrInvalidAccessToken
	}

	if now.Unix() >= claims.ExpiresAt {
		return Claims{}, ErrExpiredAccessToken
	}

	return claims, nil
}

func NewRefreshToken() (plain string, tokenHash string, err error) {
	token := make([]byte, 32)
	if _, err := rand.Read(token); err != nil {
		return "", "", err
	}

	plain = "rt1_" + base64.RawURLEncoding.EncodeToString(token)
	sum := sha256.Sum256([]byte(plain))

	return plain, hex.EncodeToString(sum[:]), nil
}

func HashRefreshToken(token string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(token)))
	return hex.EncodeToString(sum[:])
}

func (m *TokenManager) sign(unsignedToken string) string {
	mac := hmac.New(sha256.New, m.secret)
	_, _ = mac.Write([]byte(unsignedToken))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
