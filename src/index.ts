import 'dotenv/config';
import { streamText, stepCountIs, type ModelMessage } from 'ai';
import { weatherTool, calculatorTool } from './tools/utility-tools'
import { createOpenAI } from '@ai-sdk/openai';
import { createMockModel } from './mock-model';
import { createInterface } from 'node:readline'
import { agentLoop } from './agent/loop'

const qwen = createOpenAI({
  baseURL: 'https://wzw.pp.ua/v1',
  apiKey: process.env.DASHSCOPE_API_KEY,
});

const tools = { get_weather: weatherTool, calculator: calculatorTool }

const model = process.env.DASHSCOPE_API_KEY
  ? qwen.chat('qwen3.8-flash')
  : createMockModel();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

const messages: ModelMessage[] = []

// function ask() {
//   rl.question('\nYou：', async input => {
//     const trimmed = input.trim()
//     if (!trimmed || trimmed === 'exit') {
//       console.log('Bye!')
//       rl.close()
//       return
//     }

//     messages.push({ role: 'user', content: trimmed })

//     const result = streamText({
//       model,
//       tools,
//       messages,
//       stopWhen: stepCountIs(5),
//       system: `你是 Super Agent，一个专注于软件开发的 AI 助手。
//               你说话简洁直接，喜欢用代码示例来解释问题。
//               如果用户的问题不够清晰，你会反问而不是瞎猜。`,
//     })

//     process.stdout.write('Assistant: ')
//     for await (const part of result.stream) {
//       switch (part.type) {
//         case 'text-delta':
//           process.stdout.write(part.text)
//           break
//         case 'tool-call':
//           console.log(`\n  [调用工具: ${part.toolName}(${JSON.stringify(part.input)})]`);
//           break;
//         case 'tool-result':
//           console.log(`  [工具返回: ${JSON.stringify(part.output)}]`);
//           break;
//         case 'tool-error':
//           console.log(`  [工具报错: ${part.toolName} -> ${String(part.error)}]`);
//           break;
//         case 'error':
//           console.error(`\n  [对话出错: ${String(part.error)}]`);
//           break;
//       }
//     }
//     console.log()

//     // 把所有 step 生成的 assistant / tool 消息原样写回历史，
//     // 下一轮模型才能看到完整的工具调用与返回结果。
//     messages.push(...await result.responseMessages)

//     ask()

//   })
// }

// console.log('Super Agent v0.1 (type "exit" to quit)\n');
// ask();


const SYSTEM = `你是 Super Agent，一个有工具调用能力的 AI 助手。
需要查询信息时，主动使用工具，不要编造数据。
回答要简洁直接。`;

function ask() {
  rl.question('\nYou: ', async (input) => {
    const trimmed = input.trim();
    if (!trimmed || trimmed === 'exit') {
      console.log('Bye!');
      rl.close();
      return;
    }

    messages.push({ role: 'user', content: trimmed });

    await agentLoop(model, tools, messages, SYSTEM);

    ask();
  });
}

console.log('Super Agent v0.2 — Agent Loop (type "exit" to quit)\n');
ask();
