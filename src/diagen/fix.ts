import { SupportedModel } from "../types.js";
import { generateDiagram } from "./generate.js";
import { render } from "./render.js";
import path from "path";
import fs from "fs";

interface FixAttempt {
  attempt: number;
  fixedDiagramCode: string;
  fixedLocation: string;
}

export async function checkAndFixDiagram(
  diagramCode: string,
  diagramLocation: string,
  diagramsDir: string,
  diagramId: string,
  model: SupportedModel,
  maxAttempts: number,
  saveLogStep?: (step: any) => void
): Promise<{ success: boolean; fixes: FixAttempt[]; finalDiagramCode: string }> {
  const fixes: FixAttempt[] = [];
  let currentDiagramCode = diagramCode;

  // 首先尝试渲染原始图表
  const renderResult = await render(
    diagramLocation,
    diagramsDir,
    diagramId,
    5000,
    saveLogStep
  );

  if (renderResult.success) {
    return { success: true, fixes: [], finalDiagramCode: currentDiagramCode };
  }

  // 如果渲染失败，尝试修复
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (saveLogStep) {
      saveLogStep({
        type: "fix_attempt_start",
        attempt,
        diagramId,
      });
    }

    const fixedId = `${diagramId}_fixed_${attempt.toString().padStart(2, "0")}`;
    const fixedLocation = path.join(diagramsDir, `${fixedId}.mmd`);

    // 生成修复后的图表代码
    const fixResult = await generateDiagram(
      currentDiagramCode,
      "Fix the Mermaid diagram code",
      "mermaid",
      model,
      diagramsDir,
      saveLogStep
    );

    if (!fixResult || typeof fixResult !== 'string') {
      continue;
    }

    // 提取实际的 Mermaid 代码
    currentDiagramCode = fixResult.replace(/^```mermaid\n|\n```$/g, "").trim();
    
    // 写入修复后的代码
    fs.writeFileSync(fixedLocation, currentDiagramCode);

    if (saveLogStep) {
      saveLogStep({
        type: "fix_attempt",
        attempt,
        fixedDiagramCode: currentDiagramCode,
        fixedLocation,
      });
    }

    fixes.push({
      attempt,
      fixedDiagramCode: currentDiagramCode,
      fixedLocation,
    });

    // 尝试渲染修复后的图表
    const fixedRenderResult = await render(
      fixedLocation,
      diagramsDir,
      fixedId,
      5000,
      saveLogStep
    );

    if (fixedRenderResult.success) {
      return {
        success: true,
        fixes,
        finalDiagramCode: currentDiagramCode,
      };
    }
  }

  return {
    success: false,
    fixes,
    finalDiagramCode: currentDiagramCode,
  };
}
