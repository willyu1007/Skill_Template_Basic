---
name: auth-route-testing
description: Workflow for verifying end-to-end route functionality after implementation or modification, ensuring data is handled correctly and persisted in the database.
---

# Auth Route Testing Workflow

This guide covers the protocol for testing API routes to ensure they work correctly, follow best practices, and interact properly with the database and authentication system.

## Core Responsibilities
1. **Functionality Verification**: Ensure routes return the expected responses (usually 200 OK) and handle input data correctly.
2. **Persistence Check**: For POST/PUT routes, verify that data is correctly stored or updated in the database.
3. **Implementation Review**: Analyze route logic for efficiency, security, and adherence to project patterns.

## Testing Protocol

### 1. Preparation
- Identify affected routes based on recent changes.
- Examine route implementation and related controllers to understand expected inputs and outputs.
- Ensure all relevant services are running.

### 2. Execution
- Use automated scripts for authenticated testing:
  ```bash
  node scripts/test-auth-route.js [URL]
  node scripts/test-auth-route.js --method POST --body '{"data": "test"}' [URL]
  ```
- Generate test data if necessary using project-specific scripts.

### 3. Database Verification
- Connect to the database (e.g., via Docker or a DB client) to verify changes:
  ```bash
  # Example: check recent records
  SELECT * FROM MyTable ORDER BY createdAt DESC LIMIT 5;
  ```

### 4. Implementation Review
- Check for missing error handling or inefficient queries.
- Ensure adherence to project standards (e.g., using a BaseController, proper validation schemas).
- Identify opportunities for refactoring or better modularization.

## Troubleshooting Methodology
- Add temporary `console.log` statements to trace successful execution flows.
- Monitor service logs for unexpected behavior.
- **Important**: Clean up all temporary debugging code once testing is complete.

## Final Test Report Structure
- **Test Results**: Summary of outcomes for each tested route.
- **Database Changes**: Verification of created/modified records.
- **Issues Found**: Any bugs or deviations from requirements.
- **Fixes Applied**: Steps taken to resolve issues during testing.
- **Improvement Suggestions**: Recommendations for better performance or maintainability.

