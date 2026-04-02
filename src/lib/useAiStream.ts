import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { ChatMessage } from "./types";

export async function runAiChatStream(
  provider: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  onDelta: (text: string) => void,
): Promise<void> {
  const requestId = crypto.randomUUID();

  const unsubs: Array<() => void> = [];

  const done = new Promise<void>((resolve, reject) => {
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      for (const u of unsubs) {
        try {
          u();
        } catch {
          /* ignore */
        }
      }
      resolve();
    };

    const fail = (msg: string) => {
      if (finished) return;
      finished = true;
      for (const u of unsubs) {
        try {
          u();
        } catch {
          /* ignore */
        }
      }
      reject(new Error(msg));
    };

    listen<{ requestId: string; delta: string }>("ai-chunk", (e) => {
      if (e.payload.requestId === requestId) {
        onDelta(e.payload.delta);
      }
    }).then((u) => unsubs.push(u));

    listen<{ requestId: string }>("ai-done", (e) => {
      if (e.payload.requestId === requestId) {
        finish();
      }
    }).then((u) => unsubs.push(u));

    listen<{ requestId?: string; error?: string }>("ai-error", (e) => {
      const p = e.payload;
      if (p.requestId === requestId || (p.error && !p.requestId)) {
        fail(p.error ?? "Bilinmeyen akış hatası");
      }
    }).then((u) => unsubs.push(u));

    invoke("ai_chat_stream", {
      req: {
        provider,
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        systemPrompt,
        requestId,
      },
    }).catch((err) => {
      fail(String(err));
    });
  });

  await done;
}
