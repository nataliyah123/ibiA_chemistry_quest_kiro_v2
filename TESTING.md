# ChemQuest: Alchemist Academy - Testing Documentation

This document outlines the comprehensive testing strategy implemented for ChemQuest: Alchemist Academy, covering all aspects of the application from unit tests to end-to-end user journeys.

## Overview

Our testing strategy follows a multi-layered approach to ensure code quality, functionality, and user experience:

1. **Unit Tests** - Test individual components and functions in isolation
2. **Integration Tests** - Test component interactions and workflows
3. **End-to-End Tests** - Test complete user journeys and scenarios
4. **Accessibility Tests** - Ensure WCAG compliance and inclusive design
5. **Performance Tests** - Validate system performance under load
6. **Visual Regression Tests** - Ensure UI consistency across changes

## Test Structure

### Client-Side Testing (React/TypeScript)

**Framework**: Vitest with React Testing Library
**Location**: `client/src/test/`

```
client/src/test/
├── unit/                    # Unit tests for individual components
│   ├── gameEngine.test.ts
│   ├── characterProgression.test.ts
│   ├── realmComponents.test.ts
│   ├── analyticsEngine.test.ts
│   ├── adaptiveDifficulty.test.ts
│   └── accessibility.test.ts
├── integration/             # Integration tests for workflows
│   └── realmWorkflows.test.tsx
├── e2e/                     # End-to-end user journey tests
│   └── userJourneys.test.tsx
├── accessibility/           # Automated accessibility tests
│   └── axeTests.test.ts
├── setup.ts                 # Test environment setup
└── testUtils.tsx           # Shared test utilities
```

### Server-Side Testing (Node.js/TypeScript)

**Framework**: Jest with Supertest
**Location**: `server/src/tests/`

```
server/src/tests/
├── unit/                    # Service and utility tests
├── integration/             # API endpoint tests
├── performance/             # Load and performance tests
│   └── loadTesting.test.ts
├── helpers/                 # Test utilities and helpers
│   └── testHelpers.ts
└── setup.ts                # Global test setup
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions, components, and services in isolation.

**Coverage Areas**:
- Game engine logic (XP calculation, level progression, challenge generation)
- Character progression mechanics
- Realm-specific game components
- Analytics and performance tracking
- Adaptive difficulty algorithms
- Authentication and authorization
- Data validation and transformation

**Example**:
```typescript
describe('Game Engine', () => {
  it('should calculate XP correctly based on performance', () => {
    const result = calculateXP(100, 60, 3) // score, time, difficulty
    expect(result).toBeGreaterThan(0)
  })
})
```

### 2. Integration Tests

**Purpose**: Test interactions between components and complete workflows.

**Coverage Areas**:
- Realm gameplay workflows (start challenge → submit answer → receive rewards)
- Character progression integration
- API endpoint interactions
- Database operations
- Authentication flows
- Real-time features (leaderboards, multiplayer)

**Example**:
```typescript
describe('Mathmage Trials Workflow', () => {
  it('should complete full equation duels workflow', async () => {
    // Start challenge
    const challenge = await startChallenge('equation-balancing')
    
    // Submit answer
    const result = await submitAnswer(challenge.id, ['2', '13', '8', '10'])
    
    // Verify rewards
    expect(result.rewards).toContain({ type: 'xp', amount: 75 })
  })
})
```

### 3. End-to-End Tests

**Purpose**: Test complete user journeys from start to finish.

**Coverage Areas**:
- New user registration and onboarding
- Complete gameplay sessions
- Character progression over time
- Social features (friends, leaderboards)
- Educational content delivery
- Cross-realm progression

**Example**:
```typescript
describe('New User Journey', () => {
  it('should complete registration to first challenge', async () => {
    // Register new user
    await register('newuser@test.com', 'password123')
    
    // Complete tutorial
    await completeTutorial()
    
    // Start first challenge
    const challenge = await startFirstChallenge()
    expect(challenge.type).toBe('equation-balancing')
  })
})
```

### 4. Accessibility Tests

**Purpose**: Ensure the application is accessible to users with disabilities.

**Coverage Areas**:
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation
- Color contrast ratios
- Focus management
- ARIA labels and descriptions
- Alternative input methods

**Tools**:
- jest-axe for automated accessibility testing
- Manual testing with screen readers
- Keyboard navigation testing

**Example**:
```typescript
describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<GameComponent />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### 5. Performance Tests

