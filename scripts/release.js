/**
 * Release script: bump version of a service and create Git tag.
 * Usage: npm run release <service> <patch|minor|major>
 * Example: npm run release auth-service patch
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SERVICES = {
  gateway: { workspace: 'backend/gateway', tagPrefix: 'gateway/v' },
  'auth-service': { workspace: 'backend/services/auth-service', tagPrefix: 'auth-service/v' },
  'catalog-service': { workspace: 'backend/services/catalog-service', tagPrefix: 'catalog-service/v' },
  'roguelike-service': { workspace: 'backend/services/roguelike-service', tagPrefix: 'roguelike-service/v' },
  'analytics-service': { workspace: 'backend/services/analytics-service', tagPrefix: 'analytics-service/v' },
};

const bumpTypes = ['patch', 'minor', 'major'];

const serviceName = process.argv[2];
const bumpType = process.argv[3];

if (!serviceName || !bumpTypes.includes(bumpType)) {
  console.error('Usage: npm run release <service> <patch|minor|major>');
  console.error('Services:', Object.keys(SERVICES).join(', '));
  process.exit(1);
}

const config = SERVICES[serviceName];
if (!config) {
  console.error('Unknown service:', serviceName);
  console.error('Allowed:', Object.keys(SERVICES).join(', '));
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, config.workspace, 'package.json');
let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} catch (e) {
  console.error('Could not read package.json at', pkgPath);
  process.exit(1);
}

const currentVersion = pkg.version;
console.log(`${serviceName}: ${currentVersion} -> ${bumpType} bump`);

try {
  execSync(
    `npm version ${bumpType} --workspace=${config.workspace} --tag-version-prefix "${config.tagPrefix}"`,
    { cwd: rootDir, stdio: 'inherit' }
  );
} catch (e) {
  process.exit(1);
}

console.log('\n\u001b[33mProchaine étape : git push origin dev --follow-tags\u001b[0m');
