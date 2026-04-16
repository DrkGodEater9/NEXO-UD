const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('nexoud_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const body = await res.json();
      msg = body.message ?? body.error ?? msg;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, msg);
  }

  const text = await res.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  email: string;
  nickname: string;
  roles: string[];
}

export const authApi = {
  register(data: {
    email: string;
    nickname: string;
    password: string;
    studentCode: string;
    entrySemester: string;
    studyPlanId: number;
  }) {
    return request<void>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyCode(data: { email: string; code: string }) {
    return request<void>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resendCode(email: string) {
    return request<void>('/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  login(data: { email: string; password: string }) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout() {
    return request<void>('/auth/logout', { method: 'POST' });
  },

  forgotPassword(email: string) {
    return request<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(data: { email: string; code: string; newPassword: string }) {
    return request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ─── Study Plans ─────────────────────────────────────────────────────────────

export interface StudyPlanSimple {
  id: number;
  codigoPlan: string;
  nombre: string;
  facultad: string;
}

export const studyPlanApi = {
  list() {
    return request<StudyPlanSimple[]>('/study-plans');
  },
};

// ─── Users ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  active: boolean;
  createdAt: string;
  roles: string[];
}

export const userApi = {
  me() {
    return request<UserProfile>('/users/me');
  },
};
