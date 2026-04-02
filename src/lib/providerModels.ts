import type { ProviderId } from "./types";

/** Çok modelli sağlayıcılarda aramalı seçici kullanılır */
export const SEARCHABLE_PROVIDERS: ReadonlySet<ProviderId> = new Set([
  "openrouter",
  "groq",
  "together",
  "openai",
  "ollama",
]);

const OPENAI: readonly string[] = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
  "o1",
  "o1-mini",
  "o3-mini",
  "chatgpt-4o-latest",
];

const ANTHROPIC: readonly string[] = [
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
];

const GOOGLE: readonly string[] = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

const GROQ: readonly string[] = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
  "llama3-70b-8192",
  "llama3-8b-8192",
];

const MISTRAL: readonly string[] = [
  "mistral-large-latest",
  "mistral-small-latest",
  "mistral-medium-latest",
  "open-mistral-7b",
  "open-mixtral-8x7b",
];

/** OpenRouter: yaygın yönlendirilmiş modeller (tam liste API’de; burada arama ile seçim) */
const OPENROUTER: readonly string[] = [
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "openai/gpt-4-turbo",
  "openai/o1",
  "openai/o1-mini",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-3-opus",
  "google/gemini-2.0-flash-001",
  "google/gemini-pro-1.5",
  "meta-llama/llama-3.3-70b-instruct",
  "meta-llama/llama-3.1-70b-instruct",
  "mistralai/mistral-large",
  "mistralai/mixtral-8x7b-instruct",
  "deepseek/deepseek-chat",
  "deepseek/deepseek-r1",
  "x-ai/grok-2",
  "x-ai/grok-2-mini",
  "cohere/command-r-plus",
  "perplexity/llama-3.1-sonar-large-128k-online",
  "perplexity/llama-3.1-sonar-small-128k-online",
  "qwen/qwen-2.5-72b-instruct",
  "qwen/qwen-2.5-coder-32b-instruct",
  "nvidia/llama-3.1-nemotron-70b-instruct",
  "microsoft/wizardlm-2-8x22b",
  "nousresearch/hermes-3-llama-3.1-70b",
  "openchat/openchat-7b",
  "undi95/toppy-m-7b",
  "gryphe/mythomax-l2-13b",
];

const TOGETHER: readonly string[] = [
  "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  "meta-llama/Llama-3.2-3B-Instruct-Turbo",
  "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
  "mistralai/Mixtral-8x7B-Instruct-v0.1",
  "Qwen/Qwen2.5-72B-Instruct-Turbo",
  "deepseek-ai/DeepSeek-R1",
];

const XAI: readonly string[] = ["grok-2-latest", "grok-2-vision-latest", "grok-beta"];

const DEEPSEEK: readonly string[] = ["deepseek-chat", "deepseek-reasoner"];

const PERPLEXITY: readonly string[] = [
  "sonar",
  "sonar-pro",
  "sonar-reasoning",
  "sonar-reasoning-pro",
];

const LLAMA: readonly string[] = [
  "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  "meta-llama/Llama-3.2-3B-Instruct-Turbo",
  "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
];

const QWEN: readonly string[] = [
  "qwen-turbo",
  "qwen-plus",
  "qwen-max",
  "qwen2.5-72b-instruct",
  "qwen2.5-coder-32b-instruct",
];

const OLLAMA: readonly string[] = [
  "llama3.2",
  "llama3.1",
  "llama3",
  "mistral",
  "mixtral",
  "codellama",
  "phi3",
  "gemma2",
  "qwen2.5",
  "deepseek-r1",
  "nomic-embed-text",
];

export const MODELS_BY_PROVIDER: Record<ProviderId, readonly string[]> = {
  openai: OPENAI,
  anthropic: ANTHROPIC,
  ollama: OLLAMA,
  google: GOOGLE,
  groq: GROQ,
  mistral: MISTRAL,
  openrouter: OPENROUTER,
  together: TOGETHER,
  xai: XAI,
  deepseek: DEEPSEEK,
  perplexity: PERPLEXITY,
  llama: LLAMA,
  qwen: QWEN,
};

/** Varsayılan model (liste ilk elemanı veya bilinen iyi varsayılan) */
export const DEFAULT_MODEL_BY_PROVIDER: Record<ProviderId, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
  ollama: "llama3.2",
  google: "gemini-2.0-flash",
  groq: "llama-3.3-70b-versatile",
  mistral: "mistral-small-latest",
  openrouter: "openai/gpt-4o-mini",
  together: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  xai: "grok-2-latest",
  deepseek: "deepseek-chat",
  perplexity: "sonar",
  llama: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  qwen: "qwen-turbo",
};

export function getModelsForProvider(provider: ProviderId): readonly string[] {
  return MODELS_BY_PROVIDER[provider];
}

export function isSearchableProvider(provider: ProviderId): boolean {
  return SEARCHABLE_PROVIDERS.has(provider);
}
