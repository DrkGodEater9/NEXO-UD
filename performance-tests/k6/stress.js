import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 400 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.1'],
  },
};

export default function stress() {
  // Use a potentially heavy endpoint; adjust to a real heavy endpoint if available
  const res = http.get(`${BASE_URL}/api/v1/reports`);
  check(res, { 'reports 200': (r) => r.status === 200 });
  sleep(1);
}
