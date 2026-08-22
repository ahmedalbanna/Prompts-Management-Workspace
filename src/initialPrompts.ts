import { Prompt } from "./types";

export const INITIAL_PROMPTS: Prompt[] = [
  {
    id: "system-parity",
    title: "Symmetrical Platform Parity Planner",
    description:
      "Generates high-fidelity cross-platform alignment checklists for engineering releases.",
    category: "Software Engineering",
    tags: ["Product", "Release", "QA", "Parity"],
    systemInstruction:
      "You are a Principal Product Architect. Your goal is to review a proposed feature list and compile a highly detailed Cross-Platform Alignment and Feature Parity Checklist across Web, Mobile, and Desktop platforms.",
    template: `Compare the core feature specifications of the following module and compile a formal Symmetrical Platform Parity Checklist.

Feature Module: {{module_name}}
Core Capabilities:
{{core_capabilities}}

Platform Scope: {{platforms_scope}} (e.g. Web, Android, iOS)
Quality Metrics Target: {{quality_target}}

The checklist MUST be formatted in a professional markdown table containing:
1. "Feature Component" (with unique ID)
2. "Detailed Web Criteria"
3. "Detailed Mobile Criteria"
4. "Detailed Desktop Criteria" (if applicable)
5. "Edge Cases & Sync Alignment Strategy"
6. "Critical Latency/Performance Threshold"

Add an introductory summary paragraph detailing why parallel parity prevents visual and logical drift, followed by a prioritized release timeline divided into 3 strategic phases.`,
    model: "gemma:2b",
    temperature: 0.5,
    maxOutputTokens: 2048,
    versions: [
      {
        id: "sys-v1",
        versionString: "1.0.0",
        commitMessage: "Initial template creation for Platform Parity Planner",
        systemInstruction:
          "You are a Principal Product Architect. Your goal is to review a proposed feature list and compile a highly detailed Cross-Platform Alignment and Feature Parity Checklist across Web, Mobile, and Desktop platforms.",
        template: `Compare the core feature specifications of the following module and compile a formal Symmetrical Platform Parity Checklist.

Feature Module: {{module_name}}
Core Capabilities:
{{core_capabilities}}

Platform Scope: {{platforms_scope}} (e.g. Web, Android, iOS)
Quality Metrics Target: {{quality_target}}

The checklist MUST be formatted in a professional markdown table containing:
1. "Feature Component" (with unique ID)
2. "Detailed Web Criteria"
3. "Detailed Mobile Criteria"
4. "Detailed Desktop Criteria" (if applicable)
5. "Edge Cases & Sync Alignment Strategy"
6. "Critical Latency/Performance Threshold"

Add an introductory summary paragraph detailing why parallel parity prevents visual and logical drift, followed by a prioritized release timeline divided into 3 strategic phases.`,
        model: "gemma:2b",
        temperature: 0.5,
        maxOutputTokens: 2048,
        createdAt: "2026-07-16T10:00:00Z",
      },
    ],
    currentVersionIndex: 0,
    testCases: [
      {
        id: "tc-sys-1",
        name: "Interactive Document Workspace Sync",
        variables: {
          module_name: "Document Workspace Sync Engine",
          core_capabilities:
            "- Real-time cursor state syncing using Yjs\n- Physical drag-to-scroll rails logging 60fps telemetry\n- Local conflict resolution tool with 3-way line diffing",
          platforms_scope: "Web & iPad Mobile App",
          quality_target:
            "Zero-latency synchronization, frame rate locked to 60fps on iPad, persistent offline recovery",
        },
      },
      {
        id: "tc-sys-2",
        name: "Biometric 2FA Authentication Gate",
        variables: {
          module_name: "Biometric 2FA Authentication Hub",
          core_capabilities:
            "- FaceID & TouchID key verification\n- Secure Enclave cryptographic token exchange\n- Emergency recovery passkey rendering",
          platforms_scope: "Web, Android (Kotlin), iOS (Swift)",
          quality_target:
            "100% security alignment, immediate lockout trigger on 3 failed attempts, fallback email token in under 10 seconds",
        },
      },
    ],
    createdAt: "2026-07-16T10:00:00Z",
    updatedAt: "2026-07-16T10:00:00Z",
  },
  {
    id: "scientific-report",
    title: "Scientific Technical Report Architect",
    description:
      "Transforms experimental science and telemetry datasets into structured LaTeX-style reports.",
    category: "Academic & Research",
    tags: ["Science", "Report", "LaTeX", "Analysis"],
    systemInstruction:
      "You are an Elite Research Physicist. You excel at synthesizing complex experimental raw metrics, formulas, and sensor telemetry log files into academic-quality, print-ready reports with elegant LaTeX mathematical formulations.",
    template: `Draft a comprehensive, publication-grade Technical Report based on the following experimental payload parameters.

Experiment Identifier: {{experiment_id}}
Subject Matter: {{subject}}
Raw Observation Telemetry Logs:
{{telemetry_logs}}

Mathematical Hypothesis Segment:
{{mathematical_hypothesis}}

Your output MUST be structured using standard Scientific Markdown:
- **Title Block**: Formatted elegantly with Author, Affiliation, and current date.
- **Abstract Section**: Concise summaries of objectives, methodology, key findings, and final numerical deviations.
- **Mathematical Framework**: Beautiful LaTeX math equations. Use single dollar signs $...$ for inline formulas (e.g. $F = ma$) and double dollar signs $$...$$ for display equations. Ensure integrals, fractions, limits, or matrices are fully specified.
- **Detailed Findings & Results**: Format raw telemetry logs into a clean markdown table. Compile computed variables like maximum stress, velocity thresholds, or mechanical drag.
- **Discussion & Structural Conclusion**: Critique system limits, wind drag friction or collision damping, and recommend secondary optimization vectors.`,
    model: "gemma:2b",
    temperature: 0.4,
    maxOutputTokens: 4096,
    versions: [
      {
        id: "sci-v1",
        versionString: "1.0.0",
        commitMessage: "Initial scientific outline architect template",
        systemInstruction:
          "You are an Elite Research Physicist. You excel at synthesizing complex experimental raw metrics, formulas, and sensor telemetry log files into academic-quality, print-ready reports with elegant LaTeX mathematical formulations.",
        template: `Draft a comprehensive, publication-grade Technical Report based on the following experimental payload parameters.

Experiment Identifier: {{experiment_id}}
Subject Matter: {{subject}}
Raw Observation Telemetry Logs:
{{telemetry_logs}}

Mathematical Hypothesis Segment:
{{mathematical_hypothesis}}

Your output MUST be structured using standard Scientific Markdown:
- **Title Block**: Formatted elegantly with Author, Affiliation, and current date.
- **Abstract Section**: Concise summaries of objectives, methodology, key findings, and final numerical deviations.
- **Mathematical Framework**: Beautiful LaTeX math equations. Use single dollar signs $...$ for inline formulas (e.g. $F = ma$) and double dollar signs $$...$$ for display equations. Ensure integrals, fractions, limits, or matrices are fully specified.
- **Detailed Findings & Results**: Format raw telemetry logs into a clean markdown table. Compile computed variables like maximum stress, velocity thresholds, or mechanical drag.
- **Discussion & Structural Conclusion**: Critique system limits, wind drag friction or collision damping, and recommend secondary optimization vectors.`,
        model: "gemma:2b",
        temperature: 0.4,
        maxOutputTokens: 4096,
        createdAt: "2026-07-16T11:00:00Z",
      },
    ],
    currentVersionIndex: 0,
    testCases: [
      {
        id: "tc-sci-1",
        name: "Elastomer Repetitive Bounce",
        variables: {
          experiment_id: "EXP-BOUNCE-09A",
          subject:
            "Mechanical elastomer decay and kinetic energy coefficient of restitution",
          telemetry_logs:
            "- Interval 1s: Displacement 10.2m, Velocity 0.0m/s, Damping Coefficient 0.12\n- Interval 2s: Displacement 4.5m, Velocity -8.2m/s, Ground Bounce Friction 0.15\n- Interval 3s: Displacement 2.1m, Velocity 4.1m/s, Air drag 0.02\n- Interval 4s: Displacement 0.9m, Velocity -1.8m/s, Restitution Loss 0.45",
          mathematical_hypothesis:
            "The dampening acceleration is proportional to velocity: $a(t) = -g - \\gamma v(t)$, where $g = 9.81\\text{ m/s}^2$ and $\\gamma$ is the medium resistance. Restitution coefficient: $e = \\frac{v_{final}}{v_{initial}} = \\sqrt{\\frac{h_n}{h_{n-1}}}$.",
        },
      },
    ],
    createdAt: "2026-07-16T11:00:00Z",
    updatedAt: "2026-07-16T11:00:00Z",
  },
  {
    id: "tailwindcss-developer",
    title: "High-Contrast Tailwind Dev",
    description:
      "Generates semantic, ultra-accessible React components styled with Tailwind CSS.",
    category: "Software Engineering",
    tags: ["React", "Vite", "Tailwind", "Accessibility"],
    systemInstruction:
      "You are a World-Class Frontend Architect and Accessibility Expert. You design React components with perfect structural hierarchy, detailed ARIA roles, high color contrast ratios, and modern, eye-safe Tailwind CSS styling.",
    template: `Write a standalone, production-ready React component based on the following requirements:

Component Name: {{component_name}}
Functionality:
{{functionality}}

Interactive States: {{interactive_states}} (e.g. disabled, loading, success)
Color Palette & Mood: {{theme_mood}}

Follow these strict constraints:
1. Write the code in pure TypeScript/TSX.
2. Rely exclusively on Lucide icons for icons (imported individually: \`import { IconName } from 'lucide-react'\`).
3. Use Tailwind CSS for 100% of the styling. Ensure gorgeous off-whites, crisp slate text, and elegant color highlights (e.g., indigo or amber) that meet WCAG AA guidelines.
4. Add clear HTML 'id' attributes on all meaningful elements (buttons, cards, inputs) to enable precise DOM tracking and script interaction.
5. Double check that no external packages (other than standard React, lucide-react, or framer-motion) are imported.
6. Return a short, explanatory markdown code-block containing ONLY the ready-to-paste TSX code.`,
    model: "gemma:2b",
    temperature: 0.2,
    maxOutputTokens: 3000,
    versions: [
      {
        id: "tail-v1",
        versionString: "1.0.0",
        commitMessage: "Initial component developer template",
        systemInstruction:
          "You are a World-Class Frontend Architect and Accessibility Expert. You design React components with perfect structural hierarchy, detailed ARIA roles, high color contrast ratios, and modern, eye-safe Tailwind CSS styling.",
        template: `Write a standalone, production-ready React component based on the following requirements:

Component Name: {{component_name}}
Functionality:
{{functionality}}

Interactive States: {{interactive_states}} (e.g. disabled, loading, success)
Color Palette & Mood: {{theme_mood}}

Follow these strict constraints:
1. Write the code in pure TypeScript/TSX.
2. Rely exclusively on Lucide icons for icons (imported individually: \`import { IconName } from 'lucide-react'\`).
3. Use Tailwind CSS for 100% of the styling. Ensure gorgeous off-whites, crisp slate text, and elegant color highlights (e.g., indigo or amber) that meet WCAG AA guidelines.
4. Add clear HTML 'id' attributes on all meaningful elements (buttons, cards, inputs) to enable precise DOM tracking and script interaction.
5. Double check that no external packages (other than standard React, lucide-react, or framer-motion) are imported.
6. Return a short, explanatory markdown code-block containing ONLY the ready-to-paste TSX code.`,
        model: "gemma:2b",
        temperature: 0.2,
        maxOutputTokens: 3000,
        createdAt: "2026-07-16T12:00:00Z",
      },
    ],
    currentVersionIndex: 0,
    testCases: [
      {
        id: "tc-tail-1",
        name: "Interactive Tally Counter Widget",
        variables: {
          component_name: "TallyCounter",
          functionality:
            "- Shows a large numeric segment that updates live\n- Positive click increments, negative click decrements, and reset\n- Rapid toggle clicks (+10 / -10)",
          interactive_states:
            "Disable decrements if value equals zero, disable increments if value reaches 100",
          theme_mood:
            "Retro mechanical industrial: deep dark slate overlays, glowing emerald numeric typography",
        },
      },
    ],
    createdAt: "2026-07-16T12:00:00Z",
    updatedAt: "2026-07-16T12:00:00Z",
  },
];
