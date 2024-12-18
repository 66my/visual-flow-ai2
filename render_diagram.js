import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function renderDiagram(inputFile, outputFile) {
    const mmdc = path.join(__dirname, 'node_modules', '.bin', 'mmdc');
    const configFile = path.join(__dirname, 'mermaid-config.json');
    
    const command = `"${mmdc}" -i "${inputFile}" -o "${outputFile}" -c "${configFile}" -w 2048 -H 1536 -b transparent`;
    
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error:', error);
                reject(error);
                return;
            }
            
            const result = {
                success: !error,
                filename: outputFile,
                executionTime: Date.now(),
                command: command
            };
            
            if (stderr) {
                result.err = stderr;
            }
            
            console.log('Render result:', result);
            resolve(result);
        });
    });
}

// 渲染所有示例图表
async function renderExamples() {
    const examples = [
        { input: 'examples/diagrams/ecommerce.mmd', output: 'examples/diagrams/ecommerce.png' },
        { input: 'examples/diagrams/medical_workflow.mmd', output: 'examples/diagrams/medical_workflow.png' },
        { input: 'examples/diagrams/project_structure.mmd', output: 'examples/diagrams/project_structure.png' }
    ];

    for (const example of examples) {
        console.log(`Rendering ${example.input}...`);
        try {
            await renderDiagram(example.input, example.output);
            console.log(`Successfully rendered ${example.output}`);
        } catch (error) {
            console.error(`Failed to render ${example.input}:`, error);
        }
    }
}

// 如果直接运行脚本，渲染所有示例
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    renderExamples().catch(console.error);
}
