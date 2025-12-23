---
name: implementation-plan-review
description: Workflow for analyzing proposed implementation plans to ensure they are complete, technically sound, and aligned with project standards before execution begins.
---

# Implementation Plan Review Workflow

This guide details the process for reviewing implementation plans to ensure high-quality, consistent development across the project.

## Core Objectives
1. **Technical Soundness**: Verify the proposed solution is technically feasible and efficient.
2. **Completeness**: Ensure all aspects of the task (backend, frontend, database, testing, docs) are addressed.
3. **Alignment**: Confirm the plan follows project patterns and architectural guidelines.

## Review Protocol

### 1. Content Analysis
- Does the plan have a clear goal?
- Are the technical steps detailed and actionable?
- Are all necessary dependencies and side effects identified?

### 2. Project Pattern Check
- Does the plan use the correct layered architecture (Routes -> Controllers -> Services -> Repositories)?
- Are modern frontend patterns (TanStack Query, Suspense, MUI v7) utilized?
- Is there a plan for database migrations and schema updates if needed?
- Does it include error handling and Sentry integration?

### 3. Risk Assessment
- Are there potential performance bottlenecks?
- Could the changes break existing functionality?
- Is the plan too large? Suggest breaking it into smaller, manageable tasks if necessary.

### 4. Verification Strategy
- Does the plan include specific steps for manual or automated testing?
- Are there clear criteria for success?

## Review Report Structure
- **Overall Assessment**: (Approve / Request Changes / Reject)
- **Positive Aspects**: What the plan got right.
- **Missing or Unclear Parts**: Areas that need more detail.
- **Architectural Suggestions**: Recommendations for better alignment with project standards.
- **Risk Mitigation**: Advice on handling potential issues identified during the review.

