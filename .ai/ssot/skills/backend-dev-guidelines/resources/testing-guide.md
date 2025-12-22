# Testing Guide - Backend Testing Strategies

Guide to implementing effective unit and integration tests for backend services.

---

## Unit Testing

Unit tests focus on individual classes or functions in isolation. Mock external dependencies (like repositories) to ensure tests are fast and predictable.

### Example: Service Unit Test
```typescript
// tests/UserService.test.ts
import { UserService } from '../services/UserService';
import { UserRepository } from '../repositories/UserRepository';

jest.mock('../repositories/UserRepository');

describe('UserService', () => {
    let userService: UserService;
    let mockRepo: jest.Mocked<UserRepository>;

    beforeEach(() => {
        mockRepo = new UserRepository() as any;
        userService = new UserService(mockRepo);
    });

    it('should throw error if user not found', async () => {
        mockRepo.findById.mockResolvedValue(null);
        await expect(userService.getUser('123')).rejects.toThrow('User not found');
    });
});
```

---

## Integration Testing

Integration tests verify that different parts of the system work together, including interactions with the real database.

### Principles
- Use a dedicated test database or clear data after each test.
- Verify end-to-end flows through multiple layers.
- Test both happy paths and edge cases.

---

## Mocking Strategies

- **Mocks**: Replace complex dependencies with predictable substitutes.
- **Stubs**: Provide canned responses to calls made during the test.
- **Spies**: Record information about how a function was called (e.g., arguments, number of calls).

---

## Coverage Targets

Aim for balanced coverage:
- **Critical Logic**: 100% coverage.
- **Services/Business Rules**: 80%+ coverage.
- **Overall Project**: 70%+ coverage.

Use `npm test -- --coverage` to generate reports.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [services-and-repositories.md](services-and-repositories.md) - Testable service patterns
- [complete-examples.md](complete-examples.md) - Full testing examples

