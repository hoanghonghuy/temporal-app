package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"temporal-app/backend/internal/api"
	"temporal-app/backend/internal/auth"
	"temporal-app/backend/internal/config"
	"temporal-app/backend/internal/platform/database"
	"temporal-app/backend/internal/store"
	"temporal-app/backend/internal/syncdata"
)

func main() {
	cfg := config.LoadFromEnv(os.Getenv)
	logger := log.New(os.Stdout, "temporal-api ", log.LstdFlags|log.LUTC)

	dependencies, cleanup, err := buildDependencies(cfg, logger)
	if err != nil {
		logger.Fatalf("failed to build dependencies: %v", err)
	}
	defer cleanup()

	server := &http.Server{
		Addr:              cfg.ServerAddr,
		Handler:           api.NewHandler(cfg, dependencies),
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
	}

	go func() {
		logger.Printf("starting server on %s (%s)", cfg.ServerAddr, cfg.AppEnv)

		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatalf("server stopped unexpectedly: %v", err)
		}
	}()

	signalContext, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	<-signalContext.Done()
	logger.Println("shutting down server")

	shutdownContext, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	if err := server.Shutdown(shutdownContext); err != nil {
		logger.Fatalf("graceful shutdown failed: %v", err)
	}
}

func buildDependencies(cfg config.Config, logger *log.Logger) (api.Dependencies, func(), error) {
	cleanup := func() {}
	dependencies := api.Dependencies{}

	if cfg.DatabaseURL == "" {
		logger.Println("DATABASE_URL is empty; starting in health-only mode")
		return dependencies, cleanup, nil
	}

	db, err := database.Open(context.Background(), cfg.DatabaseURL)
	if err != nil {
		return api.Dependencies{}, cleanup, err
	}

	cleanup = func() {
		if err := db.Close(); err != nil {
			logger.Printf("failed to close database connection: %v", err)
		}
	}

	tokenManager, err := auth.NewTokenManager(cfg.AccessTokenSecret, cfg.AccessTokenTTL)
	if err != nil {
		_ = db.Close()
		return api.Dependencies{}, func() {}, err
	}

	repository := store.New(db)
	dependencies = api.Dependencies{
		Database:    databaseHealthChecker{db: db},
		AuthService: auth.NewService(repository, tokenManager, cfg.RefreshTokenTTL),
		SyncService: syncdata.NewService(repository),
	}

	return dependencies, cleanup, nil
}

type databaseHealthChecker struct {
	db *sql.DB
}

func (c databaseHealthChecker) PingContext(ctx context.Context) error {
	return c.db.PingContext(ctx)
}
