# API Documentation

The OpenAPI 3 specification for this service is defined as code in
[`src/config/swagger.ts`](../config/swagger.ts) and served at runtime:

- **Swagger UI:** `GET /api-docs`
- **Raw OpenAPI JSON:** `GET /api-docs.json`

Keeping the contract in code (rather than scattered JSDoc) means it is
type-checked, versioned with the source, and never silently drifts from the
routes. When you add or change an endpoint, update the `paths` object in
`swagger.ts` in the same change.
