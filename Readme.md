# backend journy node.js

| Code | Meaning    | When to Use                                                     |
| ---- | ---------- | --------------------------------------------------------------- |
| 200  | OK         | Standard success, e.g., data fetched or updated.                |
| 201  | Created    | New resource created (e.g., user, post, file).                  |
| 202  | Accepted   | Request accepted but not completed yet (usually for async ops). |
| 204  | No Content | Success but no response body (e.g., after DELETE).              |


| Code | Meaning              | When to Use                                        |
| ---- | -------------------- | -------------------------------------------------- |
| 400  | Bad Request          | Request is malformed or missing required fields.   |
| 401  | Unauthorized         | User is not authenticated (token missing/invalid). |
| 403  | Forbidden            | Authenticated, but not allowed to do this action.  |
| 404  | Not Found            | Resource doesn't exist (wrong URL or ID).          |
| 409  | Conflict             | Duplicate resource, version conflict, etc.         |
| 422  | Unprocessable Entity | Validation failed (like Zod, Joi errors).          |
