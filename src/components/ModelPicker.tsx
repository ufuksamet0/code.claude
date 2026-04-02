import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_MODEL_BY_PROVIDER,
  getModelsForProvider,
  isSearchableProvider,
} from "../lib/providerModels";
import type { ProviderId } from "../lib/types";

type Props = {
  provider: ProviderId;
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
};

export function ModelPicker({ provider, value, onChange, disabled }: Props) {
  const models = useMemo(() => [...getModelsForProvider(provider)], [provider]);
  const searchable = isSearchableProvider(provider);

  if (searchable) {
    return (
      <SearchableModelPicker
        models={models}
        defaultModel={DEFAULT_MODEL_BY_PROVIDER[provider]}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  const defaultModel = DEFAULT_MODEL_BY_PROVIDER[provider];
  const current = value.trim();
  const selectValue = current ? current : defaultModel;
  const showExtra = Boolean(current && !models.includes(current));

  return (
    <select
      className="mm-focus min-w-0 flex-1 rounded-[var(--mm-radius-sm)] border px-2 py-1.5 text-[12px] text-[var(--mm-chat-text)]"
      style={{
        borderColor: "var(--mm-chat-border)",
        background: "var(--mm-chat-input-bg)",
      }}
      value={selectValue}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {showExtra ? (
        <option value={current}>
          {current} (özel)
        </option>
      ) : null}
      {models.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}

function SearchableModelPicker({
  models,
  defaultModel,
  value,
  onChange,
  disabled,
}: {
  models: string[];
  defaultModel: string;
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const displayValue = value.trim() || defaultModel;

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.toLowerCase().includes(q));
  }, [models, filter]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFilter("");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) setFilter("");
  }, [open]);

  function pick(m: string) {
    onChange(m);
    setOpen(false);
    setFilter("");
  }

  function applyCustom() {
    const raw = filter.trim();
    if (!raw) return;
    onChange(raw);
    setOpen(false);
    setFilter("");
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        disabled={disabled}
        className="mm-focus flex w-full items-center justify-between gap-1 rounded-[var(--mm-radius-sm)] border px-2 py-1.5 text-left text-[12px] text-[var(--mm-chat-text)] disabled:opacity-50"
        style={{
          borderColor: "var(--mm-chat-border)",
          background: "var(--mm-chat-input-bg)",
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className="line-clamp-1 break-all font-mono text-[11px]">{displayValue}</span>
        <span className="shrink-0 text-[10px] text-[var(--mm-chat-muted)]" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 z-[100] mt-1 flex max-h-[min(280px,50vh)] flex-col overflow-hidden rounded-[var(--mm-radius-sm)] border shadow-lg"
          style={{
            borderColor: "var(--mm-chat-border)",
            background: "var(--mm-chat-assistant-bg, var(--mm-surface-solid))",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}
          role="listbox"
        >
          <div className="shrink-0 border-b p-1.5" style={{ borderColor: "var(--mm-chat-border)" }}>
            <input
              type="search"
              autoFocus
              className="mm-focus w-full rounded border-0 bg-[var(--mm-chat-input-bg)] px-2 py-1.5 font-mono text-[11px] text-[var(--mm-chat-text)] placeholder:text-[var(--mm-chat-muted)]"
              placeholder="Model ara…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered.length === 1) pick(filtered[0]);
                  else applyCustom();
                }
                if (e.key === "Escape") {
                  setOpen(false);
                  setFilter("");
                }
              }}
            />
            <p className="mt-1 px-1 text-[10px] text-[var(--mm-chat-muted)]">
              Listede yoksa arayıp Enter ile özel model ID kullanın.
            </p>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto py-1 text-[11px]">
            {filtered.length === 0 ? (
              <li className="px-2 py-2 text-[var(--mm-chat-muted)]">Eşleşme yok — Enter ile özel ID.</li>
            ) : (
              filtered.map((m) => (
                <li key={m}>
                  <button
                    type="button"
                    className="mm-focus w-full px-2 py-1.5 text-left font-mono text-[var(--mm-chat-text)] hover:bg-[var(--mm-chat-user-bg)]"
                    onClick={() => pick(m)}
                  >
                    {m}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
