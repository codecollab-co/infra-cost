# Security Policy

## Supported Versions

We actively support the following versions of infra-cost with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | ✅ Yes             |
| 0.1.x   | ⚠️ Limited Support |
| < 0.1.0 | ❌ No              |

## Reporting a Vulnerability

We take the security of infra-cost seriously. If you discover a security vulnerability, please follow these steps:

### 🔒 Private Disclosure

**Do NOT create a public GitHub issue for security vulnerabilities.**

Instead, please report security vulnerabilities privately:

1. **Email**: security@codecollab.co
2. **Subject**: "Security Vulnerability in infra-cost"
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### 🕒 Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 72 hours
- **Fix Development**: Within 7 days for critical issues
- **Public Disclosure**: After fix is released (coordinated disclosure)

### 🛡️ Security Best Practices

When using infra-cost, please follow these security practices:

#### Credential Management
- Never commit AWS credentials or API keys to version control
- Use IAM roles when running on AWS infrastructure
- Regularly rotate access keys
- Use least-privilege access principles

#### Environment Security
- Keep infra-cost updated to the latest version
- Use secure networks when accessing cloud APIs
- Audit your cloud provider permissions regularly

#### Data Protection
- Be aware that cost data might contain sensitive information
- Use secure channels when sharing reports
- Consider data retention policies for exported reports

### 🏆 Security Hall of Fame

We appreciate security researchers who help keep infra-cost secure:

<!-- Future contributors will be listed here -->

### 🔧 Security Features

infra-cost includes the following security features:

- **No data persistence**: Cost data is not stored locally by default
- **Read-only permissions**: Only requires read access to cost APIs
- **Secure authentication**: Supports multiple secure authentication methods
- **Audit logging**: Optional audit trail for compliance requirements

### 📞 Contact

For security-related questions or concerns:

- **Security Email**: security@codecollab.co
- **General Issues**: [GitHub Issues](https://github.com/codecollab-co/infra-cost/issues)
- **Website**: https://codecollab.co

---

*Last updated: October 2024*