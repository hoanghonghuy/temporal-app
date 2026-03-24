package api

import (
	"context"
	"net/http"
	"strings"
	"time"

	"temporal-app/backend/internal/auth"
)

type principalContextKey string

const principalKey principalContextKey = "temporal_principal"

func (s *Server) requireAccessToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if s.authService == nil {
			writeError(w, errAuthUnavailable)
			return
		}

		token := bearerToken(r.Header.Get("Authorization"))
		if token == "" {
			writeError(w, auth.ErrInvalidAccessToken)
			return
		}

		claims, err := s.authService.ParseAccessToken(token, time.Now().UTC())
		if err != nil {
			writeError(w, err)
			return
		}

		next.ServeHTTP(w, r.WithContext(withPrincipal(r.Context(), claims)))
	})
}

func withPrincipal(ctx context.Context, claims auth.Claims) context.Context {
	return context.WithValue(ctx, principalKey, claims)
}

func principalFromContext(ctx context.Context) (auth.Claims, bool) {
	claims, ok := ctx.Value(principalKey).(auth.Claims)
	return claims, ok
}

func bearerToken(value string) string {
	prefix := "Bearer "
	if !strings.HasPrefix(value, prefix) {
		return ""
	}

	return strings.TrimSpace(strings.TrimPrefix(value, prefix))
}
