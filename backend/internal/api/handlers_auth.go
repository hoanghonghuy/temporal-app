package api

import (
	"net/http"
	"time"

	"temporal-app/backend/internal/auth"
	"temporal-app/backend/internal/store"
)

type registerRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type sessionResponse struct {
	TokenType       string       `json:"tokenType"`
	AccessToken     string       `json:"accessToken"`
	RefreshToken    string       `json:"refreshToken"`
	AccessExpiresAt string       `json:"accessExpiresAt"`
	AccessExpiresIn int64        `json:"accessExpiresIn"`
	User            userResponse `json:"user"`
}

type userResponse struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName,omitempty"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	if s.authService == nil {
		writeError(w, errAuthUnavailable)
		return
	}

	var input registerRequest
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, err)
		return
	}

	session, err := s.authService.Register(r.Context(), input.Email, input.Password, input.DisplayName, requestMetadata(r))
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, toSessionResponse(session))
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if s.authService == nil {
		writeError(w, errAuthUnavailable)
		return
	}

	var input loginRequest
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, err)
		return
	}

	session, err := s.authService.Login(r.Context(), input.Email, input.Password, requestMetadata(r))
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, toSessionResponse(session))
}

func (s *Server) handleRefresh(w http.ResponseWriter, r *http.Request) {
	if s.authService == nil {
		writeError(w, errAuthUnavailable)
		return
	}

	var input refreshRequest
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, err)
		return
	}

	session, err := s.authService.Refresh(r.Context(), input.RefreshToken, requestMetadata(r))
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, toSessionResponse(session))
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if s.authService == nil {
		writeError(w, errAuthUnavailable)
		return
	}

	var input refreshRequest
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, err)
		return
	}

	if err := s.authService.Logout(r.Context(), input.RefreshToken); err != nil {
		writeError(w, err)
		return
	}

	writeNoContent(w)
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	if s.authService == nil {
		writeError(w, errAuthUnavailable)
		return
	}

	claims, ok := principalFromContext(r.Context())
	if !ok {
		writeError(w, errMissingPrincipal)
		return
	}

	user, err := s.authService.Me(r.Context(), claims.Subject)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, toUserResponse(user))
}

func toSessionResponse(session auth.Session) sessionResponse {
	return sessionResponse{
		TokenType:       "Bearer",
		AccessToken:     session.AccessToken,
		RefreshToken:    session.RefreshToken,
		AccessExpiresAt: session.AccessExpiresAt.UTC().Format(time.RFC3339),
		AccessExpiresIn: session.AccessExpiresIn,
		User:            toUserResponse(session.User),
	}
}

func toUserResponse(user store.User) userResponse {
	response := userResponse{
		ID:        user.ID,
		Email:     user.Email,
		CreatedAt: user.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: user.UpdatedAt.UTC().Format(time.RFC3339),
	}

	if user.DisplayName != "" {
		response.DisplayName = user.DisplayName
	}

	return response
}
