"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { avatarColor, initials } from "@/lib/format";
import { Icon } from "./icon";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export { cx };

// ---------- buttons ----------

type BtnVariant = "primary" | "accent" | "outline" | "ghost" | "danger" | "success" | "light";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-600 shadow-sm",
  accent: "bg-accent text-ink hover:brightness-95 shadow-sm",
  success: "bg-success text-white hover:brightness-95 shadow-sm",
  danger: "bg-danger text-white hover:brightness-95 shadow-sm",
  outline: "border border-line bg-white text-ink hover:border-brand hover:text-brand",
  ghost: "text-ink hover:bg-brand-50",
  light: "bg-brand-50 text-brand hover:bg-brand/15",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md"; loading?: boolean; icon?: string }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        BTN[variant],
        className,
      )}
    >
      {loading ? <Spinner size={14} /> : icon ? <Icon name={icon} size={size === "sm" ? 14 : 16} /> : null}
      {children}
    </button>
  );
}

export function IconBtn({ icon, title, onClick, tone = "default", href }: { icon: string; title: string; onClick?: () => void; tone?: "default" | "danger" | "brand"; href?: string }) {
  const cls = cx(
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-[#f7f7fb] transition",
    tone === "danger" ? "text-danger hover:border-danger/40 hover:bg-danger/5" : tone === "brand" ? "text-brand hover:border-brand/40" : "text-ink hover:border-brand/40 hover:text-brand",
  );
  if (href)
    return (
      <a href={href} title={title} className={cls}>
        <Icon name={icon} size={15} />
      </a>
    );
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} className={cls}>
      <Icon name={icon} size={15} />
    </button>
  );
}

// ---------- layout ----------

