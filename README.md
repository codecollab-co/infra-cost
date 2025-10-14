# infra-cost

> Multi-cloud CLI tool for cost analysis across AWS, Google Cloud, Azure, Alibaba Cloud, and Oracle Cloud with Slack integration

## 🚀 Features

- **Multi-cloud support**: AWS, Google Cloud (GCP), Microsoft Azure, Alibaba Cloud, Oracle Cloud
- **Enhanced Slack integration**: Detailed cost breakdowns with service-level insights
- **Flexible authentication**: Environment variables, IAM roles, profiles, and explicit credentials
- **Multiple output formats**: Fancy tables, plain text, JSON
- **Automated publishing**: npm and Homebrew with CI/CD pipelines
- **Modern AWS SDK v3**: Enhanced performance and security

## 📦 Installation

### npm (Recommended)
```bash
npm install -g infra-cost
```

### Homebrew
```bash
brew install codecollab-co/tap/infra-cost
```

### npx (No installation required)
```bash
npx infra-cost
```

## 🎯 Quick Start

### AWS (Default Provider)
```bash
# Using default AWS credentials
infra-cost

# Using specific credentials
infra-cost --access-key YOUR_KEY --secret-key YOUR_SECRET --region us-east-1
```

### Multi-Cloud Usage
```bash
# Google Cloud Platform
infra-cost --provider gcp --project-id my-project --key-file /path/to/service-account.json

# Microsoft Azure
infra-cost --provider azure --subscription-id sub-id --tenant-id tenant-id --client-id client-id --client-secret secret

# Alibaba Cloud
infra-cost --provider alicloud --access-key key --secret-key secret --region cn-hangzhou

# Oracle Cloud Infrastructure
infra-cost --provider oracle --user-id user-ocid --tenancy-id tenancy-ocid --fingerprint fingerprint --key-file /path/to/private-key
```

## 🔧 Usage

### Command Line Options

```bash
infra-cost [options]

Cloud Provider Options:
  --provider [provider]           Cloud provider (aws, gcp, azure, alicloud, oracle) (default: "aws")
  -p, --profile [profile]         Cloud provider profile to use (default: "default")
  -r, --region [region]           Cloud provider region (default: "us-east-1")

AWS/Generic Credentials:
  -k, --access-key [key]          Access key (AWS Access Key, etc.)
  -s, --secret-key [key]          Secret key (AWS Secret Key, etc.)
  -T, --session-token [key]       Session token (AWS Session Token, etc.)

Google Cloud Options:
  --project-id [id]               GCP Project ID
  --key-file [path]               Path to service account JSON file

Azure Options:
  --subscription-id [id]          Azure Subscription ID
  --tenant-id [id]                Azure Tenant ID
  --client-id [id]                Azure Client ID
  --client-secret [secret]        Azure Client Secret

Alibaba Cloud Options:
  (Uses --access-key and --secret-key)

Oracle Cloud Options:
  --user-id [id]                  Oracle User OCID
  --tenancy-id [id]               Oracle Tenancy OCID
  --fingerprint [fingerprint]     Oracle Public Key Fingerprint
  --key-file [path]               Path to private key file

Output Options:
  -j, --json                      Get the output as JSON
  -u, --summary                   Get only the summary without service breakdown
  -t, --text                      Get the output as plain text (no colors/tables)

Slack Integration:
  -S, --slack-token [token]       Token for the slack integration
  -C, --slack-channel [channel]   Channel to which the slack integration should post

Other Options:
  -V, --version                   output the version number
  -h, --help                      display help for command
```

## 🔐 Authentication

### AWS Authentication (Multiple Methods Supported)

#### 1. Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
infra-cost
```

#### 2. AWS Profiles
```bash
# Use default profile
infra-cost

