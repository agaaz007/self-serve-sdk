import { Client } from "pg";

// ── Configuration ──────────────────────────────────────────────────────────

const CONNECTION_STRING =
  "postgresql://neondb_owner:npg_r34FmgAMOXkv@ep-ancient-base-aicmftni-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const EXPECTED_TABLES: Record<string, string[]> = {
  tenants: [
    "id",
    "name",
    "api_key_hash",
    "allowed_origins",
    "posthog_api_key",
    "posthog_project_id",
    "posthog_host",
    "elevenlabs_api_key",
    "intervention_agent_id",
    "chat_agent_id",
    "tier",
    "session_limit",
    "created_at",
  ],
  api_keys: [
    "id",
    "tenant_id",
    "key_prefix",
    "key_hash",
    "name",
    "created_at",
    "revoked_at",
  ],
  sessions: [
    "id",
    "tenant_id",
    "user_id",
    "status",
    "agent_id",
    "elevenlabs_conversation_id",
    "context",
    "dynamic_variables",
    "transcript",
    "offers",
    "outcome",
    "ai_analysis",
    "timing",
    "created_at",
    "completed_at",
  ],
  usage: [
    "id",
    "tenant_id",
    "period",
    "session_count",
    "voice_minutes",
    "updated_at",
  ],
};

const EXPECTED_INDEXES = [
  "idx_api_keys_key_prefix",
  "idx_api_keys_revoked",
  "idx_usage_tenant_period",
  "idx_sessions_tenant",
];

// ── Helpers ────────────────────────────────────────────────────────────────

const PASS = "\x1b[32m\u2713\x1b[0m"; // green checkmark
const FAIL = "\x1b[31m\u2717\x1b[0m"; // red cross
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

function header(text: string): void {
  console.log(`\n${BOLD}${text}${RESET}`);
  console.log("\u2500".repeat(60));
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  let failures = 0;

  const client = new Client({ connectionString: CONNECTION_STRING });

  // 1. Connect
  header("Database Connection");
  try {
    await client.connect();
    console.log(`  ${PASS} Connected to Neon PostgreSQL`);
  } catch (err: any) {
    console.log(`  ${FAIL} Failed to connect: ${err.message}`);
    process.exit(1);
  }

  try {
    // 2. Check tables exist
    header("Table Existence");

    const tableRes = await client.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );
    const existingTables = new Set(tableRes.rows.map((r) => r.tablename));

    for (const table of Object.keys(EXPECTED_TABLES)) {
      if (existingTables.has(table)) {
        console.log(`  ${PASS} Table "${table}" exists`);
      } else {
        console.log(`  ${FAIL} Table "${table}" is MISSING`);
        failures++;
      }
    }

    // 3. Verify columns for each table
    header("Column Verification");

    for (const [table, expectedColumns] of Object.entries(EXPECTED_TABLES)) {
      if (!existingTables.has(table)) {
        console.log(`  ${FAIL} Skipping "${table}" (table missing)`);
        failures++;
        continue;
      }

      const colRes = await client.query<{ column_name: string }>(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [table]
      );
      const actualColumns = new Set(colRes.rows.map((r) => r.column_name));

      const missing: string[] = [];
      const extra: string[] = [];

      for (const col of expectedColumns) {
        if (!actualColumns.has(col)) {
          missing.push(col);
        }
      }

      for (const col of actualColumns) {
        if (!expectedColumns.includes(col)) {
          extra.push(col);
        }
      }

      if (missing.length === 0) {
        console.log(
          `  ${PASS} "${table}" has all ${expectedColumns.length} expected columns`
        );
      } else {
        console.log(
          `  ${FAIL} "${table}" is missing columns: ${missing.join(", ")}`
        );
        failures++;
      }

      if (extra.length > 0) {
        console.log(
          `    ${DIM}(extra columns present: ${extra.join(", ")})${RESET}`
        );
      }
    }

    // 4. Check indexes
    header("Index Verification");

    const idxRes = await client.query<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`
    );
    const existingIndexes = new Set(idxRes.rows.map((r) => r.indexname));

    for (const idx of EXPECTED_INDEXES) {
      if (existingIndexes.has(idx)) {
        console.log(`  ${PASS} Index "${idx}" exists`);
      } else {
        console.log(`  ${FAIL} Index "${idx}" is MISSING`);
        failures++;
      }
    }

    // 5. Summary
    header("Summary");

    const totalChecks =
      Object.keys(EXPECTED_TABLES).length * 2 + EXPECTED_INDEXES.length;
    const passed = totalChecks - failures;

    if (failures === 0) {
      console.log(
        `  ${PASS} All ${totalChecks} checks passed. Database schema is valid.\n`
      );
    } else {
      console.log(
        `  ${FAIL} ${failures} of ${totalChecks} checks failed.\n`
      );
    }

    process.exit(failures > 0 ? 1 : 0);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
