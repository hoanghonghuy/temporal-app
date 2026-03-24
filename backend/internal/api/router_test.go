package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"temporal-app/backend/internal/config"
)

func TestHealthEndpointReturnsBackendStatus(t *testing.T) {
	handler := NewHandler(config.Config{
		AppEnv:         "development",
		DatabaseURL:    "postgres://temporal",
		AllowedOrigins: []string{"http://localhost:5173"},
	}, Dependencies{})

	request := httptest.NewRequest(http.MethodGet, "/v1/health", nil)
	request.Header.Set("Origin", "http://localhost:5173")
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", recorder.Code)
	}

	if got := recorder.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Fatalf("expected CORS origin to be echoed, got %q", got)
	}

	var payload healthResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected valid JSON response, got error %v", err)
	}

	if payload.Status != "ok" {
		t.Fatalf("expected health status ok, got %q", payload.Status)
	}

	if payload.Database.Status != "missing_configuration" {
		t.Fatalf("expected database status missing_configuration, got %q", payload.Database.Status)
	}
}

func TestProtectedRouteRequiresConfiguredAuth(t *testing.T) {
	handler := NewHandler(config.Config{}, Dependencies{})
	request := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status 503 when auth is not configured, got %d", recorder.Code)
	}
}

func TestOptionsRequestReturnsNoContent(t *testing.T) {
	handler := NewHandler(config.Config{
		AllowedOrigins: []string{"http://localhost:5173"},
	}, Dependencies{})

	request := httptest.NewRequest(http.MethodOptions, "/v1/health", nil)
	request.Header.Set("Origin", "http://localhost:5173")
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", recorder.Code)
	}
}
