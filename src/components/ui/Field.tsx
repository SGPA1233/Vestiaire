import clsx from "clsx";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-green-600 focus:ring-2 focus:ring-brand-green-100",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-green-600 focus:ring-2 focus:ring-brand-green-100",
        props.className
      )}
    />
  );
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-brand-green-950/80">
      {children}
    </label>
  );
}

export function Checkbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      {...props}
      className={clsx(
        "h-5 w-5 rounded border-black/20 text-brand-green-700 focus:ring-brand-green-600",
        props.className
      )}
    />
  );
}
