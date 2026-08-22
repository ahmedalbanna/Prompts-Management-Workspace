import { invoke } from "@tauri-apps/api/core";
import { OllamaModel, TestResult } from "./types";

export async function runTest(payload: {
  systemInstruction: string;
  template: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
}): Promise<TestResult> {
  return invoke<TestResult>("run_test", {
    systemInstruction: payload.systemInstruction,
    template: payload.template,
    model: payload.model,
    temperature: payload.temperature,
    maxOutputTokens: payload.maxOutputTokens,
  });
}

export async function optimizePrompt(payload: {
  draftTemplate: string;
  systemContext: string;
  optimizationGoal: string;
}): Promise<TestResult> {
  return invoke<TestResult>("optimize_prompt", {
    draftTemplate: payload.draftTemplate,
    systemContext: payload.systemContext,
    optimizationGoal: payload.optimizationGoal,
  });
}

export async function evaluatePrompts(payload: {
  systemInstruction: string;
  template: string;
  model: string;
  temperature: number;
  testCases: Array<{ id: string; variables: Record<string, string> }>;
}): Promise<TestResult[]> {
  return invoke<TestResult[]>("evaluate_prompts", {
    systemInstruction: payload.systemInstruction,
    template: payload.template,
    model: payload.model,
    temperature: payload.temperature,
    testCases: payload.testCases,
  });
}

export async function listOllamaModels(): Promise<OllamaModel[]> {
  try {
    return await invoke<OllamaModel[]>("list_ollama_models");
  } catch (e) {
    // Ollama not reachable — return empty list; UI shows a notice.
    console.warn("Ollama models unavailable:", e);
    return [];
  }
}
