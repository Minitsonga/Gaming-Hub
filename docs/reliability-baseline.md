# Reliability Baseline

## Security Verification Checklist

- Validate JWT-protected operations reject missing or invalid tokens.
- Ensure CORS is restricted in production via `CORS_ORIGINS`.
- Confirm helmet middleware is active at gateway and services.
- Verify dependency vulnerabilities with `npm audit`.

## Performance Verification Checklist

- Measure gateway health endpoint latency with load test profile.
- Measure catalog query response under repeated access.
- Track frontend launch route render time with browser performance tools.

## Remediation Tracking

- Log failed checks with impact and owner.
- Open fix tasks for every failing check before release.
- Re-run baseline checks after each fix.
