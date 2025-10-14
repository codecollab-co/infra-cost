#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warn(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch (err) {
    error(`Failed to execute: ${command}`);
    error(err.message);
    process.exit(1);
  }
}

function getPackageInfo() {
  const packagePath = join(process.cwd(), 'package.json');
  try {
    return JSON.parse(readFileSync(packagePath, 'utf-8'));
  } catch (err) {
    error('Could not read package.json');
    process.exit(1);
  }
}

function updatePackageVersion(newVersion) {
  const packagePath = join(process.cwd(), 'package.json');
  const pkg = getPackageInfo();
  pkg.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
}

function validateVersion(version) {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*|[0-9a-zA-Z-]*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*|[0-9a-zA-Z-]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}

function getNextVersion(currentVersion, versionType) {
  const [major, minor, patch] = currentVersion.split('-')[0].split('.').map(Number);

  switch (versionType) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    case 'prerelease':
      if (currentVersion.includes('-')) {
        // Increment prerelease
        const [base, prerelease] = currentVersion.split('-');
        const prereleaseMatch = prerelease.match(/(.+?)\.?(\d+)?$/);
        if (prereleaseMatch) {
          const [, label, num] = prereleaseMatch;
          const nextNum = num ? parseInt(num) + 1 : 1;
          return `${base}-${label}.${nextNum}`;
        }
        return `${base}-beta.1`;
      } else {
        // Create new prerelease
        return `${major}.${minor}.${patch + 1}-beta.0`;
      }
    default:
      throw new Error(`Unknown version type: ${versionType}`);
  }
}

async function checkNpmVersion(version) {
  try {
    execSync(`npm view infra-cost@${version} version`, { encoding: 'utf-8', stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function isGitClean() {
  try {
    const status = execCommand('git status --porcelain');
    return status === '';
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    log('Usage: node version-manager.js <command> [options]');
    log('Commands:');
    log('  bump <type>    - Bump version (patch, minor, major, prerelease)');
    log('  set <version>  - Set specific version');
    log('  check          - Check current version and npm status');
    log('  next <type>    - Show what next version would be');
    process.exit(1);
  }

  const pkg = getPackageInfo();
  const currentVersion = pkg.version;

  switch (command) {
    case 'check': {
      info(`Current version: ${currentVersion}`);

      const versionExists = await checkNpmVersion(currentVersion);
      if (versionExists) {
        warn(`Version ${currentVersion} already exists on npm`);
      } else {
        success(`Version ${currentVersion} is available for publishing`);
      }

      if (!isGitClean()) {
        warn('Git working directory is not clean');
      } else {
        success('Git working directory is clean');
      }
      break;
    }

    case 'next': {
      const versionType = args[1];
      if (!versionType) {
        error('Version type is required (patch, minor, major, prerelease)');
        process.exit(1);
      }

      try {
        const nextVersion = getNextVersion(currentVersion, versionType);
        info(`Current: ${currentVersion}`);
        info(`Next ${versionType}: ${nextVersion}`);

        const exists = await checkNpmVersion(nextVersion);
        if (exists) {
          warn(`Version ${nextVersion} already exists on npm`);
        } else {
          success(`Version ${nextVersion} is available`);
        }
      } catch (err) {
        error(err.message);
        process.exit(1);
      }
      break;
    }

    case 'bump': {
      const versionType = args[1];
      if (!versionType) {
        error('Version type is required (patch, minor, major, prerelease)');
        process.exit(1);
      }

      if (!isGitClean()) {
        error('Git working directory must be clean before bumping version');
        process.exit(1);
      }

      try {
        const newVersion = getNextVersion(currentVersion, versionType);
        const exists = await checkNpmVersion(newVersion);

        if (exists) {
          error(`Version ${newVersion} already exists on npm`);
          process.exit(1);
        }

        updatePackageVersion(newVersion);
        success(`Version bumped from ${currentVersion} to ${newVersion}`);

        // Update package-lock.json if it exists
        try {
          execCommand('npm install --package-lock-only');
          success('Updated package-lock.json');
        } catch {
          warn('Could not update package-lock.json');
        }

      } catch (err) {
        error(err.message);
        process.exit(1);
      }
      break;
    }

    case 'set': {
      const newVersion = args[1];
      if (!newVersion) {
        error('Version is required');
        process.exit(1);
      }

      if (!validateVersion(newVersion)) {
        error('Invalid version format. Use semantic versioning (e.g., 1.0.0, 1.0.0-beta.1)');
        process.exit(1);
      }

      if (!isGitClean()) {
        error('Git working directory must be clean before setting version');
        process.exit(1);
      }

      const exists = await checkNpmVersion(newVersion);
      if (exists) {
        error(`Version ${newVersion} already exists on npm`);
        process.exit(1);
      }

      updatePackageVersion(newVersion);
      success(`Version set to ${newVersion}`);

      // Update package-lock.json if it exists
      try {
        execCommand('npm install --package-lock-only');
        success('Updated package-lock.json');
      } catch {
        warn('Could not update package-lock.json');
      }
      break;
    }

    default:
      error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(err => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});