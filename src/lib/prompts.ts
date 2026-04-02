import type { AppMode } from "./types";

import sharedBase from "../../prompts/_shared/base.md?raw";
import sharedSafety from "../../prompts/_shared/safety.md?raw";
import codeSystem from "../../prompts/code/system.md?raw";
import videoSystem from "../../prompts/video/system.md?raw";
import photoSystem from "../../prompts/photo/system.md?raw";
import agentsSystem from "../../prompts/agents/system.md?raw";
import pcSystem from "../../prompts/pc/system.md?raw";
import testSystem from "../../prompts/test/system.md?raw";

const modePrompt: Record<AppMode, string> = {
  code: codeSystem,
  video: videoSystem,
  photo: photoSystem,
  agents: agentsSystem,
  pc: pcSystem,
  test: testSystem,
};

export function buildSystemPrompt(mode: AppMode): string {
  return [sharedBase.trim(), sharedSafety.trim(), modePrompt[mode].trim()].join(
    "\n\n---\n\n",
  );
}
