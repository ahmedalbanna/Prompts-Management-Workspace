import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to safely get the Gemini AI client
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please set your Gemini API Key in the Settings > Secrets panel.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API: Run test prompt with dynamic variables
app.post("/api/prompts/test", async (req, res) => {
  const { systemInstruction, template, variables, model, temperature, maxOutputTokens } = req.body;

  try {
    const ai = getAiClient();
    
    // Substitute variables in template
    let promptContent = template || "";
    if (variables && typeof variables === "object") {
      Object.entries(variables).forEach(([key, value]) => {
        // Replace {{key}} or {{ key }}
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        promptContent = promptContent.replace(regex, String(value));
      });
    }

    const startTime = Date.now();
    
    // Use gemini-3.5-flash as default if none provided
    const modelToUse = model || "gemini-3.5-flash";

    const config: any = {
      temperature: typeof temperature === "number" ? temperature : 0.7,
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    
    if (typeof maxOutputTokens === "number" && maxOutputTokens > 0) {
      config.maxOutputTokens = maxOutputTokens;
    }

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: promptContent,
      config,
    });

    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      output: response.text || "",
      durationMs,
      tokens: {
        prompt: response.usageMetadata?.promptTokenCount || 0,
        candidates: response.usageMetadata?.candidatesTokenCount || 0,
        total: response.usageMetadata?.totalTokenCount || 0,
      }
    });
  } catch (error: any) {
    console.error("Gemini testing error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred during prompt execution."
    });
  }
});

// API: Optimize/Refine a prompt draft
app.post("/api/prompts/optimize", async (req, res) => {
  const { draftTemplate, systemContext, optimizationGoal } = req.body;

  try {
    const ai = getAiClient();

    const optimizationSystemInstruction = `You are an expert prompt engineer specializing in Google Gemini models.
Your task is to take a draft prompt template and transform it into a highly professional, well-structured prompt.
Follow these structured prompt principles:
1. Define a clear role/persona for the model.
2. Outline the explicit task and steps.
3. Establish clear constraints, guidelines, and guardrails.
4. Specify clear input formats (using variables in double curly braces {{variable_name}}).
5. Outline clear expected output schemas or formatting (e.g. Markdown tables, headers, bullet points).
6. Return a JSON structure matching the required schema. No other conversational text.`;

    const promptText = `
Optimize the following draft prompt template.
Draft Prompt Template:
"${draftTemplate}"

${systemContext ? `Context or Role constraints:\n"${systemContext}"` : ""}
${optimizationGoal ? `Primary Optimization Goal:\n"${optimizationGoal}"` : ""}

You MUST respond with a JSON object containing:
- "systemInstruction": An elegant, robust system instruction for the prompt.
- "optimizedTemplate": The beautifully structured template, keeping relevant variables in double curly braces (e.g., {{variable}}).
- "explanation": A short explanation of the enhancements you made.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: optimizationSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT" as any,
          properties: {
            systemInstruction: { type: "STRING" as any, description: "System instructions for the optimized prompt." },
            optimizedTemplate: { type: "STRING" as any, description: "The optimized body template with preserved or improved variables." },
            explanation: { type: "STRING" as any, description: "Explanation of improvements and why they make the prompt better." }
          },
          required: ["systemInstruction", "optimizedTemplate", "explanation"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response received from the optimizer model.");
    }

    const optimizedResult = JSON.parse(resultText.trim());
    res.json({
      success: true,
      ...optimizedResult
    });
  } catch (error: any) {
    console.error("Prompt optimization error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to optimize the prompt template."
    });
  }
});

// API: Evaluate a prompt against multiple test cases
app.post("/api/prompts/evaluate", async (req, res) => {
  const { systemInstruction, template, model, temperature, testCases } = req.body;

  if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
    return res.status(400).json({ success: false, error: "At least one test case is required for evaluation." });
  }

  try {
    const ai = getAiClient();
    const modelToUse = model || "gemini-3.5-flash";
    const tempToUse = typeof temperature === "number" ? temperature : 0.7;

    const evalPromises = testCases.map(async (tc: any) => {
      let promptContent = template || "";
      if (tc.variables && typeof tc.variables === "object") {
        Object.entries(tc.variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
          promptContent = promptContent.replace(regex, String(value));
        });
      }

      const startTime = Date.now();
      try {
        const config: any = {
          temperature: tempToUse,
        };
        if (systemInstruction) {
          config.systemInstruction = systemInstruction;
        }

        const response = await ai.models.generateContent({
          model: modelToUse,
          contents: promptContent,
          config,
        });

        const durationMs = Date.now() - startTime;
        
        return {
          id: tc.id,
          name: tc.name,
          success: true,
          output: response.text || "",
          durationMs,
          tokens: {
            prompt: response.usageMetadata?.promptTokenCount || 0,
            candidates: response.usageMetadata?.candidatesTokenCount || 0,
            total: response.usageMetadata?.totalTokenCount || 0,
          }
        };
      } catch (err: any) {
        return {
          id: tc.id,
          name: tc.name,
          success: false,
          error: err.message || "Failed to execute test case."
        };
      }
    });

    const results = await Promise.all(evalPromises);
    res.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error("Evaluation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to run prompt evaluation."
    });
  }
});

// Start dev server middleware or serve production assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
