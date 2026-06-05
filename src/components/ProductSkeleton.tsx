export function ProductSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/5 shadow-sm animate-pulse">
      <div className="aspect-[4/5] w-full bg-[#111]"></div>
      <div className="p-3 md:p-5 space-y-3">
        <div className="h-5 w-3/4 rounded-md bg-white/10"></div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-1/3 rounded-md bg-white/10"></div>
          <div className="h-10 w-10 rounded-full bg-white/10"></div>
        </div>
      </div>
    </div>
  );
}
