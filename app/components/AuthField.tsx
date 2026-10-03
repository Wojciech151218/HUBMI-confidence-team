import type { Icon } from "@phosphor-icons/react";

type AuthFieldProps = {
  id: string;
  label: string;
  icon: Icon;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

export function AuthField({ id, label, icon: FieldIcon, ...inputProps }: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="liquid-glass-chip flex items-center gap-3 rounded-2xl px-4 transition-[border-color,box-shadow] duration-300 focus-within:border-accent/40 focus-within:shadow-[0_0_0_4px_var(--accent-soft)]">
        <FieldIcon aria-hidden size={20} weight="bold" className="shrink-0 text-accent" />
        <input
          id={id}
          {...inputProps}
          className="min-w-0 flex-1 bg-transparent py-3.5 font-secondary text-base text-foreground outline-none placeholder:text-muted"
        />
      </div>
    </div>
  );
}

export function AuthSubmit({ disabled, children }: { disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-2 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-white transition-[transform,background-color,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <p role="alert" className="font-secondary text-sm text-red-600">
      {message}
    </p>
  );
}
