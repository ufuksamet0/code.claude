import { invoke } from "@tauri-apps/api/core";
import type { AppMode } from "./types";

export async function loadMemoryIndex(mode: AppMode) {
  return invoke<Record<string, unknown>>("memory_read_index", { mode });
}

export async function saveMemoryIndex(mode: AppMode, index: Record<string, unknown>) {
  return invoke("memory_write_index", { mode, index });
}

export async function listFacts(mode: AppMode) {
  return invoke<string[]>("memory_list_facts", { mode });
}

export async function readFact(mode: AppMode, name: string) {
  return invoke<string>("memory_read_fact", { mode, name });
}

export async function writeFact(mode: AppMode, name: string, content: string) {
  return invoke("memory_write_fact", { mode, name, content });
}

export async function buildMemoryContext(mode: AppMode, maxChars = 4000): Promise<string> {
  const index = (await loadMemoryIndex(mode)) as {
    summary?: string;
  };
  const names = await listFacts(mode);
  const parts: string[] = [];
  if (index.summary) {
    parts.push(`Özet: ${index.summary}`);
  }
  let used = parts.join("\n").length;
  for (const n of names) {
    if (used >= maxChars) break;
    const body = await readFact(mode, n);
    const block = `\n### ${n}\n${body}`;
    if (used + block.length > maxChars) break;
    parts.push(block);
    used += block.length;
  }
  return parts.join("\n\n");
}