# Use specific profile
infra-cost --profile production
```

#### 3. IAM Roles (EC2/Lambda/ECS)
When running on AWS infrastructure, the CLI automatically uses IAM roles:
```bash
infra-cost  # Automatically uses attached IAM role
```

#### 4. AWS SSO
```bash
aws sso login --profile my-sso-profile
infra-cost --profile my-sso-profile
```

#### 5. Explicit Credentials
```bash
infra-cost --access-key KEY --secret-key SECRET --region us-east-1
```

### Other Cloud Providers

**Note**: Multi-cloud providers (GCP, Azure, Alibaba Cloud, Oracle Cloud) are currently in development. The architecture is ready, but API integrations are not yet implemented. Use AWS for full functionality.

## 📊 Output Formats

### 1. Default Fancy Output
```bash
infra-cost
```
![Cost](./.github/images/aws-cost.png)

### 2. Summary Only
```bash
infra-cost --summary
```
![Summary](./.github/images/aws-cost-summary.png)

### 3. Plain Text
```bash
infra-cost --text
```

### 4. JSON Output
```bash
infra-cost --json
```

## 💬 Slack Integration

### Enhanced Slack Features
- **Comprehensive cost breakdown** for all time periods
- **Service-level details** including Last 7 Days data
- **Rich formatting** with blocks and sections
- **Automated workflows** support

### Setup
1. Create a [Slack app](https://api.slack.com/apps?new_app=1)
2. Add `chat:write` and `chat:write.public` scopes
3. Get your OAuth token and channel ID

### Usage
```bash
infra-cost --slack-token xoxb-your-token --slack-channel C1234567890
```

### Automated Daily Reports
Set up a GitHub workflow to send daily cost reports:

```yaml
name: Daily AWS Costs
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC daily
jobs:
  costs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          npx infra-cost \
            --slack-token ${{ secrets.SLACK_TOKEN }} \
            --slack-channel ${{ secrets.SLACK_CHANNEL }}
```

## 🏗️ Development & Publishing

### npm Publishing
This project includes automated npm publishing with semantic versioning:

```bash
# Check version status
npm run version:check

# Bump version
npm run version:bump:patch
npm run version:bump:minor
npm run version:bump:major

# Dry run publish
npm run publish:dry

# Manual publish
npm run publish:latest
npm run publish:beta
```

### Homebrew Publishing
Automated Homebrew formula updates via GitHub Actions:

```bash
# Prepare release (interactive)
npm run prepare-release

# This will:
# 1. Update version in package.json
# 2. Update Homebrew formula
# 3. Run tests and build
# 4. Create git tag
# 5. Trigger release workflow
```

## 🔧 Development

### Build
```bash
npm run build
```

### Type Checking
```bash
npm run typecheck
```

### Version Management
```bash
npm run version:check     # Check current version status
npm run version:next      # Get next version
npm run version:set       # Set specific version
```

## 📋 Requirements & Permissions

### AWS Permissions Required
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "InfraCostPermissions",
      "Effect": "Allow",
      "Action": [
        "iam:ListAccountAliases",
        "ce:GetCostAndUsage",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

### Cost Considerations
- **AWS Cost Explorer**: $0.01 per request
- **Other providers**: Varies by provider's pricing model

## 🏗️ Architecture

### Multi-Cloud Provider Pattern
```
src/
├── providers/
│   ├── factory.ts     # Provider factory
│   ├── aws.ts         # AWS implementation ✅
│   ├── gcp.ts         # Google Cloud (placeholder)
│   ├── azure.ts       # Azure (placeholder)
│   ├── alicloud.ts    # Alibaba Cloud (placeholder)
│   └── oracle.ts      # Oracle Cloud (placeholder)
├── types/
│   └── providers.ts   # Common interfaces
└── ...
```

### Key Features
- **Abstract provider interface** for consistent API
- **Factory pattern** for provider instantiation
- **Extensible architecture** for adding new cloud providers
- **Type-safe implementation** with TypeScript

## 🚀 CI/CD Pipelines

### Automated Workflows
- **npm publishing** with semantic versioning
- **Homebrew formula updates**
- **Release automation** with GitHub Actions
- **Multi-platform testing** (Node.js 16, 18, 20)

### Quality Assurance
- **TypeScript compilation** checking
- **Security auditing** with npm audit
- **Dependency validation**
- **Build verification**

## 📚 Documentation

- [Homebrew Setup Guide](./HOMEBREW_SETUP.md)
- [npm Publishing Guide](./NPM_PUBLISHING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run typecheck` and `npm run build`
5. Submit a pull request

## 📄 License

MIT © [Code Collab](https://github.com/codecollab-co)

---

## 🔄 Recent Updates

### v0.1.0 - Multi-Cloud Architecture
- ✅ **Multi-cloud provider support** (architecture ready)
- ✅ **Enhanced Slack integration** with detailed breakdowns
- ✅ **AWS SDK v3 upgrade** for better performance
- ✅ **IAM roles and environment variables** support
- ✅ **Automated npm and Homebrew publishing**
- ✅ **Critical bug fixes** and consistency improvements

### Migration from aws-cost-cli
This tool has evolved from `aws-cost-cli` to `infra-cost` with backward compatibility maintained. Both `infra-cost` and `aws-cost` commands work.

---

*For questions or support, please [create an issue](https://github.com/codecollab-co/infra-cost/issues) on GitHub.*