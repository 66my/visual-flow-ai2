import { exec } from "child_process";
import path from "path";
import fs from "fs";

interface RenderResult {
  success: boolean;
  err?: string;
  filename?: string;
  executionTime: number;
  command: string;
}

export async function render(
  diagramLocation: string,
  diagramsDir: string,
  diagramId: string,
  timeoutMs: number = 5000,
  saveLogStep?: (step: any) => void
): Promise<RenderResult> {
  if (!fs.existsSync(diagramLocation)) {
    return {
      success: false,
      err: `Diagram file not found: ${diagramLocation}`,
      executionTime: 0,
      command: "",
    };
  }

  const outputPath = path.join(diagramsDir, `${diagramId}.png`);
  const configPath = path.join(process.cwd(), 'mermaid-config.json');
  // 使用项目根目录的 node_modules
  const mmdc = path.join(process.cwd(), 'node_modules', '.bin', 'mmdc');
  const command = `"${mmdc}" -i "${diagramLocation}" -o "${outputPath}" -c "${configPath}" -w 2048 -H 1536 -b transparent`;

  return new Promise<RenderResult>((resolve) => {
    const startTime = Date.now();
    const process = exec(command, (err, stdout, stderr) => {
      const executionTime = Date.now() - startTime;
      if (err) {
        const result: RenderResult = {
          success: false,
          err: stderr || err?.message || "mmdc command failed",
          executionTime,
          command,
        };
        if (saveLogStep) {
          saveLogStep({
            type: "render_error",
            diagramId,
            command,
            diagramLocation,
            err: result.err,
            stderr,
            stdout,
            executionTime,
          });
        }
        resolve(result);
      } else {
        const result: RenderResult = {
          success: true,
          filename: outputPath,
          executionTime,
          command,
        };
        if (saveLogStep) {
          saveLogStep({
            type: "render_success",
            diagramId,
            outputPath,
            diagramLocation,
            executionTime,
          });
        }
        resolve(result);
      }
    });

    setTimeout(() => {
      process.kill();
      const result: RenderResult = {
        success: false,
        err: "Render process timed out",
        executionTime: timeoutMs,
        command,
      };
      if (saveLogStep) {
        saveLogStep({
          type: "render_timeout",
          diagramId,
          diagramLocation,
          executionTime: timeoutMs,
        });
      }
      resolve(result);
    }, timeoutMs);
  });
}
