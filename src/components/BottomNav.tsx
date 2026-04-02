import { NavLink } from "react-router-dom";

const items = [
  { to: "/code", label: "Kod", short: "Code" },
  { to: "/video", label: "Video", short: "Video" },
  { to: "/photo", label: "Foto", short: "Foto" },
  { to: "/agents", label: "Ajanlar", short: "Bot" },
  { to: "/pc", label: "PC", short: "PC" },
  { to: "/test", label: "Test", short: "Test" },
] as const;

export function BottomNav() {
  return (
    <nav
      className="mm-glass flex shrink-0 items-center justify-between gap-1 border-t px-3 py-2"
      style={{ borderColor: "var(--mm-border)" }}
      aria-label="AI modları"
    >
      <div className="flex flex-1 flex-wrap items-center justify-center gap-1 sm:gap-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "mm-focus mm-pill min-h-[40px] min-w-[52px] px-3 py-2 text-center text-[13px] font-medium transition-colors sm:min-w-[72px]",
                isActive
                  ? "bg-[var(--mm-accent-soft)] text-[var(--mm-accent)]"
                  : "text-[var(--mm-muted)] hover:text-[var(--mm-text)]",
              ].join(" ")
            }
            end
          >
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.short}</span>
          </NavLink>
        ))}
      </div>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          [
            "mm-focus mm-pill shrink-0 px-3 py-2 text-[13px] font-medium",
            isActive
              ? "bg-[var(--mm-accent-soft)] text-[var(--mm-accent)]"
              : "text-[var(--mm-muted)] hover:text-[var(--mm-text)]",
          ].join(" ")
        }
      >
        Ayarlar
      </NavLink>
    </nav>
  );
}
