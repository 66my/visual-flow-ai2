import { diagen } from '../dist/index.js';
import fs from 'fs';

// 设置 API key
process.env.ZHIPU_API_KEY = '25252cf34711146fe210453392a841cb.ykKVOBK71ANZ7HwN';

// 读取原始数据
const data = fs.readFileSync('../raw_data_肉桂_simplified.md', 'utf-8');

async function run() {
  try {
    const result = await diagen(
      data,
      "中药肉桂相关数据",
      "药物关系图",
      "glm-4-plus",  // 使用 Zhipu AI 的模型
      3,  // maxFixSteps
      2,  // maxCritiqueRounds
      true,  // provideFixHistory
      true,  // provideCritiqueHistory
      true,  // provideDataForCritique
      "./output",  // outputDir
      true,  // openDiagrams
      false  // silent
    );
    
    console.log('生成结果:', result);
  } catch (error) {
    console.error('发生错误:', error);
  }
}

run();
