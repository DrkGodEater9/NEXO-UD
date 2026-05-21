import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const VUS = Number(__ENV.VUS) || 30;
const DURATION = __ENV.DURATION || '6h';

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_duration: ['p(95)<800'],
    'http_req_failed': ['rate<0.02'],
  },
};

export default function soak() {
  const res = http.get(`${BASE_URL}/api/v1/schedules`);
  check(res, { 'schedules 200': (r) => r.status === 200 });
  sleep(2);
}
