import {
  streamText,
  tool,
  type ModelMessage,
  type LanguageModel,
  type Tool,
} from 'ai';
import stream from 'stream';

const MAX_STEP = 10;

export const agentLoop = async ({
  model,
  instructions,
  messages,
  tools,
}: {
  model: LanguageModel;
  instructions: string;
  messages: ModelMessage[];
  tools: Record<string, Tool>;
}) => {
  let currentStep = 0;

  while (currentStep < MAX_STEP) {
    currentStep++;
    console.log(`当前轮次：${currentStep}`);

    process.stdout.write('\nAssistant: ');
    const result = streamText({
      model,
      instructions,
      messages,
      tools,
    });

    let fullText = '';
    let hasToolCalled = false;

    for await (const part of result.stream) {
      switch (part.type) {
        case 'text-delta':
          process.stdout.write(part.text);
          fullText += part.text;
          break;
        case 'tool-call':
          hasToolCalled = true;
          console.log(
            `调用工具 ${part.toolName}(${JSON.stringify(part.input)})`,
          );
          break;
        case 'tool-result':
          console.log(
            `调用工具结果 ${part.toolName}(${JSON.stringify(part.output)})`,
          );
          break;
      }
    }

    // 当前step处理完，处理消息历史
    const msgs = await result.responseMessages;
    messages.push(...msgs);

    if (!hasToolCalled) {
      // 没有工具需要继续调用，结束当前轮次（loop）
      if (fullText) console.log();
      break;
    }

    console.log('\n 任务未完成，继续处理下一个step');
  }

  if (currentStep >= MAX_STEP) {
    console.log('\n[达到最大步数限制，强制停止]');
  }
};
