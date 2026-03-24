package config

import (
	"reflect"
	"testing"
	"time"
)

func TestLoadFromEnvUsesDefaults(t *testing.T) {
	cfg := LoadFromEnv(func(string) string {
		return ""
	})

	if cfg.AppEnv != defaultAppEnv {
		t.Fatalf("expected default app env %q, got %q", defaultAppEnv, cfg.AppEnv)
	}

	if cfg.ServerAddr != defaultServerAddr {
		t.Fatalf("expected default server addr %q, got %q", defaultServerAddr, cfg.ServerAddr)
	}

	if cfg.ShutdownTimeout != defaultShutdownTimeout {
		t.Fatalf("expected shutdown timeout %s, got %s", defaultShutdownTimeout, cfg.ShutdownTimeout)
	}

	if cfg.ReadHeaderTimeout != defaultReadHeaderTimeout {
		t.Fatalf("expected read header timeout %s, got %s", defaultReadHeaderTimeout, cfg.ReadHeaderTimeout)
	}

	if cfg.AccessTokenTTL != 15*time.Minute {
		t.Fatalf("expected default access token ttl 15m, got %s", cfg.AccessTokenTTL)
	}

	if cfg.RefreshTokenTTL != 30*24*time.Hour {
		t.Fatalf("expected default refresh token ttl 720h, got %s", cfg.RefreshTokenTTL)
	}
}

func TestLoadFromEnvParsesOriginsAndTimeouts(t *testing.T) {
	values := map[string]string{
		"APP_ENV":              "production",
		"SERVER_ADDR":          ":9090",
		"DATABASE_URL":         "postgres://temporal",
		"CORS_ALLOWED_ORIGINS": " http://localhost:5173, https://temporal.app ,, ",
		"ACCESS_TOKEN_SECRET":  "dev-secret",
		"ACCESS_TOKEN_TTL":     "20m",
		"REFRESH_TOKEN_TTL":    "480h",
		"SHUTDOWN_TIMEOUT":     "15s",
		"READ_HEADER_TIMEOUT":  "2s",
	}

	cfg := LoadFromEnv(func(key string) string {
		return values[key]
	})

	if cfg.AppEnv != "production" {
		t.Fatalf("expected app env production, got %q", cfg.AppEnv)
	}

	if cfg.ServerAddr != ":9090" {
		t.Fatalf("expected server addr :9090, got %q", cfg.ServerAddr)
	}

	if cfg.DatabaseURL != "postgres://temporal" {
		t.Fatalf("expected database url to be preserved, got %q", cfg.DatabaseURL)
	}

	if cfg.AccessTokenSecret != "dev-secret" {
		t.Fatalf("expected access token secret to be parsed, got %q", cfg.AccessTokenSecret)
	}

	expectedOrigins := []string{"http://localhost:5173", "https://temporal.app"}
	if !reflect.DeepEqual(cfg.AllowedOrigins, expectedOrigins) {
		t.Fatalf("expected origins %v, got %v", expectedOrigins, cfg.AllowedOrigins)
	}

	if cfg.ShutdownTimeout != 15*time.Second {
		t.Fatalf("expected shutdown timeout 15s, got %s", cfg.ShutdownTimeout)
	}

	if cfg.ReadHeaderTimeout != 2*time.Second {
		t.Fatalf("expected read header timeout 2s, got %s", cfg.ReadHeaderTimeout)
	}

	if cfg.AccessTokenTTL != 20*time.Minute {
		t.Fatalf("expected access token ttl 20m, got %s", cfg.AccessTokenTTL)
	}

	if cfg.RefreshTokenTTL != 480*time.Hour {
		t.Fatalf("expected refresh token ttl 480h, got %s", cfg.RefreshTokenTTL)
	}
}
