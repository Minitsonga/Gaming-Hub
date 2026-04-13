# Health Verification

## Contract

Every service health endpoint must answer with:

```json
{
  "status": "ok",
  "service": "service-name"
}
```

## Unified Verification Path

Run the global smoke command:

```bash
npm run health:smoke
```

It verifies:

- gateway (`/health`)
- auth-service (`/health`)
- catalog-service (`/health`)
- roguelike-service (`/health`)
- analytics-service (`/health`)

## Error Semantics

- non-200 responses are reported with the HTTP status code
- malformed JSON contract responses are reported as invalid contract
- unreachable endpoints fail with network error details
