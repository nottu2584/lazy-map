# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of lazy-map seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it has been addressed

### Please DO:

1. **Report via GitHub Security Advisories** (preferred):
   - Go to the [Security tab](https://github.com/nottu2584/lazy-map/security)
   - Click "Report a vulnerability"
   - Provide detailed information about the vulnerability

2. **Or email the maintainers directly**:
   - Contact: [Add security contact email]
   - Include detailed steps to reproduce the vulnerability
   - Include potential impact and suggested fixes if available

### What to expect:

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Updates**: We will provide updates on the progress every 7 days
- **Timeline**: We aim to address critical vulnerabilities within 30 days
- **Credit**: We will credit you in the security advisory unless you prefer to remain anonymous

## Security Best Practices for Contributors

### Code Review
- All code changes require review before merging
- Security-sensitive changes require additional review
- Use of `eval()`, `new Function()`, or dynamic code execution requires justification

### Dependencies
- Keep dependencies up to date via Dependabot
- Review dependency security advisories regularly
- Avoid dependencies with known critical vulnerabilities

### Authentication & Authorization
- Never commit credentials, API keys, or secrets
- Use environment variables for sensitive configuration
- Implement proper authentication checks in all endpoints

### Input Validation
- Validate and sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper CORS policies

### Data Protection
- Encrypt sensitive data at rest and in transit
- Use secure password hashing (bcrypt with appropriate cost factor)
- Implement proper session management

## Security Scanning

This repository uses the following security measures:

- **CodeQL Analysis**: Automated code scanning for security vulnerabilities
- **Dependabot**: Automated dependency security updates
- **OxLint**: Static code analysis for common issues
- **Commit Validation**: Enforced conventional commits and code review

## Known Security Considerations

### Map Generation
- Map generation uses deterministic seeded random number generation
- Seeds should not be considered cryptographically secure
- Do not use map generation seeds for security-sensitive operations

### User Authentication
- JWT tokens have 7-day expiration
- Passwords are hashed using bcrypt with cost factor 12
- OAuth integration requires proper client configuration

### API Endpoints
- Rate limiting should be configured in production
- API responses should not leak sensitive error details
- Proper CORS configuration required for production deployment

## Security Changelog

### 2025-11-17
- Initial security policy created
- CodeQL analysis workflow added
- Security scanning configuration established

---

For general questions about security practices in this project, please open a discussion in the repository's Discussions tab.
