import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { toolDefinitions } from "@/lib/ai/tools";
import { handleToolCall } from "@/lib/ai/tool-handlers";

const MAX_TOOL_ITERATIONS = 10;
const CHUNK_SIZE = 50;
const CHUNK_DELAY_MS = 15;

function sseEncode(data: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const { messages, userRole } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: "messages array is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = userRole
    ? `${SYSTEM_PROMPT}\n\n## Current User Role\nYou are speaking with a user whose role is: ${userRole}. Tailor your responses to their likely responsibilities and access level.`
    : SYSTEM_PROMPT;

  const anthropicMessages: Anthropic.MessageParam[] = messages.map(
    (msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })
  );

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const processAsync = async () => {
    try {
      let currentMessages = [...anthropicMessages];
      let iterations = 0;

      while (iterations < MAX_TOOL_ITERATIONS) {
        await writer.write(
          sseEncode({ type: "status", message: "Thinking..." })
        );

        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: systemPrompt,
          tools: toolDefinitions as Anthropic.Tool[],
          messages: currentMessages,
        });

        const toolUseBlocks = response.content.filter(
          (
            block
          ): block is Anthropic.ContentBlockParam & {
            type: "tool_use";
            id: string;
            name: string;
            input: Record<string, unknown>;
          } => block.type === "tool_use"
        );

        if (toolUseBlocks.length === 0) {
          // Final response - extract text and stream it in chunks
          const textBlocks = response.content.filter(
            (block): block is Anthropic.TextBlock => block.type === "text"
          );
          const fullText = textBlocks.map((b) => b.text).join("\n");

          // Stream text in chunks for a natural typing feel
          for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
            const chunk = fullText.slice(i, i + CHUNK_SIZE);
            await writer.write(sseEncode({ type: "delta", text: chunk }));
            if (i + CHUNK_SIZE < fullText.length) {
              await sleep(CHUNK_DELAY_MS);
            }
          }

          await writer.write(sseEncode({ type: "done" }));
          await writer.close();
          return;
        }

        // Handle tool calls
        const toolNames = toolUseBlocks.map((t) => t.name).join(", ");
        await writer.write(
          sseEncode({ type: "status", message: `Running: ${toolNames}` })
        );

        // Append assistant response with tool_use blocks
        currentMessages.push({
          role: "assistant",
          content: response.content,
        });

        // Execute each tool call and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
          (toolBlock) => {
            const result = handleToolCall(
              toolBlock.name,
              toolBlock.input as Record<string, unknown>
            );
            return {
              type: "tool_result" as const,
              tool_use_id: toolBlock.id,
              content: result,
            };
          }
        );

        // Append tool results as a user message
        currentMessages.push({
          role: "user",
          content: toolResults,
        });

        iterations++;
      }

      // Exhausted iterations
      const exhaustedMsg =
        "I apologize, but I needed more tool calls than allowed to fully answer your question. Please try a more specific query.";
      for (let i = 0; i < exhaustedMsg.length; i += CHUNK_SIZE) {
        const chunk = exhaustedMsg.slice(i, i + CHUNK_SIZE);
        await writer.write(sseEncode({ type: "delta", text: chunk }));
      }
      await writer.write(sseEncode({ type: "done" }));
      await writer.close();
    } catch (error: any) {
      console.error("Chat API error:", error?.message || error);
      const errorMsg = error?.status === 401
        ? "API key is invalid or expired"
        : error?.status === 429
        ? "Rate limited — please wait a moment and try again"
        : error?.message || "An unexpected error occurred";
      await writer.write(
        sseEncode({ type: "error", message: errorMsg })
      );
      await writer.close();
    }
  };

  processAsync();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
