"use strict";
const { spawnSync } = require('child_process');
const path = require('path');

// Ordered list of seed scripts to run
const seeds = [
  'seed:catalog',
  'seed:categories:kids-next',
  'seed:products:linked',
  'seed:offers-coupons',
  'seed:rbac',
  'seed:kids-products',
  'seed:next-products'
];

function runSeed(script) {
  console.log(`Running: ${script}`);
  const result = spawnSync('npm', ['run', script], {
    stdio: 'inherit',
    shell: true,
    cwd: path.resolve(__dirname)
  });
  if (result.status !== 0) {
    console.error(`Seed failed: ${script} (exit code ${result.status})`);
    process.exit(result.status);
  }
  console.log(`Completed: ${script}`);
}

(async () => {
  console.log('Starting all seeds...');
  for (const s of seeds) {
    runSeed(s);
  }
  console.log('All seeds completed.');
})();
