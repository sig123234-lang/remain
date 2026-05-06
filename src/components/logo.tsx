type LogoProps = {
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "text-lg tracking-[-0.03em]",
  md: "text-3xl tracking-[-0.05em]",
  lg: "text-5xl tracking-[-0.06em]",
};

export function Logo({ size = "md" }: LogoProps) {
  return (
    <div className={`inline-flex items-baseline font-black ${sizes[size]}`}>
      <span className="text-[var(--remain-primary)]">rem</span>
      <span className="text-[#378ADD]">AI</span>
      <span className="text-[var(--remain-primary)]">n</span>
    </div>
  );
}
