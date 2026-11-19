import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import Link from "next/link";

// Shared UI following the Career Studio UI/UX Style Guide v1.0 (docs/STYLE_GUIDE.md).
// Primary actions are ink, never orange. Orange appears only in the brand mark,
// progress and small "signal" tags.

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white border border-ink hover:bg-grey-700 hover:border-grey-700 disabled:bg-ink/40 disabled:border-transparent",
  secondary: "bg-white text-ink border border-grey-200 hover:border-ink disabled:opacity-50",
  ghost: "text-grey-600 hover:text-ink hover:bg-grey-100 disabled:opacity-50",
  danger: "bg-bad text-white hover:bg-bad/90 disabled:opacity-50",
};

/** Every size keeps a 44px touch target; "lg" is the 52px hero button. */
export function buttonClass(variant: Variant = "primary", size: "sm" | "md" | "lg" = "md") {
  const sizes = { sm: "min-h-11 px-3 text-sm", md: "min-h-11 px-[18px] text-[15px]", lg: "min-h-13 px-6 text-base" };
  return `inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return <button {...props} className={`${buttonClass(variant, size)} ${className}`} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${buttonClass(variant, size)} ${className}`}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-hairline bg-white p-6 ${className}`}>{children}</div>;
}

const inputBase =
  "w-full rounded-[10px] border border-grey-200 bg-white px-3.5 text-[15px] text-ink placeholder:text-grey-400 focus:border-ink focus:outline-none focus:ring-4 focus:ring-grey-100 focus:[border-width:1.5px] disabled:bg-grey-50 disabled:text-grey-500";

export function Field({
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-medium text-grey-700">{label}</span>
      <input {...props} className={`${inputBase} h-11`} />
      {hint && <span className="mt-1 block text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-medium text-grey-700">{label}</span>
      <textarea {...props} className={`${inputBase} min-h-24 py-2.5 leading-relaxed`} />
      {hint && <span className="mt-1 block text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

/** Same look as inputs, for native selects. */
export const selectClass =
  "h-11 w-full rounded-[10px] border border-grey-200 bg-white px-3 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-4 focus:ring-grey-100";

// "signal" is the orange-wash tag (e.g. "Start here"); use at most one or two per screen.
type Tone = "neutral" | "info" | "signal" | "ok" | "warn" | "bad";
const tones: Record<Tone, string> = {
  neutral: "bg-grey-100 text-grey-700",
  info: "bg-grey-100 text-grey-700",
  signal: "bg-orange-wash text-orange-ink",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

const noticeTones: Record<Tone, string> = {
  neutral: "bg-grey-50 text-grey-700 border border-hairline",
  info: "bg-grey-50 text-grey-700 border border-hairline",
  signal: "bg-orange-wash text-ink border border-orange-wash",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
};

export function Notice({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  return <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${noticeTones[tone]}`}>{children}</div>;
}

/**
 * Signature brand mark: one Signal Orange segment then two grey segments
 * ("one question at a time"). This is the main place orange appears.
 */
export function BrandMark({ size = "logo" }: { size?: "logo" | "eyebrow" | "footer" }) {
  const dims = { logo: [16, 8, 5, 3], eyebrow: [14, 7, 4, 3], footer: [10, 5, 3, 2] }[size];
  const [long, short, h, gap] = dims;
  const seg = (w: number, color: string) => <span className="block rounded-full" style={{ width: w, height: h, background: color }} />;
  return (
    <span aria-hidden="true" className="inline-flex items-center" style={{ gap }}>
      {seg(long, "var(--color-orange)")}
      {seg(short, "var(--color-grey-300)")}
      {seg(short, "#e4e4e7")}
    </span>
  );
}

/** Section eyebrow: small brand mark + uppercase label in grey-600. */
export function Eyebrow({ children, mark = true }: { children: ReactNode; mark?: boolean }) {
  return (
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-grey-600">
      {mark && <BrandMark size="eyebrow" />}
      {children}
    </p>
  );
}

/**
 * Segmented progress: one 4px segment per step on a grey-100 track. Completed steps
 * are grey-400; only the current step is orange.
 */
export function StepProgress({ current, total, label = "Progress" }: { current: number; total: number; label?: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-valuetext={`Step ${current} of ${total}`} className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1 flex-1 rounded-full ${i + 1 === current ? "bg-orange" : i + 1 < current ? "bg-grey-400" : "bg-grey-100"}`} />
      ))}
    </div>
  );
}

/** A 4px meter (scores, coverage). Ink fill: orange is reserved for step progress. */
export function Meter({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-1 rounded-full bg-grey-100">
      <div className="h-1 rounded-full bg-ink" style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
    </div>
  );
}

/** Small check used beside selected options, so selection never relies on color alone. */
export function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}
