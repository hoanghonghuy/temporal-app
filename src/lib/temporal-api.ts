export interface TemporalApiUser {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemporalApiSession {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  accessExpiresIn: number;
  user: TemporalApiUser;
}

export interface TemporalApiCountdownItem {
  id: string;
  name: string;
  dateKey: string;
  createdAt: string;
}

export interface TemporalApiDayNoteItem {
  dateKey: string;
  note: string;
  updatedAt: string;
}

export interface TemporalApiFavoriteDayItem {
  dateKey: string;
  updatedAt: string;
}

interface TemporalApiListResponse<T> {
  items: T[];
}

interface TemporalApiErrorPayload {
  error?: string;
  message?: string;
}

export class TemporalApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "api_error") {
    super(message);
    this.name = "TemporalApiError";
    this.status = status;
    this.code = code;
  }
}

export function getTemporalApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const fallbackBaseUrl = import.meta.env.DEV ? "http://localhost:8080" : "";
  return (configuredBaseUrl || fallbackBaseUrl).replace(/\/+$/, "");
}

export function hasTemporalApiBaseUrl() {
  return getTemporalApiBaseUrl().length > 0;
}

export function createTemporalApiClient(baseUrl = getTemporalApiBaseUrl()) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  const parseResponseBody = (responseText: string) => {
    if (!responseText) {
      return null;
    }

    try {
      return JSON.parse(responseText) as unknown;
    } catch {
      return null;
    }
  };

  const request = async <T>(path: string, options?: RequestInit & { accessToken?: string }) => {
    const headers = new Headers(options?.headers);
    headers.set("Accept", "application/json");
    if (options?.body) {
      headers.set("Content-Type", "application/json");
    }
    if (options?.accessToken) {
      headers.set("Authorization", `Bearer ${options.accessToken}`);
    }

    const response = await fetch(`${normalizedBaseUrl}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const responseText = await response.text();
    const responseData = parseResponseBody(responseText);

    if (!response.ok) {
      const payload = (responseData ?? {}) as TemporalApiErrorPayload;
      throw new TemporalApiError(payload.message || `Request failed with status ${response.status}.`, response.status, payload.error);
    }

    return responseData as T;
  };

  return {
    register: (input: { email: string; password: string; displayName?: string }) =>
      request<TemporalApiSession>("/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    login: (input: { email: string; password: string }) =>
      request<TemporalApiSession>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    refresh: (refreshToken: string) =>
      request<TemporalApiSession>("/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }),
    logout: (refreshToken: string) =>
      request<void>("/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }),
    me: (accessToken: string) =>
      request<TemporalApiUser>("/v1/me", {
        method: "GET",
        accessToken,
      }),
    listCountdowns: (accessToken: string) =>
      request<TemporalApiListResponse<TemporalApiCountdownItem>>("/v1/countdowns", {
        method: "GET",
        accessToken,
      }),
    createCountdown: (accessToken: string, input: { name: string; dateKey: string }) =>
      request<TemporalApiCountdownItem>("/v1/countdowns", {
        method: "POST",
        accessToken,
        body: JSON.stringify(input),
      }),
    updateCountdown: (accessToken: string, countdownId: string, input: { name: string; dateKey: string }) =>
      request<TemporalApiCountdownItem>(`/v1/countdowns/${encodeURIComponent(countdownId)}`, {
        method: "PATCH",
        accessToken,
        body: JSON.stringify(input),
      }),
    deleteCountdown: (accessToken: string, countdownId: string) =>
      request<void>(`/v1/countdowns/${encodeURIComponent(countdownId)}`, {
        method: "DELETE",
        accessToken,
      }),
    listDayNotes: (accessToken: string) =>
      request<TemporalApiListResponse<TemporalApiDayNoteItem>>("/v1/day-notes", {
        method: "GET",
        accessToken,
      }),
    putDayNote: (accessToken: string, dateKey: string, note: string) =>
      request<TemporalApiDayNoteItem>(`/v1/day-notes/${encodeURIComponent(dateKey)}`, {
        method: "PUT",
        accessToken,
        body: JSON.stringify({ note }),
      }),
    deleteDayNote: (accessToken: string, dateKey: string) =>
      request<void>(`/v1/day-notes/${encodeURIComponent(dateKey)}`, {
        method: "DELETE",
        accessToken,
      }),
    listFavoriteDays: (accessToken: string) =>
      request<TemporalApiListResponse<TemporalApiFavoriteDayItem>>("/v1/favorite-days", {
        method: "GET",
        accessToken,
      }),
    putFavoriteDay: (accessToken: string, dateKey: string) =>
      request<TemporalApiFavoriteDayItem>(`/v1/favorite-days/${encodeURIComponent(dateKey)}`, {
        method: "PUT",
        accessToken,
      }),
    deleteFavoriteDay: (accessToken: string, dateKey: string) =>
      request<void>(`/v1/favorite-days/${encodeURIComponent(dateKey)}`, {
        method: "DELETE",
        accessToken,
      }),
  };
}
