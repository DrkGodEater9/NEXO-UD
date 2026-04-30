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
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

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
  studentCode?: string;
  entrySemester?: string;
  faculty?: string;
  career?: string;
}

export const userApi = {
  me() {
    return request<UserProfile>('/users/me');
  },
};

// ─── Admin Academic Offers ───────────────────────────────────────────────────

export interface AcademicOfferUploadResponse {
  offerId: number;
  semester: string;
  uploadedAt: string;
  facultades: number;
  carreras: number;
  materias: number;
  grupos: number;
  horarios: number;
  warnings: string[];
}

// ─── Schedules & Academic Offer ───────────────────────────────────────────────

export interface TimeBlockResponse {
  id: number;
  dia: string;
  horaInicio: number;
  horaFin: number;
  ubicacion: string;
}

export interface SubjectGroupResponse {
  id: number;
  grupoCode: string;
  inscritos: number;
  docente: string;
  horarios: TimeBlockResponse[];
}

export interface SubjectResponse {
  id: number;
  codigo: string;
  nombre: string;
  studyPlanId: number;
  facultad: string;
  carrera: string;
  grupos: SubjectGroupResponse[];
}

export const scheduleApi = {
  getOfferSubjects(studyPlanId?: number) {
    const query = studyPlanId ? `?studyPlanId=${studyPlanId}` : '';
    return request<SubjectResponse[]>(`/schedules/offer/subjects${query}`);
  },
};

export interface AcademicOfferResponse {
  id: number;
  semester: string;
  active: boolean;
  uploadedAt: string;
  uploadedBy: number;
}

export const academicOfferApi = {
  list() {
    return request<AcademicOfferResponse[]>('/admin/academic-offers');
  },
  upload(file: File, semester: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('semester', semester);

    return request<AcademicOfferUploadResponse>('/admin/academic-offers/upload', {
      method: 'POST',
      body: formData,
    });
  },
  delete(id: number) {
    return request<void>(`/admin/academic-offers/${id}`, { method: 'DELETE' });
  }
};

// ─── Semesters ──────────────────────────────────────────────────────────────

export interface SemesterData {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
}

export const semesterApi = {
  getActive() {
    return request<SemesterData>('/semesters/active');
  },
  list() {
    return request<SemesterData[]>('/admin/semesters');
  },
  create(name: string) {
    return request<SemesterData>('/admin/semesters', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
  activate(id: number) {
    return request<SemesterData>(`/admin/semesters/${id}/activate`, {
      method: 'PATCH',
    });
  },
  delete(id: number) {
    return request<void>(`/admin/semesters/${id}`, { method: 'DELETE' });
  },
};

// ─── Admin Users & Roles ─────────────────────────────────────────────────────

export interface UserSummary {
  id: number;
  email: string;
  nickname: string;
  active: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface RoleInfo {
  id: number;
  roleName: string;
  assignedAt: string;
}

export const adminApi = {
  listUsers(page = 0, size = 20, email?: string) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (email) params.set('email', email);
    return request<PageResponse<UserSummary>>(`/admin/users?${params}`);
  },
  getUserById(id: number) {
    return request<UserProfile>(`/admin/users/${id}`);
  },
  setUserStatus(id: number, active: boolean) {
    return request<void>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  },
  listRoles() {
    return request<string[]>('/admin/roles');
  },
  getUserRoles(userId: number) {
    return request<RoleInfo[]>(`/admin/roles/users/${userId}`);
  },
  assignRole(userId: number, roleName: string) {
    return request<void>(`/admin/roles/users/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ roleName }),
    });
  },
  revokeRole(userId: number, roleId: number) {
    return request<void>(`/admin/roles/users/${userId}/${roleId}`, {
      method: 'DELETE',
    });
  },
};

// ─── Announcements ──────────────────────────────────────────────────────────

export interface AnnouncementData {
  id: number;
  title: string;
  body: string;
  scope: string;
  type: string;
  faculty: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementPayload {
  title: string;
  body: string;
  scope: 'FACULTAD' | 'UNIVERSIDAD';
  type: 'GENERAL' | 'ASAMBLEA';
  faculty?: string;
}

export const announcementsApi = {
  list(scope?: string, type?: string) {
    const params = new URLSearchParams();
    if (scope) params.set('scope', scope);
    if (type) params.set('type', type);
    const qs = params.toString();
    return request<AnnouncementData[]>(`/announcements${qs ? '?' + qs : ''}`);
  },
  getById(id: number) {
    return request<AnnouncementData>(`/announcements/${id}`);
  },
  create(data: AnnouncementPayload) {
    return request<AnnouncementData>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(id: number, data: AnnouncementPayload) {
    return request<AnnouncementData>(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete(id: number) {
    return request<void>(`/announcements/${id}`, { method: 'DELETE' });
  },
};

// ─── Welfare ─────────────────────────────────────────────────────────────────

export interface WelfareData {
  id: number;
  title: string;
  description: string;
  category: string;
  links: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface WelfarePayload {
  title: string;
  description: string;
  category: 'APOYO_ALIMENTARIO' | 'BECAS' | 'SALUD_MENTAL' | 'SERVICIOS_SALUD';
  links?: string;
}

export const welfareApi = {
  list(category?: string) {
    const qs = category ? `?category=${category}` : '';
    return request<WelfareData[]>(`/welfare${qs}`);
  },
  create(data: WelfarePayload) {
    return request<WelfareData>('/welfare', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(id: number, data: WelfarePayload) {
    return request<WelfareData>(`/welfare/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete(id: number) {
    return request<void>(`/welfare/${id}`, { method: 'DELETE' });
  },
};

// ─── Campus ──────────────────────────────────────────────────────────────────

export interface CampusData {
  id: number;
  name: string;
  address: string;
  faculty: string;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  classrooms: { id: number; name: string; building: string; floor: number; capacity: number | null }[];
}

export interface CampusPayload {
  name: string;
  address?: string;
  faculty: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
}

export const campusApi = {
  list() {
    return request<CampusData[]>('/campus');
  },
  update(id: number, data: CampusPayload) {
    return request<CampusData>(`/campus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  create(data: CampusPayload) {
    return request<CampusData>('/campus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  delete(id: number) {
    return request<void>(`/campus/${id}`, { method: 'DELETE' });
  },
};

// ─── Academic Calendar ────────────────────────────────────────────────────────

export type CalendarEventType = 'INSCRIPCION' | 'INICIO_CLASES' | 'FIN_CLASES' | 'PARCIAL' | 'FESTIVO' | 'PARO' | 'OTRO';

// Matches CalendarEventResponse from backend
export interface CalendarEventData {
  id: number;
  title: string;
  description: string | null;
  eventType: CalendarEventType;
  startDate: string;
  endDate: string | null;
  createdBy: number;
}

// Matches CalendarEventRequest from backend
export interface CalendarEventPayload {
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startDate: string;
  endDate?: string;
}

export const calendarApi = {
  list() {
    return request<CalendarEventData[]>('/calendar');
  },
  create(data: CalendarEventPayload) {
    return request<CalendarEventData>('/calendar', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(id: number, data: CalendarEventPayload) {
    return request<CalendarEventData>(`/calendar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete(id: number) {
    return request<void>(`/calendar/${id}`, { method: 'DELETE' });
  },
};
