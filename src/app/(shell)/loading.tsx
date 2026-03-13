export default function ShellLoading() {
  return (
    <div className="bg-stone-100 text-stone-700">
      <div className="h-0.5 w-full bg-stone-300">
        <div className="h-full w-1/3 animate-pulse bg-[#d96c3d]" />
      </div>
      <div className="mx-auto w-full max-w-6xl px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
        Loading route content
      </div>
    </div>
  );
}
