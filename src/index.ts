import 'dotenv/config';
import {
  generateText,
  streamText,
  stepCountIs,
  tool,
  type ModelMessage,
  type Tool,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createInterface } from 'node:readline/promises';
import { weatherTool, calculatorTool } from './tools/utility-tools';
import { agentLoop } from './agent/loop';

const provider = createOpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.PROVIDER_API_KEY,
});

const model = provider.chat('deepseek-flash');

async function main() {
  // const result = await generateText({
  //   model,
  //   prompt: '用一句话描述你自己',
  // });
  // console.log(result.text);
  // console.log(result.output);

  const result = streamText({
    model,
    prompt: '用一句话描述你自己',
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
}

// main();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

const instructions =
  '你是 Super Agent，一个专注于软件开发的 AI 助手。你说话简洁直接，喜欢用代码示例来解释问题。如果用户的问题不够清晰，你会反问而不是瞎猜。';

const tools: Record<string, Tool> = {
  weatherTool,
  calculatorTool,
};

async function ask() {
  while (true) {
    // 用户输入开始：
    const input = await rl.question('\nYou: ');
    const trimed = input.trim();

    if (!input || input === 'exit') {
      console.log('Bye!');
      rl.close();
      break;
    }

    messages.push({ role: 'user', content: trimed });
    // 用户输入结束

    const result = streamText({
      model,
      instructions,
      messages,
      tools,
      stopWhen: stepCountIs(5),
    });

    // 助手回复开始
    // process.stdout.write('\nAssistant: ');
    // let fullResponse = '';

    // 纯文本
    // for await (const chunk of result.textStream) {
    //   // 打字机输出
    //   process.stdout.write(chunk);
    //   fullResponse += chunk;
    // }

    // 包含工具的消息流
    // for await (const part of result.stream) {
    //   switch (part.type) {
    //     case 'text-delta':
    //       // 文本片段（跟textStream一样）
    //       process.stdout.write(part.text);
    //       break;
    //     case 'tool-call':
    //       // 模型决定调用某个工具，包含工具名和参数
    //       console.log(
    //         `调用工具id:${part.toolCallId}, 工具名 ${part.toolName}, input: ${JSON.stringify(part.input)}`,
    //       );
    //       break;
    //     case 'tool-result':
    //       // 工具执行完毕，包含返回值
    //       console.log(
    //         `调用工具id:${part.toolCallId}, 工具名 ${part.toolName}, output: ${JSON.stringify(part.output)}`,
    //       );
    //       break;
    //     case 'start-step':
    //       console.log(`step-start: ${JSON.stringify(part.request)}`);
    //       break;
    //     case 'finish-step':
    //       console.log(`step finish: ${JSON.stringify(part.response)}`);
    //       break;
    //     case 'finish':
    //       console.log('all step finish');
    //       break;
    //   }
    // }

    // 将助手（LLM）的回复记录到messages消息记录
    // messages.push({ role: 'assistant', content: fullResponse });

    await agentLoop({ model, messages, instructions, tools });
  }
}

console.log('Super Agent type "exit" to quit \n');
ask();