**Purpose**: Validate system performance under various load conditions.

**Coverage Areas**:
- Concurrent user handling
- Database query performance
- API response times
- Memory usage and leaks
- Real-time feature scalability
- Challenge generation speed

**Example**:
```typescript
describe('Load Testing', () => {
  it('should handle 50 concurrent users', async () => {
    const promises = Array.from({ length: 50 }, () => 
      request(app).get('/api/character').set('Authorization', token)
    )
    
    const responses = await Promise.all(promises)
    responses.forEach(response => {
      expect(response.status).toBe(200)
    })
  })
})
```

## Test Data Management

### Mock Data
- **Characters**: Various levels, XP amounts, unlocked realms
- **Challenges**: Different types, difficulties, and content
- **Performance Data**: Simulated user attempts and scores
- **Educational Content**: Sample equations, molecules, procedures

### Test Database
- Isolated test database for server tests
- Automatic cleanup between test runs
- Seeded with consistent test data
- Transaction rollback for data integrity

## Running Tests

### Individual Test Suites

```bash
# Client unit tests
cd client && npm run test:unit

# Client integration tests
cd client && npm run test:integration

# Client e2e tests
cd client && npm run test:e2e

# Client accessibility tests
cd client && npm run test:accessibility

# Server unit tests
cd server && npm run test:unit

# Server performance tests
cd server && npm run test:performance
```

### Complete Test Suite

```bash
# Run all tests with comprehensive reporting
node scripts/run-all-tests.js
```

### Test Coverage

```bash
# Generate coverage reports
cd client && npm run test:coverage
cd server && npm run test:coverage
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd client && npm install
          cd server && npm install
      - name: Run tests
        run: node scripts/run-all-tests.js
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

## Quality Gates

### Test Coverage Requirements
- **Unit Tests**: Minimum 80% code coverage
- **Integration Tests**: All critical user paths covered
- **E2E Tests**: All major user journeys tested
- **Accessibility**: Zero axe violations

### Performance Benchmarks
- **API Response Time**: < 200ms for 95th percentile
- **Challenge Loading**: < 1 second
- **Concurrent Users**: Support 100+ simultaneous users
- **Memory Usage**: No memory leaks during extended sessions

## Test Maintenance

### Regular Tasks
- Update test data to reflect curriculum changes
- Add tests for new features and realms
- Review and update performance benchmarks
- Maintain accessibility test coverage
- Update mock data for realistic scenarios

### Best Practices
- Write tests before implementing features (TDD)
- Keep tests focused and independent
- Use descriptive test names and clear assertions
- Mock external dependencies appropriately
- Maintain test data consistency
- Regular test suite performance optimization

## Debugging Tests

### Common Issues
- **Database Connection**: Ensure test database is running
- **Async Operations**: Use proper async/await patterns
- **Mock Data**: Verify mock data matches expected formats
- **Environment Variables**: Check test environment configuration

### Debugging Tools
- **Jest/Vitest Debugger**: Step through test execution
- **Console Logging**: Add temporary logging for debugging
- **Test Isolation**: Run individual tests to isolate issues
- **Database Inspection**: Check test database state

## Educational Testing Approach

### Curriculum Validation
- Test content accuracy against O/A-Level standards
- Validate difficulty progression
- Ensure educational effectiveness
- Test adaptive learning algorithms

### Learning Analytics Testing
- Performance metric calculations
- Weak area identification accuracy
- Recommendation engine effectiveness
- Progress tracking reliability

This comprehensive testing strategy ensures ChemQuest: Alchemist Academy delivers a high-quality, accessible, and educationally effective learning experience for chemistry students.