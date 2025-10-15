# 🤝 Contributing to infra-cost

Thank you for your interest in contributing to infra-cost! We welcome contributions from developers of all skill levels and backgrounds. This guide will help you get started.

## 🌟 Ways to Contribute

### For Everyone
- ⭐ **Star this repository** - Show your support and help others discover the project
- 🐛 **Report bugs** - Help us identify and fix issues
- 💡 **Suggest features** - Share your ideas for improvements
- 📝 **Improve documentation** - Help others understand the project better
- 🗣️ **Spread the word** - Share the project on social media, blogs, or with colleagues

### For Developers
- 🔧 **Fix bugs** - Contribute code fixes
- ✨ **Add features** - Implement new functionality
- 🌐 **Add cloud provider support** - Help us expand to more providers
- 🧪 **Write tests** - Improve code quality and reliability
- 📦 **Improve tooling** - Enhance the development experience

### For Technical Writers
- 📚 **Write guides** - Create tutorials and how-to guides
- 📖 **API documentation** - Document functions and interfaces
- 🎥 **Create videos** - Make video tutorials or demos
- 🌐 **Translate** - Help make the project accessible in other languages

## 🚀 Getting Started

### 1. Fork and Clone
```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/infra-cost.git
cd infra-cost

# Add upstream remote
git remote add upstream https://github.com/codecollab-co/infra-cost.git
```

### 2. Set up Development Environment
```bash
# Install Node.js 18+ and npm

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Check everything works
./bin/index.js --version
```

### 3. Create a Feature Branch
```bash
# Create a new branch from main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

## 🏗️ Development Workflow

### Project Structure
```
infra-cost/
├── src/
│   ├── providers/          # Cloud provider implementations
│   │   ├── aws.ts         # AWS implementation
│   │   ├── gcp.ts         # Google Cloud (template)
│   │   └── factory.ts     # Provider factory
│   ├── analytics/         # Cost analysis and AI features
│   ├── optimization/      # Cost optimization engines
│   ├── visualization/     # Dashboards and charts
│   ├── integrations/      # Third-party integrations
│   ├── enterprise/        # Multi-tenant features
│   └── index.ts          # Main CLI entry point
├── tests/                 # Test files
├── bin/                   # Executable scripts
└── docs/                  # Documentation
```

### Development Commands
```bash
# Build for development (with source maps)
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Clean build artifacts
npm run clean
```

### Code Style Guidelines

#### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow the existing code style (ESLint configuration)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`
- Use async/await instead of Promises where possible

#### Example Code Style
```typescript
/**
 * Retrieves cost data for a specific cloud provider
 * @param provider The cloud provider to query
 * @param options Configuration options for the query
 * @returns Promise resolving to cost data
 */
export async function getCostData(
  provider: CloudProvider,
  options: CostQueryOptions
): Promise<CostData> {
  const client = ProviderFactory.create(provider, options);

  try {
    const data = await client.getCostBreakdown();
    return formatCostData(data);
  } catch (error) {
    throw new InfraCostError(`Failed to retrieve cost data: ${error.message}`);
  }
}
```

#### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(aws): add support for Reserved Instance recommendations
fix(cli): resolve authentication error with SSO profiles
docs(readme): update installation instructions
test(providers): add unit tests for GCP provider
chore(deps): update dependencies to latest versions
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `test`: Test additions or modifications
- `chore`: Maintenance tasks
- `refactor`: Code refactoring
- `perf`: Performance improvements

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- providers/aws.test.ts
```

### Writing Tests
- Write tests for all new features
- Maintain or improve test coverage
- Use descriptive test names
- Mock external dependencies (AWS API calls, etc.)

#### Example Test
```typescript
import { AWSProvider } from '../src/providers/aws';

describe('AWSProvider', () => {
  let provider: AWSProvider;

  beforeEach(() => {
    provider = new AWSProvider({
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      region: 'us-east-1'
    });
  });

  describe('getCostBreakdown', () => {
    it('should return cost data with proper structure', async () => {
      // Mock AWS SDK calls
      const mockCostData = { /* mock data */ };
      jest.spyOn(provider, 'fetchCostData').mockResolvedValue(mockCostData);

      const result = await provider.getCostBreakdown();

      expect(result).toHaveProperty('totals');
      expect(result).toHaveProperty('services');
      expect(result.totals.thisMonth).toBeGreaterThanOrEqual(0);
    });
  });
});
```

## 🌐 Adding Cloud Provider Support

### 1. Create Provider Implementation
```typescript
// src/providers/newprovider.ts
import { CloudProvider, ProviderConfig, CostBreakdown } from '../types/providers';

