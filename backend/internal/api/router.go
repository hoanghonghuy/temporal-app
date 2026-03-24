package api

import (
	"context"
	"net/http"

	"temporal-app/backend/internal/auth"
	"temporal-app/backend/internal/config"
	"temporal-app/backend/internal/syncdata"
)

type HealthChecker interface {
	PingContext(ctx context.Context) error
}

type Dependencies struct {
	Database    HealthChecker
	AuthService *auth.Service
	SyncService *syncdata.Service
}

type Server struct {
	config      config.Config
	database    HealthChecker
	authService *auth.Service
	syncService *syncdata.Service
}

type healthResponse struct {
	Status      string             `json:"status"`
	Service     string             `json:"service"`
	Environment string             `json:"environment"`
	Database    healthDatabaseInfo `json:"database"`
}

type healthDatabaseInfo struct {
	Driver     string `json:"driver"`
	Configured bool   `json:"configured"`
	Status     string `json:"status"`
}

func NewHandler(cfg config.Config, dependencies Dependencies) http.Handler {
	server := &Server{
		config:      cfg,
		database:    dependencies.Database,
		authService: dependencies.AuthService,
		syncService: dependencies.SyncService,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/health", server.handleHealth)
	mux.HandleFunc("POST /v1/auth/register", server.handleRegister)
	mux.HandleFunc("POST /v1/auth/login", server.handleLogin)
	mux.HandleFunc("POST /v1/auth/refresh", server.handleRefresh)
	mux.HandleFunc("POST /v1/auth/logout", server.handleLogout)

	mux.Handle("GET /v1/me", server.requireAccessToken(http.HandlerFunc(server.handleMe)))
	mux.Handle("GET /v1/countdowns", server.requireAccessToken(http.HandlerFunc(server.handleListCountdowns)))
	mux.Handle("POST /v1/countdowns", server.requireAccessToken(http.HandlerFunc(server.handleCreateCountdown)))
	mux.Handle("PATCH /v1/countdowns/{id}", server.requireAccessToken(http.HandlerFunc(server.handleUpdateCountdown)))
	mux.Handle("DELETE /v1/countdowns/{id}", server.requireAccessToken(http.HandlerFunc(server.handleDeleteCountdown)))
	mux.Handle("GET /v1/day-notes", server.requireAccessToken(http.HandlerFunc(server.handleListDayNotes)))
	mux.Handle("GET /v1/day-notes/{dateKey}", server.requireAccessToken(http.HandlerFunc(server.handleGetDayNote)))
	mux.Handle("PUT /v1/day-notes/{dateKey}", server.requireAccessToken(http.HandlerFunc(server.handlePutDayNote)))
	mux.Handle("DELETE /v1/day-notes/{dateKey}", server.requireAccessToken(http.HandlerFunc(server.handleDeleteDayNote)))
	mux.Handle("GET /v1/favorite-days", server.requireAccessToken(http.HandlerFunc(server.handleListFavoriteDays)))
	mux.Handle("GET /v1/favorite-days/{dateKey}", server.requireAccessToken(http.HandlerFunc(server.handleGetFavoriteDay)))
	mux.Handle("PUT /v1/favorite-days/{dateKey}", server.requireAccessToken(http.HandlerFunc(server.handlePutFavoriteDay)))
	mux.Handle("DELETE /v1/favorite-days/{dateKey}", server.requireAccessToken(http.HandlerFunc(server.handleDeleteFavoriteDay)))

	return withCORS(cfg.AllowedOrigins, mux)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	databaseStatus := pingDatabase(r.Context(), s.database)
	status := "ok"
	if databaseStatus == "unavailable" {
		status = "degraded"
	}

	writeJSON(w, http.StatusOK, healthResponse{
		Status:      status,
		Service:     "temporal-api",
		Environment: s.config.AppEnv,
		Database: healthDatabaseInfo{
			Driver:     "postgres",
			Configured: s.config.DatabaseURL != "",
			Status:     databaseStatus,
		},
	})
}
