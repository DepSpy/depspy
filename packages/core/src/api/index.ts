import { ApiConfig } from "./config";
import { RiskAnalysisPrompt } from "./prompts";
import OpenAI from "openai";
export async function getRiskAnalysis(
  diff: string,
): Promise<{ level: string; reason: string } | null> {
  if (diff) {
    const client = new OpenAI({
      apiKey: ApiConfig.doubao.key,
      baseURL: ApiConfig.doubao.baseURL,
    });
    try {
      const response = await client.chat.completions.create({
        model: ApiConfig.doubao.model,
        messages: [
          {
            role: "system",
            content: RiskAnalysisPrompt,
          },
          {
            role: "user",
            content: diff,
          },
        ],
      });
      if (response.choices?.[0]?.message?.content) {
        const content = response.choices[0].message.content;
        try {
          const result = JSON.parse(content);
          if (result.level && result.reason) {
            return result;
          }
        } catch (error) {
          return null; // 解析JSON失败，返回null
        }
      }
    } catch (e) {
      console.log(e);
      return null; // 处理错误，返回null
    }
  }
  return null;
}
