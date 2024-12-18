#!/usr/bin/env node

import { select, input, confirm } from "@inquirer/prompts";
import { SupportedModel } from "./types.js";
import { diagen } from "./diagen.js";
import { checkModelAuthExists } from "./utils/helpers.js";
import { countTokens } from "@anthropic-ai/tokenizer";
import fs from "node:fs";
import path from "node:path";

async function runWizard() {
  // Print the version of diagen
  console.log("Diagen v0.0.7");

  // Check for command line arguments
  const [, , sourceFile, outputDir] = process.argv;

  if (!sourceFile) {
    console.log(
      "Please provide a path to the source text file as an argument."
    );
    process.exit(1);
  }

  // Read the source file
  let data: string;
  try {
    data = fs.readFileSync(sourceFile, "utf-8");
  } catch (error) {
    console.error("Error reading source file:", error);
    process.exit(1);
  }

  if (countTokens(data) > 100 * 1000) {
    console.error(
      "The source file is larger than 100k tokens. Do you want to continue? This may cause errors."
    );
    try {
      const continueAnyway = await confirm({
        message: "Continue anyway?",
        default: true,
      });
      if (!continueAnyway) {
        console.log("See you when you've fixed it!");
        process.exit(1);
      }
    } catch (error: any) {
      if (error.message.includes("User force closed")) {
        console.log("\nOperation cancelled by user.");
        process.exit(0);
      }
      throw error;
    }
  }

  // Wizard for selecting parameters
  let dataDesc: string;
  try {
    dataDesc = await input({
      message: "Enter a brief description of the data:",
    });
  } catch (error: any) {
    if (error.message.includes("User force closed")) {
      console.log("\nOperation cancelled by user.");
      process.exit(0);
    }
    throw error;
  }

  let diagramDesc: string;
  try {
    diagramDesc = await input({
      message: "Enter a description of the diagram you want to generate:",
    });
  } catch (error: any) {
    if (error.message.includes("User force closed")) {
      console.log("\nOperation cancelled by user.");
      process.exit(0);
    }
    throw error;
  }

  let maxFixSteps: string;
  try {
    maxFixSteps = await input({
      message:
        "How many times should we try to fix a broken diagram? (recommended: 4):",
      default: "4",
      validate: (value) => !isNaN(Number(value)) || "Please enter a number",
    });
  } catch (error: any) {
    if (error.message.includes("User force closed")) {
      console.log("\nOperation cancelled by user.");
      process.exit(0);
    }
    throw error;
  }

  let maxCritiqueRounds: string;
  try {
    maxCritiqueRounds = await input({
      message:
        "How many times should we try to improve diagrams? (default: 4):",
      default: "4",
      validate: (value) => !isNaN(Number(value)) || "Please enter a number",
    });
  } catch (error: any) {
    if (error.message.includes("User force closed")) {
      console.log("\nOperation cancelled by user.");
      process.exit(0);
    }
    throw error;
  }

  let provideFixHistory: boolean;
  try {
    provideFixHistory = await confirm({
      message: "Allow the AI to remember previous fix attempts?",
      default: true,
    });
  } catch (error: any) {
    if (error.message.includes("User force closed")) {
      console.log("\nOperation cancelled by user.");
      process.exit(0);
    }
    throw error;
  }

  let provideCritiqueHistory: boolean;
  try {
    provideCritiqueHistory = await confirm({
      message: "Allow the AI to remember previous critique attempts?",
      default: true,
    });
  } catch (error: any) {
    if (error.message.includes("User force closed")) {
      console.log("\nOperation cancelled by user.");
      process.exit(0);
    }
    throw error;
  }

  let provideDataForCritique: boolean;
  try {
    provideDataForCritique = await confirm({
      message:
        "Allow the model to use the source data for critiques? (Increases cost but improves results)",
      default: true,
    });
  } catch (error: any) {
    if (error.message.includes("User force closed")) {
      console.log("\nOperation cancelled by user.");
      process.exit(0);
    }
    throw error;
  }

  let outputDirectory = outputDir;

  if (!outputDirectory) {
    try {
      outputDirectory = await input({
        message:
          "Please provide a directory to save the diagrams and code to (leave empty for a diagen directory in the current folder): ",
      });
    } catch (error: any) {
      if (error.message.includes("User force closed")) {
        console.log("\nOperation cancelled by user.");
        process.exit(0);
      }
      throw error;
    }

    if (!outputDirectory) {
      outputDirectory = path.join(
        process.cwd(),
        `diagen_${new Date().toISOString().replace(/[^0-9]/g, "")}`
      );
    }
  }

  console.log("Saving outputs to ", outputDirectory);

  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  // Run diagen
  const result = await diagen(
    data,
    dataDesc,
    diagramDesc,
    "glm-4-plus" as SupportedModel,
    Number(maxFixSteps),
    Number(maxCritiqueRounds),
    provideFixHistory,
    provideCritiqueHistory,
    provideDataForCritique,
    outputDirectory,
    true,
    false
  );

  console.log("Completed. Results saved to", outputDirectory);
  console.log(
    "Diagen is still in alpha. \n\nNext step is a GUI and adding pdf and multiple doc imports. \n\nTo follow development, please leave a star at https://github.com/southbridgeai/diagen :)"
  );

  process.exit(0);
}

runWizard();
