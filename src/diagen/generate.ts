import ora from "ora";
import { SupportedModel } from "../types.js";
import { callAIStream } from "../utils/ai-adapters.js";
import { cleanDiagramWithTip20 } from "../utils/helpers.js";
import { generationPrompt } from "./prompts.js";
import path from "path";
import { TIP20_MODEL } from "../utils/constants.js";

export async function generateDiagram(
  data: string,
  dataDesc: string,
  typeofDiagram: string,
  model: SupportedModel,
  tempDir: string,
  saveLogStep?: (step: any) => void,
  silent: boolean = true
) {
  let stream = await callAIStream(
    model,
    [
      {
        role: "user",
        content: generationPrompt(data, dataDesc, typeofDiagram),
      },
    ],
    "You are a mermaid diagram generator that can create beautiful and expressive mermaid diagrams.",
    path.join(tempDir, "prompts"),
    "initial_diagram"
  );

  const spinner = silent ? null : ora("Generating diagram").start();

  let response = "";
  let tokenCount = 0;

  for await (const token of stream) {
    response += token;
    tokenCount++;
    if (spinner) spinner.text = `Generating diagram (${tokenCount} tokens)`;
  }

  if (saveLogStep)
    saveLogStep({ type: "diagram_generated", diagram: response, model: model });

  if (spinner) spinner.succeed("Diagram generated");

  // Clean the generated diagram
  const cleanedDiagram = await cleanDiagramWithTip20(
    response,
    TIP20_MODEL,
    silent
  );

  if (saveLogStep)
    saveLogStep({
      type: "diagram_cleaned",
      diagram: cleanedDiagram,
      model: "claude-3-haiku-20240307",
    });

  return cleanedDiagram;
}
