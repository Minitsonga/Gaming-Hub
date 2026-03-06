/**
 * Test de charge – GraphQL (gateway)
 * Usage: k6 run load-tests/graphql.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const GRAPHQL_URL = `${BASE_URL}/graphql`;

const query = `
  query {
    __typename
  }
`;

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const payload = JSON.stringify({ query });
  const res = http.post(GRAPHQL_URL, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'status 200': (r) => r.status === 200,
    'body data': (r) => {
      try {
        const body = r.json();
        return body.data && body.data.__typename !== undefined;
      } catch {
        return false;
      }
    },
  });
  sleep(0.1);
}
