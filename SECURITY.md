# Security Policy for Torqued Affiliates

_Last Updated: November 28, 2025_

## Summary
Torqued Affiliates takes security seriously. This document describes how to report vulnerabilities, what we will do in response, and how we manage security for the project (GitHub Pages + Shopify UI + Tailwind + Java/npm build).

## Supported Versions
We actively support the following versions with security updates:

| Version | Supported | End of Life |
| ------- | --------- | ----------- |
| 2.x.x   | :white_check_mark: | TBD |
| 1.5.x   | :white_check_mark: | 2026-06-30 |
| 1.0.x   | :x:               | 2025-03-01 |
| < 1.0   | :x:               | 2024-08-15 |

## Reporting a Vulnerability
We appreciate responsible disclosure. Please use one of the methods below.

### Preferred: GitHub Private Vulnerability Reporting
1. Go to the repository Security tab
2. Click "Report a vulnerability"
3. Fill the advisory form with details

### Alternative: Email
- Send to: `security@torqued-affiliates.example`
- For sensitive reports, use PGP: link to public key (if available)

### What to Include
- Vulnerability type (XSS, CSRF, RCE, supply chain, affiliate tracking abuse)
- Affected components and versions
- Step-by-step reproduction with PoC code or screenshots
- Potential impact and suggested mitigation
- CVSS score if available

## Response Timeline
- Acknowledgement: within 2 business days
- Initial assessment: within 5 business days
- Status updates: every 14 days until resolved
- Resolution targets:
  - Critical (CVSS 9-10): 30 days
  - High (CVSS 7-8.9): 60 days
  - Medium (CVSS 4-6.9): 90 days
  - Low (CVSS 0.1-3.9): 120 days
- Disclosure policy: coordinated disclosure, default 90-day private window; public disclosure 30 days after patch release (or earlier by agreement).

## Safe Harbor
Researchers who follow this policy and act in good faith will not be subject to legal action for the tested activity described here, provided they avoid privacy violations, service disruptions, or data exfiltration beyond proof-of-concept.

## Security Configuration & Best Practices
### Deployment checklist
- Keep dependencies up to date
- Use `npm ci` in CI and commit `package-lock.json`
- Store secrets in environment variables or secret managers (Azure Key Vault / AWS / GCP)
- Enable HTTPS and enforce TLS
- Use least-privilege access and RBAC for integrations
- Enable logging, monitoring, and rate limiting

### GitHub Pages specific
- Enforce HTTPS in Pages settings
- Do not store secrets or PII in the repo or in pages artifacts
- Verify custom domain ownership and DNS configuration

### Tailwind, Shopify UI and scripts
- Avoid dynamic Tailwind classes from user input
- Sanitize user-provided content (DOMPurify or similar)
- Implement CSP and SRI for third-party scripts

## Build and CI Security
- Use Dependabot and weekly dependency scanning
- Run `npm audit` and OWASP dependency-check during CI
- Pin Actions to exact SHAs in production workflows
- Use OIDC and environment protection rules for secrets

## Affiliate Tracking & Privacy
Affiliate tracking scripts and pixels must be vetted, pinned (SRI), and restricted by CSP. Follow GDPR/CCPA rules: explicit consent, opt-out, and limited retention (recommend 90 days).

## Incident Response
1. Contain and assess within 24 hours
2. Patch and validate fix (24-72 hours)
3. Notify stakeholders and publish advisories after coordinated disclosure

## Contacts
- Security: `security@torqued-affiliates.example`
- Infrastructure: `ops@torqued-affiliates.example`
- Legal: `legal@torqued-affiliates.example`

## Additional Resources
- GitHub Security Docs
- OWASP Top 10
- npm Security Best Practices

---

If you need, I can also add a `security.txt` and an email PGP key block, enable Private Vulnerability Reporting in repository settings, and wire Dependabot and CodeQL via GitHub Actions. Let me know which of those to enable next.