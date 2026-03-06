/**
 * Test de charge – health check (gateway)
 * Usage: k6 run load-tests/health.js
 *        k6 run --env BASE_URL=http://localhost:4000 load-tests/health.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  check(res, {
    'status 200': (r) => r.status === 200,
    'body ok': (r) => r.json('status') === 'ok',
  });
  sleep(0.1);
}
