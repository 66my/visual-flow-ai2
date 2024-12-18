import {
  CritiqueHistoryItem,
  DiagramRun,
  FixAttempt,
  SupportedModel,
} from "./types.js";
import {
  checkModelAuthExists,
  createTempDir,
  isCommandAvailable,
  writeToFile,
} from "./utils/helpers.js";
import { generateDiagram } from "./diagen/generate.js";
import { checkAndFixDiagram as fix } from "./diagen/fix.js";
import { visualReflect } from "./diagen/visualReflect.js";
import { improveDiagramWithCritique } from "./diagen/improve.js";

/**
 *
 * @param data Large string data to use as the primary source for generating the diagram.
 * @param dataDesc Description of the data (few words up to a sentence).
 * @param typeofDiagram Description of diagram to be generated.
 * @param generationModel Model to use to generate diagrams.
 * @param maxFixSteps Number of attempts allowed to fix broken diagrams.
 * @param maxCritiqueRounds Number of rounds of reflection to improve diagrams.
 * @param provideFixHistory Enable this to allow the model to remember previous attempts to fix diagrams.
 * @param provideCritiqueHistory Enable this to allow the model to remember previous attempts to improve diagrams.
 * @param provideDataForCritique Enable this to allow the model to use the data to improve diagrams. Increasers cost but improves results.
 * @param outputDir Custom directory to use for temporary files. If not provided, a temporary directory will be created.
 * @param openDiagrams Enable this to open the diagrams after they're generated.
 * @param silent Enable this to disable all console spinners and logs.
 */
export async function diagen(
  data: string,
  dataDesc: string,
  typeofDiagram: string,
  generationModel: SupportedModel,
  maxFixSteps: number,
  maxCritiqueRounds: number,
  provideFixHistory: boolean,
  provideCritiqueHistory: boolean,
  provideDataForCritique: boolean,
  outputDir: string,
  openDiagrams: boolean,
  silent: boolean = false
): Promise<DiagramRun> {
  checkModelAuthExists(generationModel);

  const mermaidIsAvailable = await isCommandAvailable("mmdc");

  if (!mermaidIsAvailable) {
    throw new Error(
      "mermaid is not available on your system. Please install it from https://mermaid.js.org/cli.html"
    );
  }

  const runId = Math.random().toString(36).substring(2, 10);
  const tempDir = outputDir || createTempDir();
  const logFilename = `${tempDir}/${runId}_log.json`;
  const promptsDir = `${tempDir}/prompts`;

  function createDirectory(dir: string) {
    // No fs usage
  }

  createDirectory(promptsDir);

  const run: DiagramRun = {
    id: runId,
    config: {
      generationModel,
      maxFixSteps,
      maxCritiqueRounds,
      provideFixHistory,
      provideCritiqueHistory,
      provideDataForCritique,
      outputDir: tempDir,
    },
    rounds: [],
    totalTime: 0,
  };

  let critiqueRound = 0;
  const saveLogStep = (step: any) => {
    if (!run.rounds[critiqueRound]) {
      run.rounds[critiqueRound] = {
        critiqueNumber: critiqueRound,
        initialDiagramCode: "",
        fixes: [],
        finalDiagramCode: "",
        renderedDiagramFilename: "",
        timeTaken: 0,
        steps: [],
      };
    }
    run.rounds[critiqueRound].steps.push(step);
    writeToFile(logFilename, JSON.stringify(run, null, 2));
  };

  const startTime = Date.now();

  try {
    const initialDiagram = await generateDiagram(
      data,
      dataDesc,
      typeofDiagram,
      generationModel,
      tempDir,
      saveLogStep,
      silent
    );

    let currentDiagramFilename = `${tempDir}/initial_diagram.mmd`;
    writeToFile(currentDiagramFilename, initialDiagram);

    let critiqueHistory: CritiqueHistoryItem[] = [];

    for (; critiqueRound < maxCritiqueRounds; critiqueRound++) {
      const roundStartTime = Date.now();
      const diagramId = `diagram_${critiqueRound.toString().padStart(2, "0")}`;

      run.rounds[critiqueRound] = {
        critiqueNumber: critiqueRound,
        initialDiagramCode: initialDiagram,
        fixes: [],
        finalDiagramCode: "",
        renderedDiagramFilename: "",
        timeTaken: 0,
        steps: [],
      };

      const diagramCheck = await fix(
        initialDiagram,
        currentDiagramFilename,
        tempDir,
        diagramId,
        generationModel,
        maxFixSteps,
        (fixAttempt: FixAttempt) => {
          run.rounds[critiqueRound].fixes.push(fixAttempt);
          saveLogStep(fixAttempt);
        }
      );

      if (!diagramCheck || !diagramCheck.success) {
        run.rounds[critiqueRound].failureReason = "Failed to fix diagram";
        saveLogStep({ failureReason: "Failed to fix diagram" });
        break;
      }

      currentDiagramFilename = diagramCheck.finalDiagramCode;
      run.rounds[critiqueRound].finalDiagramCode = currentDiagramFilename;
      // run.rounds[critiqueRound].renderedDiagramFilename =
      //   diagramCheck.outputImage;

      if (openDiagrams) {
        try {
          // No open usage
        } catch (error) {
          console.error("Failed to open diagram:", error);
        }
      }

      if (critiqueRound === maxCritiqueRounds - 1) break;

      const newDiagram = await visualReflect(
        currentDiagramFilename,
        generationModel,
        typeofDiagram,
        provideDataForCritique ? data : undefined,
        1,
        saveLogStep,
        silent
      );

      critiqueHistory.push({
        diagramCode: currentDiagramFilename,
        critique: newDiagram.critique,
        fullResponse: newDiagram.response,
        improvedDiagram: newDiagram.cleanedDiagramCode,
      });

      currentDiagramFilename = `${tempDir}/${diagramId}_improved.mmd`;
      writeToFile(currentDiagramFilename, newDiagram.cleanedDiagramCode);

      run.rounds[critiqueRound].timeTaken = Date.now() - roundStartTime;
      saveLogStep({ timeTaken: run.rounds[critiqueRound].timeTaken });
    }
  } catch (error) {
    console.error("Error in diagen:", error);
    run.rounds.push({
      critiqueNumber: critiqueRound,
      initialDiagramCode: "",
      fixes: [],
      finalDiagramCode: "",
      renderedDiagramFilename: "",
      failureReason: (error as Error).message,
      timeTaken: 0,
      steps: [],
    });
    saveLogStep({ failureReason: (error as Error).message });
  }

  run.totalTime = Date.now() - startTime;
  saveLogStep({ totalTime: run.totalTime });

  // Pretty print results
  if (!silent) {
    console.log("\nDiagram generation complete!");
    console.log(`Total time: ${run.totalTime}ms`);
    console.log(`Rounds: ${run.rounds.length}`);
    console.log(`Output directory: ${outputDir}`);
  }

  return run;
}
