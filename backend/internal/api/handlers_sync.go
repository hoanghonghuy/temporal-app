package api

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"temporal-app/backend/internal/store"
)

type countdownRequest struct {
	Name    string `json:"name"`
	DateKey string `json:"dateKey"`
}

type dayNoteRequest struct {
	Note string `json:"note"`
}

type countdownResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	DateKey   string `json:"dateKey"`
	CreatedAt string `json:"createdAt"`
}

type dayNoteResponse struct {
	DateKey   string `json:"dateKey"`
	Note      string `json:"note"`
	UpdatedAt string `json:"updatedAt"`
}

type favoriteDayResponse struct {
	DateKey   string `json:"dateKey"`
	UpdatedAt string `json:"updatedAt"`
}

func (s *Server) handleListCountdowns(w http.ResponseWriter, r *http.Request) {
	if s.syncService == nil {
		writeError(w, errSyncUnavailable)
		return
	}

	countdowns, err := s.syncService.ListCountdowns(r.Context(), authenticatedUserID(r))
	if err != nil {
		writeError(w, err)
		return
	}

	response := make([]countdownResponse, 0, len(countdowns))
	for _, countdown := range countdowns {
		response = append(response, toCountdownResponse(countdown))
	}

	writeJSON(w, http.StatusOK, map[string]any{"items": response})
}

func (s *Server) handleCreateCountdown(w http.ResponseWriter, r *http.Request) {
	if s.syncService == nil {
		writeError(w, errSyncUnavailable)
		return
	}

	var input countdownRequest
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, err)
		return
	}

	countdown, err := s.syncService.CreateCountdown(r.Context(), authenticatedUserID(r), input.Name, input.DateKey)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, toCountdownResponse(countdown))
}

func (s *Server) handleUpdateCountdown(w http.ResponseWriter, r *http.Request) {
	if s.syncService == nil {
		writeError(w, errSyncUnavailable)
		return
	}

	var input countdownRequest
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, err)
		return
	}

	countdown, err := s.syncService.UpdateCountdown(r.Context(), authenticatedUserID(r), r.PathValue("id"), input.Name, input.DateKey)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, toCountdownResponse(countdown))
}

func (s *Server) handleDeleteCountdown(w http.ResponseWriter, r *http.Request) {
	if s.syncService == nil {
		writeError(w, errSyncUnavailable)
		return
	}

	if err := s.syncService.DeleteCountdown(r.Context(), authenticatedUserID(r), r.PathValue("id")); err != nil {
		writeError(w, err)
		return
	}

	writeNoContent(w)
}

func (s *Server) handleListDayNotes(w http.ResponseWriter, r *http.Request) {
	if s.syncService == nil {
		writeError(w, errSyncUnavailable)
		return
	}

	notes, err := s.syncService.ListDayNotes(r.Context(), authenticatedUserID(r))
	if err != nil {
		writeError(w, err)
		return
	}

	response := make([]dayNoteResponse, 0, len(notes))
	for _, note := range notes {
		response = append(response, toDayNoteResponse(note))
	}

	writeJSON(w, http.StatusOK, map[string]any{"items": response})
}

func (s *Server) handleGetDayNote(w http.ResponseWriter, r *http.Request) {
	if s.syncService == nil {
		writeError(w, errSyncUnavailable)
		return
	}

	note, err := s.syncService.GetDayNote(r.Context(), authenticatedUserID(r), r.PathValue("dateKey"))
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, toDayNoteResponse(note))
}

func (s *Server) handlePutDayNote(w http.ResponseWriter, r *http.Request) {
	if s.syncService == nil {
		writeError(w, errSyncUnavailable)
		return
	}

	var input dayNoteRequest
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, err)
		return
	}

	if strings.TrimSpace(input.Note) == "" {
		if err := s.syncService.DeleteDayNote(r.Context(), authenticatedUserID(r), r.PathValue("dateKey")); err != nil && !errors.Is(err, store.ErrNotFound) {
			writeError(w, err)
			return
		}

		writeNoContent(w)
		return
	}

	note, err := s.syncService.PutDayNote(r.Context(), authenticatedUserID(r), r.PathValue("dateKey"), input.Note)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, toDayNoteResponse(note))
}

func (s *Server) handleDeleteDayNote(w http.ResponseWriter, r *http.Request) {
	if s.syncService == nil {
		writeError(w, errSyncUnavailable)
		return
	}

	if err := s.syncService.DeleteDayNote(r.Context(), authenticatedUserID(r), r.PathValue("dateKey")); err != nil {
		writeError(w, err)
		return
	}

	writeNoContent(w)
}

func (s *Server) handleListFavoriteDays(w http.ResponseWriter, r *http.Request) {
	if s.syncService == nil {
		writeError(w, errSyncUnavailable)
		return
	}

	days, err := s.syncService.ListFavoriteDays(r.Context(), authenticatedUserID(r))
	if err != nil {
		writeError(w, err)
		return
	}

	response := make([]favoriteDayResponse, 0, len(days))
	for _, day := range days {
		response = append(response, toFavoriteDayResponse(day))
	}

	writeJSON(w, http.StatusOK, map[string]any{"items": response})
}

func (s *Server) handleGetFavoriteDay(w http.ResponseWriter, r *http.Request) {
	if s.syncService == nil {
		writeError(w, errSyncUnavailable)
		return
	}

	day, err := s.syncService.GetFavoriteDay(r.Context(), authenticatedUserID(r), r.PathValue("dateKey"))
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, toFavoriteDayResponse(day))
}

func (s *Server) handlePutFavoriteDay(w http.ResponseWriter, r *http.Request) {
	if s.syncService == nil {
		writeError(w, errSyncUnavailable)
		return
	}

	day, err := s.syncService.PutFavoriteDay(r.Context(), authenticatedUserID(r), r.PathValue("dateKey"))
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, toFavoriteDayResponse(day))
}

func (s *Server) handleDeleteFavoriteDay(w http.ResponseWriter, r *http.Request) {
	if s.syncService == nil {
		writeError(w, errSyncUnavailable)
		return
	}

	if err := s.syncService.DeleteFavoriteDay(r.Context(), authenticatedUserID(r), r.PathValue("dateKey")); err != nil {
		writeError(w, err)
		return
	}

	writeNoContent(w)
}

func authenticatedUserID(r *http.Request) string {
	claims, _ := principalFromContext(r.Context())
	return claims.Subject
}

func toCountdownResponse(countdown store.Countdown) countdownResponse {
	return countdownResponse{
		ID:        countdown.ID,
		Name:      countdown.Name,
		DateKey:   store.FormatDateKey(countdown.DateKey),
		CreatedAt: countdown.CreatedAt.UTC().Format(time.RFC3339),
	}
}

func toDayNoteResponse(note store.DayNote) dayNoteResponse {
	return dayNoteResponse{
		DateKey:   store.FormatDateKey(note.DateKey),
		Note:      note.Note,
		UpdatedAt: note.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toFavoriteDayResponse(day store.FavoriteDay) favoriteDayResponse {
	return favoriteDayResponse{
		DateKey:   store.FormatDateKey(day.DateKey),
		UpdatedAt: day.UpdatedAt.UTC().Format(time.RFC3339),
	}
}
