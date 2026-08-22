import Database from "@tauri-apps/plugin-sql";
import { Prompt, PromptVersion, TestCase } from "./types";

let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:promptcraft.db");
  }
  return dbPromise;
}

// --- Row shapes returned by the SQL plugin (snake_case columns) ---

interface PromptRow {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string; // JSON array
  system_instruction: string;
  template: string;
  model: string;
  temperature: number;
  max_output_tokens: number | null;
  current_version_index: number;
  created_at: string;
  updated_at: string;
}

interface VersionRow {
  id: string;
  version_string: string;
  commit_message: string;
  system_instruction: string;
  template: string;
  model: string;
  temperature: number;
  max_output_tokens: number | null;
  created_at: string;
}

interface TestCaseRow {
  id: string;
  name: string;
  variables: string; // JSON object
}

function rowToPrompt(row: PromptRow): Prompt {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    tags: JSON.parse(row.tags || "[]"),
    systemInstruction: row.system_instruction,
    template: row.template,
    model: row.model,
    temperature: row.temperature,
    maxOutputTokens: row.max_output_tokens ?? undefined,
    versions: [],
    currentVersionIndex: row.current_version_index,
    testCases: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadPrompts(): Promise<Prompt[]> {
  const db = await getDb();
  const rows = await db.select<PromptRow[]>(
    "SELECT * FROM prompts ORDER BY updated_at DESC",
  );

  const prompts: Prompt[] = [];
  for (const row of rows) {
    const prompt = rowToPrompt(row);
    const versions = await db.select<VersionRow[]>(
      "SELECT * FROM prompt_versions WHERE prompt_id = ? ORDER BY created_at ASC",
      [prompt.id],
    );
    prompt.versions = versions.map((v) => ({
      id: v.id,
      versionString: v.version_string,
      commitMessage: v.commit_message,
      systemInstruction: v.system_instruction,
      template: v.template,
      model: v.model,
      temperature: v.temperature,
      maxOutputTokens: v.max_output_tokens ?? undefined,
      createdAt: v.created_at,
    }));

    const tcs = await db.select<TestCaseRow[]>(
      "SELECT * FROM test_cases WHERE prompt_id = ? ORDER BY name ASC",
      [prompt.id],
    );
    prompt.testCases = tcs.map((t) => ({
      id: t.id,
      name: t.name,
      variables: JSON.parse(t.variables || "{}"),
    }));

    prompts.push(prompt);
  }
  return prompts;
}

export async function savePrompt(prompt: Prompt): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT OR REPLACE INTO prompts
      (id, title, description, category, tags, system_instruction, template, model, temperature, max_output_tokens, current_version_index, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      prompt.id,
      prompt.title,
      prompt.description,
      prompt.category,
      JSON.stringify(prompt.tags),
      prompt.systemInstruction,
      prompt.template,
      prompt.model,
      prompt.temperature,
      prompt.maxOutputTokens ?? null,
      prompt.currentVersionIndex,
      prompt.createdAt,
      prompt.updatedAt,
    ],
  );

  // Sync versions
  await db.execute("DELETE FROM prompt_versions WHERE prompt_id = ?", [prompt.id]);
  for (const v of prompt.versions) {
    await db.execute(
      `INSERT INTO prompt_versions
        (id, prompt_id, version_string, commit_message, system_instruction, template, model, temperature, max_output_tokens, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        v.id,
        prompt.id,
        v.versionString,
        v.commitMessage,
        v.systemInstruction,
        v.template,
        v.model,
        v.temperature,
        v.maxOutputTokens ?? null,
        v.createdAt,
      ],
    );
  }

  // Sync test cases
  await db.execute("DELETE FROM test_cases WHERE prompt_id = ?", [prompt.id]);
  for (const tc of prompt.testCases) {
    await db.execute(
      "INSERT INTO test_cases (id, prompt_id, name, variables) VALUES (?, ?, ?, ?)",
      [tc.id, prompt.id, tc.name, JSON.stringify(tc.variables)],
    );
  }
}

export async function deletePrompt(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM prompts WHERE id = ?", [id]);
}

/**
 * Seed the database with the original 3 prompts if it is empty.
 * Returns true if seeding occurred.
 */
export async function seedIfEmpty(): Promise<boolean> {
  const db = await getDb();
  const count = await db.select<{ c: number }[]>(
    "SELECT COUNT(*) as c FROM prompts",
  );
  if (count[0]?.c && count[0].c > 0) return false;

  const { INITIAL_PROMPTS } = await import("./initialPrompts");
  for (const p of INITIAL_PROMPTS) {
    await savePrompt(p);
  }
  return true;
}
