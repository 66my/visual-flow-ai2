import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { SupportedModel } from "../types.js";
import ora from "ora";

export function lineTag(input: string): string {
  // Split the input string into an array of lines
  const lines = input.split("\n");

  // Map over each line, adding the line number tag
  const taggedLines = lines.map((line, index) => {
    const lineNumber = index + 1;
    return `L${lineNumber}: ${line}`;
  });

  // Join the tagged lines back into a single string
  return taggedLines.join("\n");
}

export function removeLineTag(input: string): string {
  const lines = input.split("\n");
  const untaggedLines = lines.map((line) => {
    // Use a regular expression to match and remove the line tag
    return line.replace(/^L\d+:\s*/, "");
  });
  return untaggedLines.join("\n");
}

// Helper functions
export const createTempDir = () => {
  const saveDir = path.join(
    __dirname,
    `../../.diagen/${new Date().toISOString().replace(/[^0-9]/g, "")}`
  );
  if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });
  return saveDir;
};

export const writeToFile = (filename: string, content: string) => {
  fs.writeFileSync(filename, content);
};

export const isGrokModel = (model: string): model is SupportedModel => {
  return model === "grok-2-vision-1212";
};

export const isCommandAvailable = async (command: string): Promise<boolean> => {
  try {
    await exec(`command -v ${command}`);
    return true;
  } catch (error) {
    return false;
  }
};

export const checkModelAuthExists = (
  model: SupportedModel,
  silent: boolean = false
): boolean => {
  if (isGrokModel(model)) {
    const key = "sk-or-v0-cd3c2a2c5b8c4c4c9b9b9b9b9b9b9b9b";
    return true;
  }
  return false;
};

export const cleanDiagramWithTip20 = async (
  diagramCode: string,
  modelName: string,
  silent: boolean = true
): Promise<string> => {
  const matchedDiagram = diagramCode.match(/```(?:mermaid)?\s*?\n([\s\S]*?)\n\s*?```/g);
  if (matchedDiagram) {
    const cleanedDiagram = matchedDiagram[0]
      .replace(/```(?:mermaid)?\s*?\n/g, "")
      .replace(/\n\s*?```/g, "")
      .trim();

    return cleanedDiagram;
  } else {
    const matchedDiagramWithoutMermaid = diagramCode.match(/```\s*?\n([\s\S]*?)\n\s*?```/g);
    if (matchedDiagramWithoutMermaid) {
      const cleanedDiagram = matchedDiagramWithoutMermaid[0]
        .replace(/```\s*?\n/g, "")
        .replace(/\n\s*?```/g, "")
        .trim();
      return cleanedDiagram;
    } else {
      return diagramCode;
    }
  }
};
