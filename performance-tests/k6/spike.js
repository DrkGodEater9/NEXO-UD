import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '30s', target: 200 }, // spike up
    { duration: '2m', target: 200 },
    { duration: '30s', target: 10 }, // recover
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    'http_req_failed': ['rate<0.05'],
  },
};

export default function spike() {
  const res = http.get(`${BASE_URL}/api/v1/announcements`);
  check(res, { 'announcements 200': (r) => r.status === 200 });
  sleep(1);
}
