import {
  Message,
  SupportedModel,
  GrokModel,
  ZhipuModel,
} from "../types.js";
import {
  writeToFile,
} from "./helpers.js";
import { GLOBAL_TEMPERATURE } from "./constants.js";
import fs from "node:fs";
import path from "node:path";
import axios from "axios";

export const grokAdapter = {
  generate: async (
    model: GrokModel,
    messages: Message[],
    systemPrompt?: string
  ) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error('XAI_API_KEY environment variable is not set');
    }
    
    try {
      const response = await axios({
        method: 'post',
        url: 'https://api.x.ai/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'Diagen/1.0'
        },
        data: {
          model: "grok-2-vision-1212",
          messages: messages,
          stream: true,
          temperature: GLOBAL_TEMPERATURE,
          system: systemPrompt,
        },
        responseType: 'stream'
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
        throw new Error(`API request failed: ${error.message}`);
      }
      throw error;
    }
  },
};

export const zhipuAdapter = {
  generate: async (
    model: ZhipuModel,
    messages: Message[],
    systemPrompt?: string
  ) => {
    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
      throw new Error('ZHIPU_API_KEY environment variable is not set');
    }
    try {
      const response = await axios({
        method: 'post',
        url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
        },
        data: {
          model: model,
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            ...messages
          ],
          temperature: GLOBAL_TEMPERATURE,
        },
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Zhipu API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        throw new Error(`API request failed: ${error.message}`);
      }
      throw error;
    }
  },
};

export async function* callAIStream(
  model: SupportedModel,
  messages: Message[],
  systemPrompt?: string,
  promptSaveLocation?: string,
  promptId?: string
): AsyncGenerator<string, void, undefined> {
  let fullMessage = "";
  if (promptSaveLocation) {
    const promptPath = `${promptSaveLocation}/prompt_${promptId || ""}.txt`;
    const dir = path.dirname(promptPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await writeToFile(promptPath, JSON.stringify({ messages, systemPrompt }, null, 2));
  }

  if (model === "grok-2-vision-1212") {
    const res = await grokAdapter.generate(model, messages, systemPrompt);
    let chunk = await res.read();
    while (!chunk.done) {
      const text = new TextDecoder().decode(chunk.value);
      yield text;
      fullMessage += text;
      chunk = await res.read();
    }
  } else if (model === "glm-4-plus") {
    const response = await zhipuAdapter.generate(model, messages, systemPrompt);
    yield response;
    fullMessage = response;
  } else {
    throw new Error("Unsupported model type");
  }

  if (promptSaveLocation) {
    const responsePath = `${promptSaveLocation}/prompt_${promptId || ""}_response.txt`;
    const dir = path.dirname(responsePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await writeToFile(responsePath, fullMessage);
  }
}
