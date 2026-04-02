export type AppMode = "code" | "video" | "photo" | "agents" | "pc" | "test";

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ProviderId =
  | "openai"
  | "anthropic"
  | "ollama"
  | "google"
  | "groq"
  | "mistral"
  | "openrouter"
  | "together"
  | "xai"
  | "deepseek"
  | "perplexity"
  | "llama"
  | "qwen";
