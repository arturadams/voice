const { execSync } = require('node:child_process');
const { writeFileSync } = require('node:fs');

execSync('tsc -p tsconfig.test.json', { stdio: 'inherit' });
writeFileSync('.tmp/package.json', JSON.stringify({ type: 'commonjs' }));
execSync('node --test .tmp/services/services.test.js', { stdio: 'inherit' });
