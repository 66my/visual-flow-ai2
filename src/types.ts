export type GeminiModel =
  | "gemini-1.5-flash-002"
  | "gemini-1.5-flash-8b"
  | "gemini-1.5-pro-002";

export type OpenRouterModel = string;

export type GrokModel = "grok-2-vision-1212";

export type ZhipuModel = "glm-4v" | "glm-4" | "glm-4-plus";

export type SupportedModel = 
  | GrokModel
  | GeminiModel
  | OpenRouterModel
  | ZhipuModel;

export type FixAttempt = {
  diagramCode: string;
  errors: string;
  fixedDiagram: string;
  response: string;
  d2Command: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type CritiqueHistoryItem = {
  diagramCode: string;
  critique: string;
  fullResponse: string;
  improvedDiagram: string;
};

export type DiagramRun = {
  id: string;
  config: {
    generationModel: SupportedModel;
    critiqueModel?: string;
    maxFixSteps: number;
    maxCritiqueRounds: number;
    provideFixHistory: boolean;
    provideCritiqueHistory: boolean;
    provideDataForCritique: boolean;
    outputDir: string;
  };
  rounds: DiagramRound[];
  totalTime: number;
};

type DiagramRound = {
  critiqueNumber: number;
  initialDiagramCode: string;
  fixes: FixAttempt[];
  finalDiagramCode: string;
  renderedDiagramFilename: string;
  critique?: string;
  failureReason?: string;
  timeTaken: number;
  steps: any[];
};
