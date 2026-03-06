/**
 * Test de stress – montée agressive pour trouver la limite
 * Usage: k6 run load-tests/stress.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(0.1);
}
