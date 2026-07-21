import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";
import { INITIAL_PROMPTS } from "../initialPrompts";
import { Prompt, PromptVersion, TestCase } from "../types";

const DB_FILE_PATH = path.join(process.cwd(), "promptcraft.sqlite");

let dbInstance: SqlJsDatabase | null = null;

// Save database state to disk file
export function persistDatabase(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (error) {
    console.error("Failed to write SQLite database to disk:", error);
  }
}

// Initialize SQLite Database and Schema
export async function getSQLiteDb(): Promise<SqlJsDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      console.log(`SQLite Database loaded successfully from ${DB_FILE_PATH}`);
    } catch (e) {
      console.warn("Failed to load existing SQLite database file, creating a fresh instance.", e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
    console.log("Created new in-memory SQLite Database instance.");
  }

  // Ensure tables are defined
  createSchema(dbInstance);

  // If prompts table is empty, seed with initial prompts
  seedInitialData(dbInstance);

  // Persist to file
  persistDatabase();

  return dbInstance;
}

function createSchema(db: SqlJsDatabase): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL,
      system_instruction TEXT NOT NULL,
      template TEXT NOT NULL,
      model TEXT NOT NULL,
      temperature REAL NOT NULL,
      max_output_tokens INTEGER NOT NULL,
      current_version_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS prompt_versions (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      version_string TEXT NOT NULL,
      commit_message TEXT NOT NULL,
      system_instruction TEXT NOT NULL,
      template TEXT NOT NULL,
      model TEXT NOT NULL,
      temperature REAL NOT NULL,
      max_output_tokens INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      name TEXT NOT NULL,
      variables TEXT NOT NULL,
      created_at TEXT,
      FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS execution_logs (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      test_case_id TEXT,
      model TEXT NOT NULL,
      input_payload TEXT,
      output_text TEXT,
      duration_ms INTEGER,
      prompt_tokens INTEGER,
      candidates_tokens INTEGER,
      total_tokens INTEGER,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS provider_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      is_enabled INTEGER NOT NULL,
      endpoint_url TEXT,
      api_key TEXT,
      status TEXT NOT NULL,
      available_models TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function seedInitialData(db: SqlJsDatabase): void {
  const result = db.exec("SELECT COUNT(*) as count FROM prompts;");
  const count = result[0]?.values[0]?.[0] || 0;

  if (Number(count) === 0) {
    console.log("Seeding SQLite database with initial prompts...");
    INITIAL_PROMPTS.forEach(p => {
      savePromptToSQLite(db, p);
    });
    persistDatabase();
  }
}

// Save or Update a Prompt in SQLite
export function savePromptToSQLite(db: SqlJsDatabase, prompt: Prompt): void {
  // Upsert into prompts
  db.run(
    `INSERT INTO prompts (
      id, title, description, category, tags, system_instruction, template, model, temperature, max_output_tokens, current_version_index, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      category = excluded.category,
      tags = excluded.tags,
      system_instruction = excluded.system_instruction,
      template = excluded.template,
      model = excluded.model,
      temperature = excluded.temperature,
      max_output_tokens = excluded.max_output_tokens,
      current_version_index = excluded.current_version_index,
      updated_at = excluded.updated_at;`,
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
      prompt.maxOutputTokens,
      prompt.currentVersionIndex,
      prompt.createdAt,
      prompt.updatedAt,
    ]
  );

  // Upsert versions
  if (prompt.versions && prompt.versions.length > 0) {
    prompt.versions.forEach(ver => {
      db.run(
        `INSERT INTO prompt_versions (
          id, prompt_id, version_string, commit_message, system_instruction, template, model, temperature, max_output_tokens, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          version_string = excluded.version_string,
          commit_message = excluded.commit_message,
          system_instruction = excluded.system_instruction,
          template = excluded.template,
          model = excluded.model,
          temperature = excluded.temperature,
          max_output_tokens = excluded.max_output_tokens;`,
        [
          ver.id,
          prompt.id,
          ver.versionString,
          ver.commitMessage,
          ver.systemInstruction,
          ver.template,
          ver.model,
          ver.temperature,
          ver.maxOutputTokens || prompt.maxOutputTokens,
          ver.createdAt,
        ]
      );
    });
  }

  // Update test cases: remove old test cases and re-insert
  db.run(`DELETE FROM test_cases WHERE prompt_id = ?;`, [prompt.id]);
  if (prompt.testCases && prompt.testCases.length > 0) {
    prompt.testCases.forEach(tc => {
      db.run(
        `INSERT INTO test_cases (id, prompt_id, name, variables, created_at) VALUES (?, ?, ?, ?, ?);`,
        [
          tc.id,
          prompt.id,
          tc.name,
          JSON.stringify(tc.variables || {}),
          new Date().toISOString(),
        ]
      );
    });
  }

  persistDatabase();
}

// Get all Prompts from SQLite
export function getAllPromptsFromSQLite(db: SqlJsDatabase): Prompt[] {
  const promptsRes = db.exec("SELECT * FROM prompts ORDER BY datetime(updated_at) DESC;");
  if (!promptsRes[0] || !promptsRes[0].values) {
    return [];
  }

  const columns = promptsRes[0].columns;
  const rows = promptsRes[0].values;

  const prompts: Prompt[] = rows.map(row => {
    const rowObj: any = {};
    columns.forEach((col, idx) => {
      rowObj[col] = row[idx];
    });

    let tags: string[] = [];
    try {
      tags = JSON.parse(rowObj.tags || "[]");
    } catch {
      tags = [];
    }

    // Fetch versions for this prompt
    const verRes = db.exec(`SELECT * FROM prompt_versions WHERE prompt_id = '${rowObj.id}' ORDER BY datetime(created_at) ASC;`);
    let versions: PromptVersion[] = [];
    if (verRes[0] && verRes[0].values) {
      const verCols = verRes[0].columns;
      versions = verRes[0].values.map(vRow => {
        const vObj: any = {};
        verCols.forEach((col, idx) => {
          vObj[col] = vRow[idx];
        });
        return {
          id: vObj.id,
          versionString: vObj.version_string,
          commitMessage: vObj.commit_message,
          systemInstruction: vObj.system_instruction,
          template: vObj.template,
          model: vObj.model,
          temperature: vObj.temperature,
          maxOutputTokens: vObj.max_output_tokens,
          createdAt: vObj.created_at,
        };
      });
    }

    // Fetch test cases for this prompt
    const tcRes = db.exec(`SELECT * FROM test_cases WHERE prompt_id = '${rowObj.id}';`);
    let testCases: TestCase[] = [];
    if (tcRes[0] && tcRes[0].values) {
      const tcCols = tcRes[0].columns;
      testCases = tcRes[0].values.map(tcRow => {
        const tcObj: any = {};
        tcCols.forEach((col, idx) => {
          tcObj[col] = tcRow[idx];
        });
        let vars = {};
        try {
          vars = JSON.parse(tcObj.variables || "{}");
        } catch {
          vars = {};
        }
        return {
          id: tcObj.id,
          name: tcObj.name,
          variables: vars,
        };
      });
    }

    return {
      id: rowObj.id,
      title: rowObj.title,
      description: rowObj.description,
      category: rowObj.category,
      tags,
      systemInstruction: rowObj.system_instruction,
      template: rowObj.template,
      model: rowObj.model,
      temperature: rowObj.temperature,
      maxOutputTokens: rowObj.max_output_tokens,
      versions,
      currentVersionIndex: rowObj.current_version_index,
      testCases,
      createdAt: rowObj.created_at,
      updatedAt: rowObj.updated_at,
    };
  });

  return prompts;
}

// Reset SQLite database back to seed defaults
export function resetSQLiteDatabase(db: SqlJsDatabase): Prompt[] {
  db.run("DELETE FROM test_cases;");
  db.run("DELETE FROM prompt_versions;");
  db.run("DELETE FROM prompts;");
  db.run("DELETE FROM execution_logs;");

  INITIAL_PROMPTS.forEach(p => {
    savePromptToSQLite(db, p);
  });

  persistDatabase();
  return getAllPromptsFromSQLite(db);
}

// Delete a single prompt from SQLite
export function deletePromptFromSQLite(db: SqlJsDatabase, id: string): void {
  db.run("DELETE FROM test_cases WHERE prompt_id = ?;", [id]);
  db.run("DELETE FROM prompt_versions WHERE prompt_id = ?;", [id]);
  db.run("DELETE FROM prompts WHERE id = ?;", [id]);
  persistDatabase();
}

// Log execution result to SQLite execution_logs table
export function logExecutionToSQLite(
  db: SqlJsDatabase,
  promptId: string,
  testCaseId: string | null,
  model: string,
  inputPayload: string,
  outputText: string,
  durationMs: number,
  promptTokens: number,
  candidatesTokens: number,
  totalTokens: number
): void {
  const id = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  db.run(
    `INSERT INTO execution_logs (
      id, prompt_id, test_case_id, model, input_payload, output_text, duration_ms, prompt_tokens, candidates_tokens, total_tokens, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      promptId,
      testCaseId || null,
      model,
      inputPayload,
      outputText,
      durationMs,
      promptTokens,
      candidatesTokens,
      totalTokens,
      new Date().toISOString(),
    ]
  );
  persistDatabase();
}

// Get Database Info & Stats
export function getSQLiteStats(db: SqlJsDatabase): {
  filePath: string;
  fileSizeBytes: number;
  promptsCount: number;
  versionsCount: number;
  testCasesCount: number;
  logsCount: number;
  tables: string[];
} {
  let fileSizeBytes = 0;
  if (fs.existsSync(DB_FILE_PATH)) {
    fileSizeBytes = fs.statSync(DB_FILE_PATH).size;
  }

  const getCount = (table: string) => {
    try {
      const res = db.exec(`SELECT COUNT(*) FROM ${table};`);
      return Number(res[0]?.values[0]?.[0] || 0);
    } catch {
      return 0;
    }
  };

  const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
  const tables: string[] = tablesRes[0]?.values ? tablesRes[0].values.map(v => String(v[0])) : [];

  return {
    filePath: DB_FILE_PATH,
    fileSizeBytes,
    promptsCount: getCount("prompts"),
    versionsCount: getCount("prompt_versions"),
    testCasesCount: getCount("test_cases"),
    logsCount: getCount("execution_logs"),
    tables,
  };
}

// Get Provider Configurations from SQLite
export function getProviderConfigsFromSQLite(db: SqlJsDatabase): any[] {
  try {
    const res = db.exec("SELECT * FROM provider_configs;");
    if (!res[0] || !res[0].values) return [];

    const cols = res[0].columns;
    return res[0].values.map(row => {
      const obj: any = {};
      cols.forEach((col, idx) => {
        obj[col] = row[idx];
      });

      let availableModels: string[] = [];
      try {
        availableModels = JSON.parse(obj.available_models || "[]");
      } catch {
        availableModels = [];
      }

      return {
        id: obj.id,
        name: obj.name,
        category: obj.category,
        isEnabled: Boolean(obj.is_enabled),
        endpointUrl: obj.endpoint_url,
        apiKey: obj.api_key,
        status: obj.status,
        availableModels,
        updatedAt: obj.updated_at,
      };
    });
  } catch (err) {
    console.warn("Failed to fetch provider configs from SQLite:", err);
    return [];
  }
}

// Save or Update Provider Configuration in SQLite
export function saveProviderConfigToSQLite(db: SqlJsDatabase, config: any): void {
  try {
    db.run(
      `INSERT INTO provider_configs (
        id, name, category, is_enabled, endpoint_url, api_key, status, available_models, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        is_enabled = excluded.is_enabled,
        endpoint_url = excluded.endpoint_url,
        api_key = excluded.api_key,
        status = excluded.status,
        available_models = excluded.available_models,
        updated_at = excluded.updated_at;`,
      [
        config.id,
        config.name,
        config.category,
        config.isEnabled ? 1 : 0,
        config.endpointUrl || null,
        config.apiKey || null,
        config.status || "online",
        JSON.stringify(config.availableModels || []),
        new Date().toISOString(),
      ]
    );
    persistDatabase();
  } catch (err) {
    console.error("Failed to save provider config to SQLite:", err);
  }
}

