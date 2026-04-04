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

// Map of seed script -> actual file path (to verify existence before run)
const seedFileMap = {
  'seed:catalog': 'src/seed-catalog.js',
  'seed:categories:kids-next': 'src/seed-categories-kids-next.js',
  'seed:products:linked': 'src/seed-products-linked.js',
  'seed:offers-coupons': 'src/seed-offers-coupons.js',
  'seed:rbac': 'src/seed-rbac.js',
  'seed:kids-products': 'src/seed-kids-products-full.js',
  'seed:next-products': 'src/seed-next-products-full.js'
};

function runSeed(script) {
  console.log(`Running: ${script}`);
  // Optionally skip if seed script file does not exist
  const filePath = seedFileMap[script];
  const fs = require('fs');
  const seedAbsPath = require('path').join(__dirname, filePath);
  if (!fs.existsSync(seedAbsPath)) {
    console.warn(`Seed file not found for ${script} -> ${seedAbsPath}. Skipping.`);
    return;
  }

  const result = spawnSync('npm', ['run', script], {
    stdio: 'inherit',
    shell: true,
    cwd: path.resolve(__dirname)
  });
  if (result.status !== 0) {
    console.warn(`Seed failed: ${script} (exit code ${result.status}). Continuing with next seeds.`);
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
