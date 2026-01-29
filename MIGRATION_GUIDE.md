# infra-cost v1.0 Migration Guide

This guide helps you migrate from infra-cost v0.x to v1.0 with the new subcommand-based CLI architecture.

## Table of Contents

- [What's Changed](#whats-changed)
- [Quick Start](#quick-start)
- [Automated Migration](#automated-migration)
- [CLI Command Mapping](#cli-command-mapping)
- [Configuration Changes](#configuration-changes)
- [Breaking Changes](#breaking-changes)
- [Migration Examples](#migration-examples)

---

## What's Changed

### Major Changes in v1.0

1. **Subcommand-Based CLI**: Commands now use nested subcommand structure
   - Old: `infra-cost --inventory`
   - New: `infra-cost export inventory json`

2. **Unified Configuration**: Single configuration system replacing multiple formats

3. **Domain-Organized Commands**: Commands grouped by purpose (cost, optimize, monitor, etc.)

4. **Improved Architecture**: Clean separation between CLI, core logic, and providers

---

## Quick Start

### Install v1.0

```bash
npm install -g infra-cost@latest
```

### Run Migration Tool

```bash
infra-cost config migrate
```

This will:
- ✅ Discover your old configuration files
- ✅ Convert them to the new format
- ✅ Create backups automatically
- ✅ Show you the CLI migration guide

---

## Automated Migration

### Migrate Configuration Files

The migration tool handles configuration automatically:

```bash
# Preview changes without modifying files
infra-cost config migrate --dry-run

# Apply migration
infra-cost config migrate
```

**What it does:**
- Finds config files in standard locations
- Converts old format to new schema
- Creates `.backup` files for safety
- Validates new configuration

### Configuration File Locations

The tool searches for config files in:
- `./infra-cost.config.json`
- `./.infra-cost.config.json`
- `./.infra-cost/config.json`
- `~/.infra-cost/config.json`
- `~/.config/infra-cost/config.json`

---

## CLI Command Mapping

### Cost Analysis

| Old Command | New Command | Description |
|------------|-------------|-------------|
| `infra-cost` | `infra-cost cost analyze` | Default cost analysis |
| `infra-cost --delta` | `infra-cost cost analyze --show-delta` | Show cost deltas |
| `infra-cost --trends 30` | `infra-cost cost trends --period 30d` | Cost trends |
| `infra-cost --compare-clouds aws,gcp` | `infra-cost cost compare --providers aws,gcp` | Multi-cloud comparison |

### Optimization

| Old Command | New Command | Description |
|------------|-------------|-------------|
| `infra-cost --finops` | `infra-cost optimize recommendations` | Get recommendations |
| `infra-cost --quick-wins` | `infra-cost optimize quickwins` | Quick win opportunities |
| `infra-cost --optimization-report` | `infra-cost optimize cross-cloud` | Cross-cloud optimization |

### Monitoring

| Old Command | New Command | Description |
|------------|-------------|-------------|
| `infra-cost --alerts` | `infra-cost monitor alerts` | Cost alerts |
| `infra-cost --budgets` | `infra-cost monitor budgets` | Budget tracking |

### Export

| Old Command | New Command | Description |
|------------|-------------|-------------|
| `infra-cost --inventory` | `infra-cost export inventory json` | Export inventory |
| `infra-cost --inventory-export csv` | `infra-cost export inventory csv` | Export as CSV |
| `infra-cost --inventory-export xlsx` | `infra-cost export inventory xlsx` | Export as Excel |

### Organizations

| Old Command | New Command | Description |
|------------|-------------|-------------|
| `infra-cost --organizations` | `infra-cost organizations list` | List accounts |
| `infra-cost --organizations-summary` | `infra-cost organizations summary` | Multi-account summary |
| `infra-cost --organizations-daily` | `infra-cost organizations daily` | Daily breakdown |

### Chargeback

| Old Command | New Command | Description |
|------------|-------------|-------------|
| `infra-cost --chargeback` | `infra-cost chargeback report` | Generate report |
| `infra-cost --chargeback-slack` | `infra-cost chargeback slack` | Send to Slack |

### Dashboard

| Old Command | New Command | Description |
|------------|-------------|-------------|
| `infra-cost --dashboard` | `infra-cost dashboard interactive` | Interactive terminal UI |
| `infra-cost --dashboard-multicloud` | `infra-cost dashboard multicloud` | Multi-cloud dashboard |

### Configuration

| Old Command | New Command | Description |
|------------|-------------|-------------|
| `infra-cost --config-status` | `infra-cost config show` | Show current config |
| `infra-cost --config-generate` | `infra-cost config init` | Initialize config |
| `infra-cost --config-validate` | `infra-cost config validate` | Validate config |

---

## Configuration Changes

### Old Configuration Format (v0.x)

```json
{
  "provider": "aws",
  "profile": "default",
  "region": "us-east-1",
  "cache": true,
  "output": {
    "format": "fancy"
  }
}
```

### New Configuration Format (v1.0)

```json
{
  "version": "1.0",
  "provider": {
    "provider": "aws",
    "profile": "default",
    "region": "us-east-1"
  },
  "output": {
    "format": "fancy",
    "showDelta": true,
    "showQuickWins": true,
    "deltaThreshold": 10,
    "quickWinsCount": 3
  },
  "cache": {
    "enabled": true,
    "ttl": "4h",
    "type": "file"
  },
  "logging": {
    "level": "info",
    "format": "pretty",
    "auditEnabled": false
  }
}
```

### Key Differences

1. **Nested Structure**: Settings grouped by category
2. **Version Field**: Explicit version tracking
3. **Enhanced Options**: More granular control (delta threshold, quick wins count)
4. **Logging Configuration**: Structured logging settings

---

## Breaking Changes

### 1. CLI Syntax

**All flag-based commands now use subcommands:**

```bash
# ❌ Old (no longer works)
infra-cost --inventory --provider aws

# ✅ New
infra-cost export inventory json --provider aws
```

### 2. Configuration File Structure

Old flat structure replaced with nested format (see above).

### 3. Option Names

Some options renamed for clarity:

| Old | New | Reason |
|-----|-----|--------|
| `--no-delta` | `--no-show-delta` | More explicit |
| `--quick-wins` | Part of `optimize quickwins` | Now a subcommand |

### 4. Default Behavior

- **v0.x**: Running `infra-cost` showed basic cost analysis
- **v1.0**: Must specify subcommand: `infra-cost cost analyze`

---

## Migration Examples

### Example 1: Basic Cost Analysis

**Before (v0.x):**
```bash
infra-cost --provider aws --region us-east-1
```

**After (v1.0):**
```bash
infra-cost cost analyze --provider aws --region us-east-1
```

### Example 2: Inventory Export

**Before (v0.x):**
```bash
infra-cost --inventory --inventory-export json
```

**After (v1.0):**
```bash
infra-cost export inventory json
```

### Example 3: Optimization Recommendations

**Before (v0.x):**
```bash
infra-cost --finops --provider aws
```

**After (v1.0):**
```bash
infra-cost optimize recommendations --provider aws
```

### Example 4: Multi-Cloud Comparison

**Before (v0.x):**
```bash
infra-cost --compare-clouds aws,gcp,azure
```

**After (v1.0):**
```bash
infra-cost cost compare --providers aws,gcp,azure
```

### Example 5: Organizations Summary

**Before (v0.x):**
```bash
infra-cost --organizations-summary
```

**After (v1.0):**
```bash
infra-cost organizations summary
```

---

## Global Options

Good news! **All global options remain the same:**

```bash
--provider <provider>    # Cloud provider
--profile <profile>      # Profile name
--region <region>        # Cloud region
--config-file <path>     # Config file path
--output <format>        # Output format
--log-level <level>      # Logging level
--no-cache               # Disable caching
--help                   # Show help
--version                # Show version
```

These work with ALL commands:

```bash
infra-cost cost analyze --provider gcp --region us-central1
infra-cost optimize recommendations --profile production
infra-cost export inventory json --output json
```

---

## Getting Help

### Command-Specific Help

Each command and subcommand has detailed help:

```bash
# Main help
infra-cost --help

# Command group help
infra-cost cost --help
infra-cost optimize --help
infra-cost monitor --help

# Specific command help
infra-cost cost analyze --help
infra-cost optimize recommendations --help
```

### Migration Tool Help

```bash
infra-cost config migrate --help
```

---

## Troubleshooting

### Problem: "Command not found"

**Solution:** Update to v1.0
```bash
npm install -g infra-cost@latest
```

### Problem: "Invalid command"

**Solution:** Check the command mapping table above or run:
```bash
infra-cost config migrate
```
This will show you the CLI migration guide.

### Problem: "Configuration error"

**Solution:** Migrate your config file:
```bash
infra-cost config migrate
```

Then validate it:
```bash
infra-cost config validate
```

### Problem: "Old scripts not working"

**Solution:** Update your scripts with new commands:

**Old script:**
```bash
#!/bin/bash
infra-cost --inventory --provider aws > inventory.json
```

**New script:**
```bash
#!/bin/bash
infra-cost export inventory json --provider aws > inventory.json
```

---

## Migration Checklist

- [ ] Install infra-cost v1.0
- [ ] Run `infra-cost config migrate` to update config files
- [ ] Review migrated configuration
- [ ] Update shell scripts and automation
- [ ] Update CI/CD pipelines
- [ ] Test key workflows
- [ ] Update documentation
- [ ] Train team members on new commands

---

## Support

If you encounter issues during migration:

1. **Check the migration guide**: You're reading it! 📖
2. **Run the migration tool**: `infra-cost config migrate`
3. **Check command help**: `infra-cost <command> --help`
4. **Open an issue**: [GitHub Issues](https://github.com/codecollab-co/infra-cost/issues)

---

## What's Next?

After migrating, explore the new features:

```bash
# Try the new dashboard
infra-cost dashboard interactive

# Get quick wins
infra-cost optimize quickwins

# Monitor costs in real-time
infra-cost monitor watch

# Generate chargeback reports
infra-cost chargeback report
```

---

**Welcome to infra-cost v1.0!** 🎉
