"use client";

import Link from "next/link";
import { BookOpen, Plus, Users } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { PublicationListSkeleton } from "../../components/feedback/LoadingState";
import { PublicationCard } from "../../components/blog/PublicationCard";
import { WalletButton } from "../../components/layout/WalletButton";
import {
  useCoauthoredPublications,
  useMyPublications,
} from "../../hooks/use-publications";

export default function MyBlogsPage() {
  const account = useCurrentAccount();
  const owned = useMyPublications();
  const shared = useCoauthoredPublications();

  if (!account) {
    return (
      <div className="flex flex-col gap-8 py-4 sm:py-8">
        <Header showNew={false} />
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="Connect a wallet to continue"
          description="Your blogs live on Sui. Connect a wallet on testnet to see what you own and start writing."
          action={<WalletButton size="lg" />}
        />
      </div>
    );
  }

  const hasOwned = (owned.data?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-10 py-4 sm:py-8">
      <Header showNew={hasOwned} />

      {/* Owned blogs */}
      {owned.isPending ? (
        <PublicationListSkeleton />
      ) : owned.isError ? (
        <ErrorState
          title="Couldn't load your blogs"
          description={
            owned.error instanceof Error
              ? owned.error.message
              : "Unknown error while reading publications."
          }
          action={
            <Button variant="outline" onClick={() => owned.refetch()}>
              Try again
            </Button>
          }
        />
      ) : !hasOwned ? (
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="No blogs yet"
          description="Spin up your first blog. It takes a wallet confirmation and lives entirely on-chain."
          action={
            <Button asChild className="gap-2">
              <Link href="/my-blogs/new">
                <Plus className="size-4" />
                Create your first blog
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {owned.data!.map((item) => (
            <PublicationCard key={item.publicationId} item={item} />
          ))}
        </div>
      )}

      {/* Shared with me (co-author via PublisherCap, no OwnerCap) */}
      {shared.data && shared.data.length > 0 ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              Shared with me
            </h2>
            <p className="text-sm text-muted-foreground">
              Blogs where you hold a publisher cap but not ownership. You can
              write posts; only the owner can manage members or delete the
              blog.
            </p>
          </div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shared.data.map((item) => (
              <PublicationCard
                key={item.publicationId}
                item={item}
                shared
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Header({ showNew }: { showNew: boolean }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          My blogs
        </h1>
        <p className="text-sm text-muted-foreground">
          Blogs your connected wallet owns or can write to.
        </p>
      </div>
      {showNew ? (
        <Button asChild className="gap-2">
          <Link href="/my-blogs/new">
            <Plus className="size-4" />
            New blog
          </Link>
        </Button>
      ) : null}
    </header>
  );
}
