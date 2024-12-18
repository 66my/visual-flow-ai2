import { diagen } from './dist/index.js';
import fs from 'fs';
import path from 'path';

// 检查环境变量中的 API 密钥
if (!process.env.ZHIPU_API_KEY) {
  console.error('请设置 ZHIPU_API_KEY 环境变量');
  process.exit(1);
}

// 读取示例文件
const exampleFile = process.argv[2] || './raw_data_肉桂_simplified.md';
const outputFile = process.argv[3] || './output/diagram.mmd';

const data = fs.readFileSync(exampleFile, 'utf-8');

// 解析Markdown内容
function parseMarkdown(content) {
    const lines = content.split('\n');
    let currentSection = '';
    const sections = {};

    lines.forEach(line => {
        if (line.startsWith('## ')) {
            currentSection = line.slice(3).trim();
            sections[currentSection] = [];
        } else if (line.startsWith('- ') && currentSection) {
            sections[currentSection].push(line.slice(2).trim());
        }
    });

    return sections;
}

// 生成Mermaid图表代码
function generateMermaidCode(sections) {
    if (sections['关系']) {
        // 生成ER图
        let code = 'erDiagram\n';
        
        // 添加实体
        const entities = new Set();
        sections['关系'].forEach(relation => {
            const [from, to] = relation.split('->').map(s => s.trim());
            entities.add(from);
            entities.add(to.split(':')[0].trim());
        });

        // 添加属性（如果有）
        if (sections['属性']) {
            sections['属性'].forEach(attr => {
                const [entity, attrs] = attr.split(':').map(s => s.trim());
                if (entities.has(entity)) {
                    code += `    ${entity} {\n`;
                    attrs.split(',').forEach(a => {
                        code += `        string ${a.trim()} ""\n`;
                    });
                    code += '    }\n';
                }
            });
        }

        // 添加关系
        sections['关系'].forEach(relation => {
            const [from, rest] = relation.split('->').map(s => s.trim());
            const [to, desc] = rest.split(':').map(s => s.trim());
            code += `    ${from} ||--o{ ${to} : "${desc}"\n`;
        });

        return code;
    } else if (sections['流程步骤']) {
        // 生成流程图
        let code = 'graph TD\n';
        
        // 添加步骤
        sections['流程步骤'].forEach((step, index) => {
            if (index < sections['流程步骤'].length - 1) {
                code += `    Step${index}[${step}] --> Step${index + 1}[${sections['流程步骤'][index + 1]}]\n`;
            }
        });

        // 添加信息流（如果有）
        if (sections['信息流']) {
            sections['信息流'].forEach(flow => {
                const [from, rest] = flow.split('->').map(s => s.trim());
                const [to, desc] = rest.split(':').map(s => s.trim());
                code += `    ${from} -->|${desc}| ${to}\n`;
            });
        }

        return code;
    } else {
        // 生成思维导图
        let code = 'graph TD\n';
        const title = data.split('\n')[0].slice(2).trim();
        code += `    Root["${title}"]\n`;
        
        Object.entries(sections).forEach(([section, items]) => {
            code += `    Root --> ${section}\n`;
            items.forEach((item, index) => {
                code += `    ${section} --> ${section}_${index}["${item}"]\n`;
            });
        });

        return code;
    }
}

async function generateDiagram() {
    try {
        const sections = parseMarkdown(data);
        const mermaidCode = generateMermaidCode(sections);
        fs.writeFileSync(outputFile, mermaidCode);
        console.log(`Generated diagram code saved to ${outputFile}`);

        const result = await diagen(
            data,
            "肉桂在中药处方中的应用分析数据",
            "knowledge graph showing the applications and relationships of 肉桂 in different prescriptions",
            "glm-4-plus",  // 使用智谱AI的模型
            4,  // maxFixSteps
            4,  // maxCritiqueRounds
            true,  // provideFixHistory
            true,  // provideCritiqueHistory
            true,  // provideDataForCritique
            "./output",  // outputDir
            true,  // openDiagrams
            false  // silent
        );
        console.log('Diagram generation completed:', result);
    } catch (error) {
        console.error('Error generating diagram:', error);
    }
}

generateDiagram();
