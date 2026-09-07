import clsx from "clsx";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(20,39,32,0.06),0_8px_20px_-12px_rgba(20,39,32,0.15)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
