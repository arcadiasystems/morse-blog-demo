"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/feedback/EmptyState";
import { StatusIndicator } from "@/components/feedback/StatusIndicator";
import { Field } from "@/components/forms/Field";
import { FormShell } from "@/components/forms/FormShell";
import { WalletButton } from "@/components/layout/WalletButton";
import { useCreatePublication } from "@/hooks/use-create-publication";
import { mapSdkError } from "@/services/errors";
import { slugify, validateSlug, slugErrorMessage } from "@/utils/slug";

export default function NewBlogPage() {
  const account = useCurrentAccount();
  const router = useRouter();
  const create = useCreatePublication();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugServerError, setSlugServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  const slugLocalError = useMemo(() => {
    if (slug.length === 0) return null;
    const err = validateSlug(slug);
    return err ? slugErrorMessage(err) : null;
  }, [slug]);

  const nameError = name.trim().length === 0 ? null : null;
  const canSubmit =
    name.trim().length > 0 &&
    slug.length > 0 &&
    !slugLocalError &&
    !create.isPending;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSlugServerError(null);
    if (!canSubmit) return;

    create.mutate(
      { name: name.trim(), slug },
      {
        onSuccess: (result) => {
          if (result.defaultCollectionError) {
            const mapped = mapSdkError(result.defaultCollectionError);
            toast.warning("Blog created · default collection missing", {
              description: `${mapped.title}: ${mapped.body} You can add a "posts" collection later from admin -> Settings.`,
            });
          } else {
            toast.success(`Blog created`, {
              description: `${name.trim()} is live at /${slug}`,
            });
          }
          router.push(`/my-blogs/${result.publicationId}`);
        },
        onError: (err) => {
          const mapped = mapSdkError(err);
          if (mapped.field === "slug") {
            setSlugServerError(mapped.body);
            return;
          }
          if (mapped.field === "name") {
            toast.error(mapped.title, { description: mapped.body });
            return;
          }
          toast.error(mapped.title, { description: mapped.body });
        },
      },
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-2xl">
        <BackLink />
        <EmptyState
          icon={<BookPlus className="size-5" />}
          title="Connect a wallet to create a blog"
          description="Creating a blog writes a new owner cap and publisher cap to your wallet. One on-chain confirmation."
          action={<WalletButton size="lg" />}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-2xl">
      <BackLink />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight">New blog</h1>
        <p className="text-sm text-muted-foreground">
          A blog is the top-level container for your posts and media. Both the
          name and the slug are permanent once created.
        </p>
      </div>
      <FormShell
        title="Blog details"
        description="One wallet popup creates the on-chain blog, plus an owner cap and a publisher cap, and transfers them to you."
        onSubmit={onSubmit}
        footer={
          <>
            <div className="flex items-center gap-2 min-h-7">
              {create.isPending ? (
                <div className="flex items-center gap-2">
                  <StatusIndicator phase="confirming-sui" />
                  <span className="text-[11px] text-muted-foreground">
                    {create.phase === "collection"
                      ? "Step 2 of 2: default collection"
                      : "Step 1 of 2: blog"}
                  </span>
                </div>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="gap-2 min-w-40"
            >
              {create.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <BookPlus className="size-4" />
                  Create blog
                </>
              )}
            </Button>
          </>
        }
      >
        <Field
          id="name"
          label="Name"
          required
          help="Shows in the header and your public blog index. Permanent once created - the SDK has no rename op."
          error={nameError}
        >
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My morse blog"
            maxLength={200}
            autoFocus
          />
        </Field>
        <Field
          id="slug"
          label="Slug"
          required
          help={
            <>
              Lowercase letters, numbers, and hyphens. Must be unique across all
              active morse publications. Public URL:{" "}
              <code className="font-mono text-foreground/90">
                /{slug || "your-slug"}
              </code>
            </>
          }
          error={slugServerError ?? slugLocalError}
        >
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
              if (slugServerError) setSlugServerError(null);
            }}
            placeholder="my-morse-blog"
            maxLength={64}
            className="font-mono"
          />
        </Field>
      </FormShell>
    </div>
  );
}

function BackLink() {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="self-start gap-1.5 -ml-2"
    >
      <Link href="/my-blogs">
        <ArrowLeft className="size-4" />
        Back to my blogs
      </Link>
    </Button>
  );
}
