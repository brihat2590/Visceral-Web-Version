export default function LeaguesPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-black px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-112px)] w-full max-w-5xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-neutral-950/80 px-6 py-16 text-center shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:px-10 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black_35%,transparent_100%)]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-[120px]" />

          <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-white/30">
                Coming Soon
              </p>
              <h1 className="text-5xl font-black tracking-tighter text-white sm:text-7xl">
                Leagues
              </h1>
            </div>

            <div className="h-px w-24 bg-white/10" />

            <p className="max-w-sm text-sm leading-6 text-white/45 sm:text-base">
              
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}