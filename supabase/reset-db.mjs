import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new pg.Client({
  host: 'db.lbjkvoimjdspvmesmgmm.supabase.co',
  port: 5432, database: 'postgres', user: 'postgres',
  password: 'CivicConnectBhatkal140326',
  ssl: { rejectUnauthorized: false },
  statement_timeout: 120000,
});

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function run(label, sql) {
  try {
    await client.query(sql);
    console.log(`✅  ${label}`);
  } catch (e) {
    console.log(`❌  ${label}: ${e.message}`);
    throw e;
  }
}

async function main() {
  await client.connect();
  console.log('🔥 NUKING DATABASE & REBUILDING FROM SCRATCH 🔥\n');

  // 1. Wipe out everything in public schema cleanly
  console.log('🧹 Wiping old schema...');
  try {
    await client.query('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;');
    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    
    // Grant core permissions
    await client.query('GRANT ALL ON SCHEMA public TO postgres, public;');
    await client.query('GRANT ALL ON SCHEMA public TO service_role;');
    await client.query('GRANT USAGE ON SCHEMA public TO anon, authenticated;');
    console.log('✅  Schema wiped and recreated.');
  } catch(e) {
    console.log('Failed to wipe schema natively:', e.message);
  }

  // 2. Read and run migration files in order
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  console.log(`\n📂 Found ${files.length} migration files in order:\n`);

  for (const file of files) {
    const rawSql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    
    // Split on statements for better error tracing, handled automatically by driver usually,
    // but running as one massive block is better for Postgres transactions
    try {
      console.log(`⏱️  Running ${file}...`);
      await client.query('BEGIN;');
      await client.query(rawSql);
      await client.query('COMMIT;');
      console.log(`   ✅ Success!`);
    } catch(err) {
      await client.query('ROLLBACK;');
      console.log(`   ❌ Failed: ${err.message}`);
      
      // If error points to a specific part, we want to know
      const hint = err.position ? `at position ${err.position}` : '';
      console.log(`      Detail: SQL syntax error or missing relation ${hint}`);
      process.exit(1);
    }
  }

  // 3. Force PostgREST reload
  console.log('\n🔄 Reloading Supabase PostgREST Cache...');
  await client.query("NOTIFY pgrst, 'reload schema';");
  await client.query("NOTIFY pgrst, 'reload config';");

  console.log('\n🎉 REBUILD COMPLETE! All systems go.');
  await client.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
