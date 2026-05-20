import { Skeleton } from "@/components/ui/skeleton";

export function PublicationCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5 flex flex-col gap-3">
      <Skeleton className="size-9 rounded-lg" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-1/2" />
    </div>
  );
}

export function PublicationListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PublicationCardSkeleton key={i} />
      ))}
    </div>
  );
}
