package api

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"strings"
	"time"

	"temporal-app/backend/internal/auth"
	"temporal-app/backend/internal/store"
	"temporal-app/backend/internal/syncdata"
)

var (
	errInvalidJSONBody  = errors.New("api: invalid json body")
	errAuthUnavailable  = errors.New("api: auth unavailable")
	errSyncUnavailable  = errors.New("api: sync unavailable")
	errMissingPrincipal = errors.New("api: missing principal")
)

type errorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	body, err := json.Marshal(payload)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)

	_, _ = w.Write(append(body, '\n'))
}

func writeNoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

func writeError(w http.ResponseWriter, err error) {
	statusCode, code, message := errorDetails(err)
	writeJSON(w, statusCode, errorResponse{
		Error:   code,
		Message: message,
	})
}

func decodeJSON(r *http.Request, destination any) error {
	defer r.Body.Close()

	decoder := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(destination); err != nil {
		return errInvalidJSONBody
	}

	return nil
}

func errorDetails(err error) (statusCode int, code string, message string) {
	switch {
	case err == nil:
		return http.StatusOK, "", ""
	case errors.Is(err, errInvalidJSONBody):
		return http.StatusBadRequest, "invalid_json_body", "Noi dung gui len khong dung dinh dang JSON."
	case errors.Is(err, errAuthUnavailable):
		return http.StatusServiceUnavailable, "auth_unavailable", "Dich vu xac thuc chua san sang."
	case errors.Is(err, errSyncUnavailable):
		return http.StatusServiceUnavailable, "sync_unavailable", "Dich vu dong bo chua san sang."
	case errors.Is(err, errMissingPrincipal):
		return http.StatusUnauthorized, "missing_principal", "Nguoi dung chua duoc xac thuc."
	case errors.Is(err, auth.ErrInvalidEmail):
		return http.StatusBadRequest, "invalid_email", "Email khong hop le."
	case errors.Is(err, auth.ErrWeakPassword):
		return http.StatusBadRequest, "weak_password", "Mat khau can toi thieu 8 ky tu."
	case errors.Is(err, auth.ErrInvalidDisplayName):
		return http.StatusBadRequest, "invalid_display_name", "Ten hien thi qua dai."
	case errors.Is(err, auth.ErrEmailTaken):
		return http.StatusConflict, "email_taken", "Email nay da duoc su dung."
	case errors.Is(err, auth.ErrInvalidCredentials):
		return http.StatusUnauthorized, "invalid_credentials", "Thong tin dang nhap khong dung."
	case errors.Is(err, auth.ErrInvalidRefreshToken):
		return http.StatusUnauthorized, "invalid_refresh_token", "Refresh token khong hop le."
	case errors.Is(err, auth.ErrInvalidAccessToken), errors.Is(err, auth.ErrExpiredAccessToken):
		return http.StatusUnauthorized, "invalid_access_token", "Access token khong hop le hoac da het han."
	case errors.Is(err, auth.ErrTokenSecretMissing):
		return http.StatusServiceUnavailable, "auth_unavailable", "Cau hinh xac thuc chua san sang."
	case errors.Is(err, syncdata.ErrInvalidDateKey):
		return http.StatusBadRequest, "invalid_date_key", "Ngay phai theo dinh dang yyyy-MM-dd."
	case errors.Is(err, syncdata.ErrInvalidCountdownName):
		return http.StatusBadRequest, "invalid_countdown_name", "Ten moc dem nguoc khong duoc de trong."
	case errors.Is(err, syncdata.ErrInvalidCountdownID):
		return http.StatusBadRequest, "invalid_countdown_id", "Countdown id khong hop le."
	case errors.Is(err, store.ErrConflict):
		return http.StatusConflict, "resource_conflict", "Du lieu nay da ton tai."
	case errors.Is(err, store.ErrNotFound):
		return http.StatusNotFound, "not_found", "Khong tim thay du lieu."
	default:
		return http.StatusInternalServerError, "internal_error", "Da co loi xay ra tren may chu."
	}
}

func requestMetadata(r *http.Request) auth.SessionMetadata {
	return auth.SessionMetadata{
		UserAgent: strings.TrimSpace(r.UserAgent()),
		IPAddress: requestIP(r),
	}
}

func requestIP(r *http.Request) string {
	if forwardedFor := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); forwardedFor != "" {
		parts := strings.Split(forwardedFor, ",")
		return strings.TrimSpace(parts[0])
	}

	if realIP := strings.TrimSpace(r.Header.Get("X-Real-IP")); realIP != "" {
		return realIP
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return strings.TrimSpace(host)
	}

	return strings.TrimSpace(r.RemoteAddr)
}

func pingDatabase(ctx context.Context, checker HealthChecker) string {
	if checker == nil {
		return "missing_configuration"
	}

	pingContext, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	if err := checker.PingContext(pingContext); err != nil {
		return "unavailable"
	}

	return "connected"
}
