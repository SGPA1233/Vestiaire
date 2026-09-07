import clsx from "clsx";

export function ItemThumbnail({
  imageUrl,
  size = "md",
}: {
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-10 w-10 text-base",
    md: "h-14 w-14 text-xl",
    lg: "h-20 w-20 text-2xl",
  };

  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-cream-100",
        sizes[size]
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-brand-green-950/20">📦</span>
      )}
    </div>
  );
}
