"use client";

import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { PublicationListSkeleton } from "@/components/feedback/LoadingState";
import { PublicationCard } from "@/components/blog/PublicationCard";
import { WalletButton } from "@/components/layout/WalletButton";
import { useMyPublications } from "@/hooks/use-publications";

export default function MyBlogsPage() {
  const account = useCurrentAccount();
  const query = useMyPublications();

  return (
    <div className="flex flex-col gap-8 py-4 sm:py-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            My blogs
          </h1>
          <p className="text-sm text-muted-foreground">
            Publications owned by your connected wallet.
          </p>
        </div>
        {account && query.data && query.data.length > 0 ? (
          <Button asChild className="gap-2">
            <Link href="/my-blogs/new">
              <Plus className="size-4" />
              New blog
            </Link>
          </Button>
        ) : null}
      </header>

      {!account ? (
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="Connect a wallet to continue"
          description="Your blogs live on Sui. Connect a wallet on testnet to see what you own and start writing."
          action={<WalletButton size="lg" />}
        />
      ) : query.isPending ? (
        <PublicationListSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="Couldn't load your blogs"
          description={
            query.error instanceof Error
              ? query.error.message
              : "Unknown error while reading publications."
          }
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : query.data && query.data.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="No blogs yet"
          description="Spin up your first publication. It takes one wallet popup and lives entirely on-chain."
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
          {query.data!.map((item) => (
            <PublicationCard key={item.publicationId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
