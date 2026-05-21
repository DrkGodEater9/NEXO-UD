import http from 'k6/http';
import { check, sleep } from 'k6';

// Configurables via environment variables
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const USERS = Number(__ENV.USERS) || 50;
const DURATION = __ENV.DURATION || '1m';

export const options = {
  vus: USERS,
  duration: DURATION,
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    'http_req_failed': ['rate<0.01'],
  },
};

// Realistic endpoints based on nexo-backend conventions (/api/v1/...)
const PATHS = [
  '/api/v1/announcements',
  '/api/v1/schedules',
  '/api/v1/campus',
];

const LOGIN_PATH = '/api/v1/auth/login';

export default function baseline() {
  // optional login step if credentials provided via env vars
  const user = __ENV.LOGIN_USER;
  const pass = __ENV.LOGIN_PASS;
  if (user && pass) {
    const loginRes = http.post(`${BASE_URL}${LOGIN_PATH}`, JSON.stringify({ username: user, password: pass }), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(loginRes, { 'login 200': (r) => r.status === 200 });
    // if token returned, set for future requests
    try {
      const body = loginRes.json();
      if (body && body.token) {
        __ENV.AUTH_TOKEN = body.token; // note: env change only visible to this VU
      }
    } catch (e) {}
    sleep(0.5);
  }

  // walk through public endpoints
  for (const path of PATHS) {
    const url = `${BASE_URL}${path}`;
    const res = http.get(url);
    check(res, {
      'status is 200': (r) => r.status === 200,
    });
    sleep(0.5);
  }

  sleep(1);
}
