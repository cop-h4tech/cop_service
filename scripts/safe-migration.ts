import { execSync } from 'child_process';
import { readdirSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(__dirname, '../src/migrations');

function getMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('-Migration.ts'))
    .sort();
}

function extractUpSql(content: string): string[] {
  const upBlock = content.match(/public async up[\s\S]*?(?=public async down)/);
  if (!upBlock) return [];
  const hits = [...upBlock[0].matchAll(/queryRunner\.query\(\s*`([\s\S]*?)`\s*,?\s*\)/g)];
  return hits.map((m) => m[1].trim());
}

const before = new Set(getMigrationFiles());

try {
  execSync(
    'npx typeorm-ts-node-commonjs migration:generate -d src/data-source.ts src/migrations/Migration',
    { stdio: ['inherit', 'ignore', 'inherit'], cwd: join(__dirname, '..'), env: { ...process.env, NODE_NO_WARNINGS: '1' } },
  );
} catch {
  process.exit(1);
}

const after = getMigrationFiles();
const newFiles = after.filter((f) => !before.has(f));

if (newFiles.length === 0) {
  console.log('No migration file was generated (no schema changes detected).');
  process.exit(0);
}

const newFile = newFiles[0];
const newSql = extractUpSql(readFileSync(join(MIGRATIONS_DIR, newFile), 'utf-8'));

if (newSql.length === 0) {
  console.log('Generated migration is empty — removing.');
  unlinkSync(join(MIGRATIONS_DIR, newFile));
  process.exit(0);
}

const existingSql = new Set<string>();
for (const file of before) {
  extractUpSql(readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')).forEach((sql) =>
    existingSql.add(sql),
  );
}

const isDuplicate = newSql.every((sql) => existingSql.has(sql));

if (isDuplicate) {
  unlinkSync(join(MIGRATIONS_DIR, newFile));
  console.log(
    '\n[safe-migration] Duplicate blocked: same schema changes already exist in a pending migration file.',
  );
  console.log(
    '[safe-migration] Run "npm run migrate" to apply existing migrations before generating new ones.\n',
  );
} else {
  console.log(`\n[safe-migration] New migration created: ${newFile}\n`);
}
