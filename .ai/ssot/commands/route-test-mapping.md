---
name: route-test-mapping
description: Identify modified routes and prepare structured data for automated testing.
arguments:
  additional_routes: Optional - space-separated list of additional route paths to test.
---

# Route Test Mapping Command

Use this command to map changed or specific routes to a format suitable for the `auth-route-testing` workflow.

## Execution Steps

### 1. Route Discovery
- Identify all route files modified in the current session.
- Combine this list with any routes provided in the `additional_routes` argument.
- Deduplicate the list and resolve full URL paths based on the application's base path (e.g., in `app.ts`).

### 2. Metadata Extraction
For each identified route, extract:
- **URL Path**: The full endpoint.
- **HTTP Method**: GET, POST, PUT, DELETE, etc.
- **Request Schema**: Expected body or query parameters (refer to Zod schemas if present).
- **Response Schema**: Expected success response format.
- **Test Payloads**: At least one valid and one invalid example payload.

### 3. Workflow Integration
- Format the extracted metadata into a structured JSON list.
- Initiate the `auth-route-testing` workflow using the generated data.

## Goal
The goal is to automate the preparation phase of route testing, ensuring no modified endpoints are missed and that testers have all necessary context to verify functionality.