export class NewProviderProvider implements CloudProvider {
  constructor(private config: ProviderConfig) {}

  async validateCredentials(): Promise<boolean> {
    // Implement credential validation
  }

  async getAccountInfo(): Promise<AccountInfo> {
    // Implement account information retrieval
  }

  async getCostBreakdown(): Promise<CostBreakdown> {
    // Implement cost data retrieval
  }

  // Implement other required methods...
}
```

### 2. Register in Factory
```typescript
// src/providers/factory.ts
import { NewProviderProvider } from './newprovider';

// Add to the factory
case CloudProvider.NEWPROVIDER:
  return new NewProviderProvider(config);
```

### 3. Add CLI Options
```typescript
// src/index.ts
program
  .option('--new-provider-key [key]', 'New Provider API key')
  .option('--new-provider-secret [secret]', 'New Provider secret');
```

### 4. Add Tests
```typescript
// tests/providers/newprovider.test.ts
describe('NewProviderProvider', () => {
  // Add comprehensive tests
});
```

## 📋 Pull Request Process

### Before Submitting
1. **Test your changes** - Ensure all tests pass
2. **Check code style** - Run `npm run lint`
3. **Update documentation** - If you're adding features
4. **Write tests** - For new functionality
5. **Sync with upstream** - Rebase on latest main

### Submitting Your PR
1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub with:
   - Clear title and description
   - Link to related issues
   - Screenshots for UI changes
   - Test results

3. **PR Template** (automatically added):
   ```markdown
   ## Description
   Brief description of the changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tests added/updated
   - [ ] All tests passing
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows project style
   - [ ] Self-review completed
   - [ ] Documentation updated
   ```

### PR Review Process
1. **Automated checks** run (tests, linting, building)
2. **Maintainer review** - We'll provide constructive feedback
3. **Iteration** - Make requested changes
4. **Approval and merge** - Once everything looks good!

## 🎯 Good First Issues

Looking for a place to start? Look for issues labeled:
- `good first issue` - Perfect for newcomers
- `help wanted` - We'd love community help
- `documentation` - Great for non-code contributions

### Suggested First Contributions
- Fix typos in documentation
- Add examples to README
- Write tests for existing functions
- Improve error messages
- Add support for new AWS services
- Create GitHub issue templates

## 🏷️ Issue Guidelines

### Reporting Bugs
Use the bug report template and include:
- **Environment**: OS, Node.js version, npm version
- **Steps to reproduce**: Detailed steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Logs**: Relevant error messages or output

### Suggesting Features
Use the feature request template and include:
- **Problem**: What problem does this solve?
- **Solution**: Describe your proposed solution
- **Alternatives**: Other approaches you've considered
- **Use cases**: How would this be used?

### Questions and Discussions
- Check existing issues and discussions first
- Use GitHub Discussions for general questions
- Be specific and provide context

## 🌍 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions

### Communication
- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, showcase
- **Twitter**: [@codecollabco](https://twitter.com/codecollabco) - Updates and announcements

## 🎓 Learning Resources

### TypeScript & Node.js
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)

### Cloud Cost Management
- [AWS Cost Explorer](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/ce-what-is.html)
- [GCP Billing API](https://cloud.google.com/billing/docs)
- [Azure Cost Management](https://docs.microsoft.com/en-us/azure/cost-management-billing/)

### FinOps
- [FinOps Foundation](https://www.finops.org/)
- [Cloud Cost Optimization Best Practices](https://aws.amazon.com/aws-cost-management/cost-optimization/)

## 🏆 Recognition

### Contributors
All contributors are recognized in:
- GitHub contributors page
- Release notes for significant contributions
- README mentions for major features

### Becoming a Maintainer
Regular contributors who demonstrate:
- Technical expertise
- Good communication skills
- Community helpfulness
- Consistent high-quality contributions

May be invited to join the maintainer team!

## 📞 Getting Help

Stuck? Need help? Reach out:
- **GitHub Discussions**: [Ask questions](https://github.com/codecollab-co/infra-cost/discussions)
- **GitHub Issues**: [Create an issue](https://github.com/codecollab-co/infra-cost/issues)
- **Email**: contributors@codecollab.co

## 🙏 Thank You!

Every contribution, no matter how small, helps make infra-cost better for everyone. We're excited to see what you'll build!

---

**Happy coding! 🚀**

*The infra-cost maintainers*