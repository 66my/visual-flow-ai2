import { SupportedModel } from "../types.js";
import { cleanDiagramWithTip20 } from "../utils/helpers.js";
import { lineTag } from "../utils/lineTag.js";
import { reflectionPrompt } from "./prompts.js";
import { render } from "./render.js";
import { TIP20_MODEL } from "../utils/constants.js";
import fs from "fs";

export async function visualReflect(
  diagramLocation: string,
  modelName: SupportedModel,
  typeofDiagram: string,
  inputData?: string,
  retries: number = 1,
  saveLogStep?: (step: any) => void,
  silent: boolean = false
): Promise<{
  cleanedDiagramCode: string;
  outputPath: string | undefined;
  critique: string;
  response: string;
}> {
  if (!modelName.startsWith("grok-2-vision")) {
    throw new Error("Only grok-2-vision models are supported");
  }

  const prompt = reflectionPrompt(typeofDiagram, diagramLocation, inputData);

  // Call the model
  const response = await cleanDiagramWithTip20(prompt, TIP20_MODEL);

  // Extract the diagram code from the response
  const diagramMatch = response.match(/```(?:mermaid)?\n([\s\S]*?)\n```/);
  if (!diagramMatch) {
    throw new Error("No diagram code found in response");
  }

  const cleanedDiagram = diagramMatch[1].trim();

  // Save the diagram to a file
  const diagramFilename = `${diagramLocation}_improved.mmd`;
  fs.writeFileSync(diagramFilename, cleanedDiagram);

  // Render the diagram
  const renderResult = await render(
    diagramFilename,
    diagramLocation,
    "improved",
    undefined,
    saveLogStep
  );

  if (!renderResult.success) {
    throw new Error(`Failed to render diagram: ${renderResult.err}`);
  }

  return {
    cleanedDiagramCode: cleanedDiagram,
    outputPath: renderResult.filename,
    critique: "",
    response,
  };
}
