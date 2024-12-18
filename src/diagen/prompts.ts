import { lineTag } from "../utils/helpers.js";

// prettier-ignore
export const critiquePrompt = (typeofDiagram: string, inputData?: string) =>
(inputData ? `DATA: \n\`\`\`${inputData}\`\`\`\n` : "") +
`You are a diagram expert that can analyze and critique diagrams. Analyze the diagram for visual design, clarity, and effectiveness. Focus on layout, connections, grouping, etc. Provide just the actionable critiques (relevant to the diagram) and ways to improve and simplify, while covering what is useful to keep. Stay within what Mermaid can do. Stay away from vague criticisms, provide actionable changes, even suggest direct changes to the diagram. Too many disparate unconnected blocks aren't good. Don't ask to add a legend.`;

// prettier-ignore
export const fixPrompt = (errors: string, diagramCode: string) =>
`Here is a diagram that has errors:

\`\`\`mermaid
${lineTag(diagramCode)}
\`\`\`

Here are the errors:
\`\`\`
${errors}
\`\`\`

You are a diagram expert that can fix broken diagrams. Analyze the errors in the diagram and fix them.
Explain why the errors are happening. Then fix the errors in the Mermaid diagram code provided, and return the fixed code. Keep an eye out for recurring errors and try new fixes.`;

// prettier-ignore
export const generationPrompt = (data: string, dataDesc: string, typeofDiagram: string) =>
`DATA:
\`\`\`
${data}
\`\`\`

INSTRUCTION: Data is ${dataDesc}. Generate a landscape (left to right preferred) Mermaid diagram code (in mermaid code blocks) for the DATA provided, covering ${typeofDiagram}. 1. Feel free to be creative
2. Provide a single diagram only, with good visual design. 3. Make sure the code is for Mermaid and not any other format.

EXAMPLES OF GOOD PRACTICES:
1. Use graph LR for left-to-right layout
2. Use subgraph for grouping related nodes
3. Use meaningful styles and shapes
4. Keep the diagram clean and readable
5. Use proper edge styling for relationships

EXAMPLE MERMAID FORMAT:
\`\`\`mermaid
graph LR
    subgraph Group1
        A[Node A] --> B[Node B]
    end
    subgraph Group2
        C[Node C] --> D[Node D]
    end
    B --> C
\`\`\``;

// prettier-ignore
export const reflectionPrompt = (typeofDiagram: string, critique: string, diagramCode?: string,inputData?: string) =>
`${inputData ? `DATA: \n\`\`\`${inputData}\`\`\`\n` : ""}${diagramCode? `DIAGRAM: \n\n\`\`\`mermaid\n${diagramCode}\n\`\`\`\n`: ""}Areas to improve:\n\`\`\`\n${critique}\n\`\`\`
${
    diagramCode ? `Provided is a Mermaid ${typeofDiagram} diagram` : 'Here are more suggestions.'
}${inputData ? " generated from DATA" : ""}. Apply the critiques when possible to improve the diagram but don't make it too complex. Explain very shortly how you will improve, then generate and return the improved Mermaid diagram code.`;
