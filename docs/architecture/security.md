# Security Architecture

## Overview

Lazy Map implements multiple layers of security controls to protect the application, user data, and infrastructure. This document outlines the security measures, scanning tools, and best practices implemented in the project.

## Security Scanning & Automation

### CodeQL Analysis

**Purpose**: Automated semantic code analysis to detect security vulnerabilities and code quality issues.

**Configuration**: `.github/workflows/codeql.yml`

**Features**:
- Runs on all pull requests and pushes to main
- Weekly scheduled scans (Monday 00:00 UTC)
- Uses `security-extended` and `security-and-quality` query suites
- Analyzes TypeScript/JavaScript code across entire monorepo
- Fails build on critical or high severity findings

**Coverage**:
- SQL injection detection
- Cross-site scripting (XSS) vulnerabilities
- Authentication and authorization flaws
- Sensitive data exposure
- Insecure cryptographic practices
- Command injection risks
- Path traversal vulnerabilities

**Custom Configuration**: `.github/codeql/codeql-config.yml`
- Excludes test files and mocks from analysis
- Focuses on source code in `apps/` and `packages/`
- Uses JavaScript query packs for Node.js/TypeScript

### Dependabot Security Updates

**Purpose**: Automated dependency vulnerability scanning and updates.

**Configuration**: `.github/dependabot.yml`

**Features**:
- Weekly dependency checks (Monday 09:00 CET)
- Automatic PR creation for security updates
- Grouped updates for related packages
- Separate tracking for each workspace in monorepo

**Monitored Ecosystems**:
- npm packages (all workspaces)
- GitHub Actions workflows

### Static Code Analysis

**Tool**: OxLint (fast Rust-based linter)

**Purpose**: Catch common code quality and security issues during development.

**Configuration**: Various `oxlint.json` files per workspace

**Runs on**:
- Pre-commit hooks (local development)
- CI/CD pipeline (all pull requests)
- IDE integration (real-time feedback)

## Authentication & Authorization

### JWT Token Security

**Implementation**: `JwtAuthenticationService`

**Security Measures**:
- HS256 algorithm for token signing
- 7-day token expiration
- Secure secret key requirement (warns on default)
- Token verification on protected routes

**Best Practices**:
- Store JWT secret in environment variables
- Never commit secrets to repository
- Rotate secrets periodically
- Use HTTPS in production

### Password Security

**Implementation**: `BcryptPasswordService`

**Security Measures**:
- Bcrypt hashing with cost factor 12
- Version 2b (current standard)
- Automatic rehashing for outdated algorithms
- Constant-time comparison

**Password Requirements**:
- Minimum length enforced by domain validation
- Plaintext passwords never stored
- Hash validation before database storage

### OAuth Integration

**Provider**: Google OAuth 2.0

**Implementation**: `GoogleOAuthService`

**Security Measures**:
- PKCE flow for authorization
- State parameter for CSRF protection
- Secure token exchange
- Profile verification

## Data Protection

### Sensitive Data Handling

**Domain Layer**:
- `Password` value object ensures proper handling
- `Email` value object with validation
- Immutable value objects prevent tampering

**Infrastructure Layer**:
- Database encryption at rest (PostgreSQL configuration)
- Encrypted connections (SSL/TLS required in production)
- Secrets in environment variables only

### Error Handling

**Security Considerations**:
- Custom error classes prevent information leakage
- User-friendly messages for clients
- Detailed technical logs for debugging (server-side only)
- Never expose stack traces to clients in production

**Implementation**:
```typescript
// DomainError hierarchy provides controlled error exposure
throw new ValidationError(
  'ERROR_CODE',
  'Technical details for logs',
  'User-friendly message',
  { component: 'Service', operation: 'method' },
  ['Recovery suggestion']
);
```

## API Security

### Input Validation

**Framework**: NestJS with class-validator

**Measures**:
- DTO validation on all endpoints
- Type checking via TypeScript
- Whitelist mode (strip unknown properties)
- Forbidden non-whitelisted properties

**Example**:
```typescript
app.useGlobalPipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}));
```

### CORS Configuration

**Production**:
- Restrict origins to known domains
- Credentials enabled for authenticated requests
- Limited HTTP methods

**Development**:
- Relaxed for local testing
- Must be tightened before production deployment

### Rate Limiting

**Status**: Should be implemented in production

**Recommended**:
- Use `@nestjs/throttler` package
- Configure per-endpoint limits
- Implement progressive delays

## Domain Security

### Map Generation

**Security Considerations**:
- Seeds use standard random number generation (not cryptographic)
- Deterministic generation ensures reproducibility
- Seeds should not be used for security-sensitive operations

**Recommendations**:
- Treat seeds as public information
- Do not use map seeds for authentication or authorization
- Use cryptographic RNG for security-sensitive features

### Clean Architecture Boundaries

**Security Benefits**:
- Domain layer has no external dependencies
- Infrastructure layer isolated from business logic
- Dependency injection prevents direct coupling
- Easy to audit security-critical components

## Infrastructure Security

### Database Security

**PostgreSQL Configuration**:
- Connection pooling with TypeORM
- Parameterized queries prevent SQL injection
- User permissions properly scoped
- SSL connections in production

**Repository Pattern**:
- Abstract database access
- Consistent error handling
- Transaction management
- Query optimization

### Logging Security

**Implementation**: Custom `ILogger` interface

**Security Measures**:
- Structured logging with metadata
- Log levels for different environments
- No sensitive data in logs (passwords, tokens)
- Correlation IDs for request tracking

**Production Recommendations**:
- Use external log aggregation (e.g., ELK, DataDog)
- Set up alerts for security events
- Retain logs for audit purposes
- Protect log access with RBAC

## CI/CD Security

### Commit Validation

**Tools**: Commitlint + Conventional Commits

**Purpose**: Enforce consistent, auditable commit history

**Security Benefits**:
- Track who made what changes
- Link commits to issues/PRs
- Enable automated changelog generation

### Workflow Security

**GitHub Actions**:
- Minimal required permissions
- Secrets stored in GitHub Secrets
- Dependabot access restricted
- Workflow approval for external contributors

**Best Practices**:
- Pin action versions (avoid `@latest`)
- Use official actions when possible
- Review third-party actions before use
- Limit workflow permissions to minimum required

## Security Checklist for Developers

### Before Committing

- [ ] No secrets or API keys in code
- [ ] No console.log with sensitive data
- [ ] Input validation for all user inputs
- [ ] Proper error handling (no info leakage)
- [ ] Updated tests for security-sensitive changes

### Before Deploying

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL/TLS certificates valid
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Logging and monitoring active
- [ ] Secrets rotated if needed

### Regular Maintenance

- [ ] Review Dependabot PRs weekly
- [ ] Check CodeQL findings
- [ ] Update Node.js and dependencies
- [ ] Audit user permissions
- [ ] Review and rotate secrets quarterly
- [ ] Test backup and recovery procedures

## Incident Response

### Detection

**Monitoring Points**:
- CodeQL alerts (GitHub Security tab)
- Dependabot security advisories
- Application error logs
- Unusual user activity patterns

### Response Process

1. **Identify**: Determine scope and severity
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove vulnerability/threat
4. **Recover**: Restore normal operations
5. **Document**: Record incident details
6. **Review**: Update security measures

### Reporting

See [SECURITY.md](../../SECURITY.md) for vulnerability reporting procedures.

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [CodeQL Documentation](https://codeql.github.com/docs/)

---

**Last Updated**: 2025-11-17
**Owner**: Security Team
**Review Cycle**: Quarterly
