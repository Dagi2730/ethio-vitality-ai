/** Soft gradient orbs — sanctuary atmosphere behind content */
export function SanctuaryMesh() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-sanctuary-lavender/70 blur-3xl" />
      <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-sanctuary-peach/60 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sanctuary-mint/50 blur-3xl" />
      <div className="absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-sanctuary-sky/50 blur-3xl" />
      <div className="absolute inset-0 bg-warm-bg/40" />
    </div>
  );
}