export function Card({ children, className, title, actions, bodyClass }: { children: React.ReactNode; className?: string; title?: React.ReactNode; actions?: React.ReactNode; bodyClass?: string }) {
  return (
    <section className={cx("rounded-2xl bg-card shadow-[0_1px_2px_rgba(15,14,71,0.04)] ring-1 ring-line/70", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          {typeof title === "string" ? <h2 className="text-lg font-semibold text-ink">{title}</h2> : title}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx("p-5", bodyClass)}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        {back && (
          <a href={back.href} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600">
            <Icon name="chevronLeft" size={14} /> {back.label}
          </a>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---------- form controls ----------

/**
 * A <label> forwards clicks on its caption/blank space to its first control. That is right for text inputs and
 * selects, but for composite controls (lists with "Add" buttons, checkbox trees, radio groups, file pickers)
 * it would add rows / toggle the first checkbox, so activation is suppressed there.
 */
function guardLabelClick(e: React.MouseEvent<HTMLLabelElement>) {
  const target = e.target as HTMLElement;
  // Rich-text editors: activation would steal focus to the toolbar's first control.
  if (target.closest("[contenteditable]")) return e.preventDefault();
  const hit = target.closest("input,select,textarea,button,a,label");
  if (hit && hit !== e.currentTarget) return;
  const controls = e.currentTarget.querySelectorAll("input:not([type=hidden]),select,textarea,button");
  const c = controls[0];
  const textLike = controls.length === 1 && (c.matches("select,textarea") || (c instanceof HTMLInputElement && !["checkbox", "radio", "file", "button", "submit"].includes(c.type)));
  if (c && !textLike) e.preventDefault();
}

export function Field({ label, error, required, hint, children, className }: { label?: string; error?: string; required?: boolean; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)} onClick={guardLabelClick}>
      {label && (
        <span className="label">
          {label} {required && <span className="text-danger">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx("input", p.className)} />;
export const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={4} {...p} className={cx("input", p.className)} />;
export function Select({ options, placeholder, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string | number; label: string }[]; placeholder?: string }) {
  return (
    <select {...p} className={cx("input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23505081%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8", p.className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Switch. When `onChange` returns a promise (save + reload) the new state shows immediately and further
 * clicks are ignored until it settles, so a quick second click can't resend the same value.
 */
export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => unknown; label?: string; disabled?: boolean }) {
  const [pending, setPending] = useState<boolean | null>(null);
  const on = pending ?? checked;
  const click = () => {
    if (pending !== null) return;
    const next = !on;
    const r = onChange(next);
    if (r instanceof Promise) {
      setPending(next);
      void r.catch(() => undefined).finally(() => setPending(null));
    }
  };
  return (
    <label className={cx("inline-flex select-none items-center gap-2", disabled ? "opacity-50" : "cursor-pointer")}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-busy={pending !== null}
        disabled={disabled}
        onClick={click}
        className={cx("relative h-5 w-9 rounded-full transition", on ? "bg-brand" : "bg-[#d5d5e3]")}
      >
        <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition", on ? "left-[18px]" : "left-0.5")} />
      </button>
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
}

export function FileInput({ accept = "image/*", multiple, onChange, preview, hint }: { accept?: string; multiple?: boolean; onChange: (files: File[]) => void; preview?: string | string[] | null; hint?: string }) {
  const [names, setNames] = useState<string>("");
  const previews = (Array.isArray(preview) ? preview : preview ? [preview] : []).filter(Boolean);
  return (
    <div>
      <label className="flex cursor-pointer overflow-hidden rounded-lg border border-line bg-white text-sm">
        <span className="border-r border-line bg-brand-50 px-3 py-2 font-medium text-brand">Choose File</span>
        <span className="truncate px-3 py-2 text-muted">{names || "No file chosen"}</span>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            setNames(files.map((f) => f.name).join(", "));
            onChange(files);
          }}
        />
      </label>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {previews.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {previews.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="h-16 w-16 rounded-lg border border-line object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- display ----------

const BADGE: Record<string, string> = {
  brand: "bg-brand text-white",
  accent: "bg-accent text-ink",
  success: "bg-success text-white",
  danger: "bg-danger text-white",
  warning: "bg-warning text-white",
  info: "bg-info text-white",
  muted: "bg-[#e9e9f2] text-secondary",
  soft: "bg-brand-50 text-brand",
};

export function Badge({ tone = "soft", children }: { tone?: keyof typeof BADGE; children: React.ReactNode }) {
  return <span className={cx("inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold", BADGE[tone])}>{children}</span>;
}

const STATUS_TONE: Record<string, keyof typeof BADGE> = {
  approved: "success",
  active: "success",
  completed: "success",
  succeed: "success",
  published: "success",
  open: "info",
  resolved: "success",
  hired: "success",
  pending: "warning",
  under_review: "info",
  reviewing: "info",
  draft: "muted",
  submitted: "info",
  shortlisted: "info",
  rejected: "danger",
  failed: "danger",
  banned: "danger",
  suspended: "warning",
  expired: "danger",
  cancelled: "muted",
  dismissed: "muted",
  refunded: "muted",
  sold: "brand",
  inactive: "muted",
  closed: "muted",
  discontinued: "danger",
};
const STATUS_LABEL: Record<string, string> = { pending: "Under Review", approved: "Approved" };

export function StatusBadge({ status, label }: { status?: string | null; label?: string }) {
  const s = (status ?? "unknown").toLowerCase();
  return <Badge tone={STATUS_TONE[s] ?? "muted"}>{label ?? STATUS_LABEL[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</Badge>;
}

export function Avatar({ name, src, size = 36 }: { name?: string | null; src?: string | null; size?: number }) {
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? ""} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: avatarColor(name ?? ""), fontSize: size * 0.45 }}>
      {initials(name)}
    </span>
  );
}

export function UserCell({ user }: { user?: { name?: string | null; avatar_path?: string | null } | null }) {
  if (!user) return <span className="text-muted">-</span>;
  return (
    <span className="flex items-center gap-2">
      <Avatar name={user.name} src={user.avatar_path} size={32} />
      <span className="leading-tight">{user.name}</span>
    </span>
  );
}

export function Thumb({ src, size = 40 }: { src?: string | null; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="rounded-lg border border-line object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="inline-flex items-center justify-center rounded-lg bg-brand-50 text-brand" style={{ width: size, height: size }}>
      <Icon name="image" size={size * 0.45} />
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex text-accent">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={15} height={15} viewBox="0 0 24 24" fill={i <= value ? "currentColor" : "#d5d5e3"}>
          <path d="M12 17.75l-6.17 3.24 1.18-6.87-5-4.86 6.9-1L12 2l3.09 6.26 6.9 1-5 4.86 1.18 6.87z" />
        </svg>
      ))}
    </span>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return <span className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent" style={{ width: size, height: size }} />;
}

export function Empty({ text = "No matching records found", icon = "inbox" }: { text?: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted">
      <Icon name={icon} size={36} />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, variant = "pill" }: { tabs: { value: T; label: string; tone?: string }[]; value: T; onChange: (v: T) => void; variant?: "pill" | "underline" }) {
  if (variant === "underline")
    return (
      <div className="flex flex-wrap gap-1 border-b border-line">
        {tabs.map((t) => (
          <button key={t.value} type="button" onClick={() => onChange(t.value)} className={cx("-mb-px border-b-2 px-4 py-2 text-sm font-medium transition", value === t.value ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink")}>
            {t.label}
          </button>
        ))}
      </div>
    );
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cx("rounded-lg border px-3.5 py-2 text-sm font-medium transition", value === t.value ? "border-brand bg-brand text-white" : `bg-white hover:bg-brand-50 ${t.tone ?? "border-brand/40 text-brand"}`)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---------- modal / confirm ----------

export function Modal({ open, onClose, title, children, footer, size = "md" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 p-4 pt-16" onMouseDown={onClose}>
      <div className={cx("w-full rounded-2xl bg-white shadow-2xl", w)} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmOpts {
  title?: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  input?: { label: string; required?: boolean };
}
interface ToastItem {
  id: number;
  text: string;
  tone: "success" | "error" | "info";
}
interface UiCtx {
  toast: (text: string, tone?: ToastItem["tone"]) => void;
  confirm: (o: ConfirmOpts) => Promise<string | false>;
}
const Ui = createContext<UiCtx | null>(null);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOpts & { resolve: (v: string | false) => void }) | null>(null);
  const [text, setText] = useState("");

  const toast = useCallback((t: string, tone: ToastItem["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((x) => [...x, { id, text: t, tone }]);
    setTimeout(() => setToasts((x) => x.filter((i) => i.id !== id)), 3500);
  }, []);
  const confirm = useCallback(
    (o: ConfirmOpts) =>
      new Promise<string | false>((resolve) => {
        setText("");
        setDialog({ ...o, resolve });
      }),
    [],
  );
  const close = (v: string | false) => {
    dialog?.resolve(v);
    setDialog(null);
  };

  return (
    <Ui.Provider value={{ toast, confirm }}>
      {children}
      <div className="fixed right-4 top-4 z-[60] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={cx("flex items-start gap-2 rounded-xl px-4 py-3 text-sm text-white shadow-lg", t.tone === "success" ? "bg-success" : t.tone === "error" ? "bg-danger" : "bg-brand")}>
            <Icon name={t.tone === "error" ? "info" : "check"} size={18} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
      <Modal
        open={!!dialog}
        onClose={() => close(false)}
        title={dialog?.title ?? "Are you sure?"}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button variant={dialog?.tone === "primary" ? "primary" : "danger"} disabled={!!dialog?.input?.required && !text.trim()} onClick={() => close(text || "yes")}>
              {dialog?.confirmLabel ?? "Yes, delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">{dialog?.message}</p>
        {dialog?.input && (
          <Field label={dialog.input.label} className="mt-4" required={dialog.input.required}>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} autoFocus />
          </Field>
        )}
      </Modal>
    </Ui.Provider>
  );
}

export function useUi() {
  const c = useContext(Ui);
  if (!c) throw new Error("useUi outside UiProvider");
  return c;
}
