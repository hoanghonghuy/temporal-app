package auth

import (
	"errors"
	"testing"
	"time"

	"temporal-app/backend/internal/store"
)

func TestTokenManagerRoundTrip(t *testing.T) {
	manager, err := NewTokenManager("super-secret", 15*time.Minute)
	if err != nil {
		t.Fatalf("expected token manager to be created, got error %v", err)
	}

	now := time.Date(2026, 3, 24, 6, 0, 0, 0, time.UTC)
	token, expiresAt, err := manager.CreateAccessToken(store.User{
		ID:          "user-1",
		Email:       "hello@example.com",
		DisplayName: "Hello",
	}, now)
	if err != nil {
		t.Fatalf("expected token to be created, got error %v", err)
	}

	if expiresAt.Sub(now) != 15*time.Minute {
		t.Fatalf("expected token to expire in 15m, got %s", expiresAt.Sub(now))
	}

	claims, err := manager.ParseAccessToken(token, now.Add(5*time.Minute))
	if err != nil {
		t.Fatalf("expected token to parse, got error %v", err)
	}

	if claims.Subject != "user-1" {
		t.Fatalf("expected subject user-1, got %q", claims.Subject)
	}

	if claims.Email != "hello@example.com" {
		t.Fatalf("expected email hello@example.com, got %q", claims.Email)
	}
}

func TestTokenManagerRejectsExpiredToken(t *testing.T) {
	manager, err := NewTokenManager("super-secret", time.Minute)
	if err != nil {
		t.Fatalf("expected token manager to be created, got error %v", err)
	}

	now := time.Date(2026, 3, 24, 6, 0, 0, 0, time.UTC)
	token, _, err := manager.CreateAccessToken(store.User{
		ID:    "user-1",
		Email: "hello@example.com",
	}, now)
	if err != nil {
		t.Fatalf("expected token to be created, got error %v", err)
	}

	_, err = manager.ParseAccessToken(token, now.Add(2*time.Minute))
	if !errors.Is(err, ErrExpiredAccessToken) {
		t.Fatalf("expected expired token error, got %v", err)
	}
}
