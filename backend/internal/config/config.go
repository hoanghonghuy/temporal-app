package config

import (
	"strings"
	"time"
)

const (
	defaultAppEnv            = "development"
	defaultServerAddr        = ":8080"
	defaultShutdownTimeout   = 10 * time.Second
	defaultReadHeaderTimeout = 5 * time.Second
)

type Config struct {
	AppEnv            string
	ServerAddr        string
	DatabaseURL       string
	AllowedOrigins    []string
	AccessTokenSecret string
	AccessTokenTTL    time.Duration
	RefreshTokenTTL   time.Duration
	ShutdownTimeout   time.Duration
	ReadHeaderTimeout time.Duration
}

func LoadFromEnv(getenv func(string) string) Config {
	return Config{
		AppEnv:            stringOrDefault(getenv("APP_ENV"), defaultAppEnv),
		ServerAddr:        stringOrDefault(getenv("SERVER_ADDR"), defaultServerAddr),
		DatabaseURL:       strings.TrimSpace(getenv("DATABASE_URL")),
		AllowedOrigins:    splitAndTrim(getenv("CORS_ALLOWED_ORIGINS")),
		AccessTokenSecret: strings.TrimSpace(getenv("ACCESS_TOKEN_SECRET")),
		AccessTokenTTL:    durationOrDefault(getenv("ACCESS_TOKEN_TTL"), 15*time.Minute),
		RefreshTokenTTL:   durationOrDefault(getenv("REFRESH_TOKEN_TTL"), 30*24*time.Hour),
		ShutdownTimeout:   durationOrDefault(getenv("SHUTDOWN_TIMEOUT"), defaultShutdownTimeout),
		ReadHeaderTimeout: durationOrDefault(getenv("READ_HEADER_TIMEOUT"), defaultReadHeaderTimeout),
	}
}

func splitAndTrim(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}

	parts := strings.Split(value, ",")
	results := make([]string, 0, len(parts))

	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			results = append(results, trimmed)
		}
	}

	if len(results) == 0 {
		return nil
	}

	return results
}

func stringOrDefault(value string, fallback string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}

	return trimmed
}

func durationOrDefault(value string, fallback time.Duration) time.Duration {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}

	parsed, err := time.ParseDuration(trimmed)
	if err != nil {
		return fallback
	}

	return parsed
}
