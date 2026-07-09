# morse · blog

A demo blog application built on [`@arcadiasystems/morse-sdk`](https://www.npmjs.com/package/@arcadiasystems/morse-sdk) — decentralized publishing on Sui, with post bodies stored on [Walrus](https://www.walrus.xyz/) and premium content encrypted client-side via [Seal](https://seal.mystenlabs.com/).

Built to exercise the SDK end-to-end from a real browser app. Connect a Sui testnet wallet, spin up a publication, write public and premium (encrypted) posts, edit revisions with a draft → publish flow, manage a media library, invite co-authors via publisher caps — all on-chain, no backend.

> **Live demo: [morse-blog-demo.vercel.app](https://morse-blog-demo.vercel.app)** — click "Read the demo blog" for a seeded publication (no wallet needed to read).

## Seeding demo content

`seed/` contains curated posts and a one-command seeding script (used for the publication linked from the homepage, and to re-seed after Walrus testnet wipes):

```sh
npm install -g @arcadiasystems/morse-cli
export MORSE_PRIVATE_KEY=suiprivkey1...   # funded with testnet SUI + WAL
./seed/seed.sh                             # prints the new publication ID
```

Then set `NEXT_PUBLIC_DEMO_PUBLICATION_ID` to that ID and redeploy — the homepage "Read the demo blog" link appears automatically.

## What this demonstrates

| Feature | SDK surface | Status |
|---|---|---|
| Connect a Sui wallet (Slush, Suiet, any wallet-standard wallet) | `WalletStandardSigner.fromAccount` | ✅ |
| Create a publication + default `posts` collection | `createPublication` + `createCollection("posts", StorageMode.Blob)` | ✅ |
| List your publications | `reader.listPublicationsOwnedBy` | ✅ |
| Write a public post | `walrusWrite.uploadBlob` → `addEntry` | ✅ |
| Edit a public post (draft → publish) | `appendDraftRevision` → `publishFromDraft` | ✅ |
| Delete a post | `deleteEntry` | ✅ |
| Version history viewer + rollback (copy revision to editor) | `entry.revisions[]` with `publicHead` / `draftHead` markers + `walrusRead.readBlobRef` | ✅ |
| Media library (drag-drop upload, image grid) | lazy `createCollection("media", Blob)` + `addEntry` + `walrusRead` | ✅ |
| Picker for inserting media into a post | reads `media` collection, inserts `![alt](aggregator-url)` | ✅ |
| Picker for linking to other posts | reads collection entries, inserts `[title](public-url)` | ✅ |
| Multi-collection writer (`?collection=name`) | `addEntry({ collectionName, ... })` | ✅ |
| Write a premium (encrypted) post | `buildPublisherSealId` → `seal.encrypt` → `walrusWrite.uploadBlob` → `addEncryptedEntry` | ✅ |
| Append a new encrypted revision | `appendEncryptedDraftRevision` (reuses sealId) | ✅ |
| Decrypt a premium post as reader | `SessionKey.create` → `walrusRead.readBlobRef` → `seal.decrypt` | ✅ |
| Invite a co-author | `issuePublisherCap` | ✅ |
| Revoke a co-author | `revokePublisherCap` | ✅ |
| Transfer publication ownership | `transferOwnership` | ✅ |
| Public reader (server-rendered) | `RpcPublicationReader.scanEntries` + `walrusRead.readBlobRef` from Next App Router server components | ✅ |
| Error taxonomy → user-readable toasts | `mapSdkError` covering every SDK error class + abort reasons | ✅ |

### Note on premium / Seal mechanics

Premium entries are created with `addEncryptedEntry` and live as encrypted drafts. They have no public revision pointer — by contract design, `publishFromDraft` / `publishDirect` hardcode `encrypted = false` so an encrypted entry can never be promoted to public. To "publish" content publicly, write it as a non-Premium post instead. Editing a premium entry decrypts the existing body (one personal-message signature) and re-encrypts the new content under the same sealId, preserving access for prior cap holders.

## Architecture

- **Next.js 16 App Router** with `src/` directory and dark-mode-only Tailwind v4 + shadcn
- **Server components** render the public reader (`/[publicationId]` index + post pages) so first paint is fast and link previews include real titles
- **Client components** drive every authoring flow (wallet, write, edit) via `useMorse()` which assembles `{ adapter, signer, reader, walrusRead, walrusWrite, seal, config, client }`
- **HTTP Walrus adapters** (`HttpAggregatorReadAdapter` + `HttpPublisherWriteAdapter`) so the demo doesn't need WAL in your wallet — the publisher absorbs storage cost, every public-post write is 1 popup
- **Pinned Mysten substrate** matching morse-sdk's peer deps: `@mysten/sui@2.16.2`, `@mysten/walrus@1.1.6`, `@mysten/seal@1.1.3`

```
src/
├── app/                    # routes (App Router)
│   ├── [publicationId]/    # public reader (server-rendered)
│   ├── my-blogs/           # author flows (client)
│   └── providers.tsx       # WalletProvider + QueryClient + Sonner
├── components/
│   ├── blog/               # PublicationCard, EntryRow, MarkdownEditor, MediaPicker, ContentPicker, PremiumNotice, ...
│   ├── feedback/           # EmptyState, ErrorState, StatusIndicator, skeletons
│   ├── forms/              # Field, FormShell
│   ├── layout/             # Header, Footer, BalanceChips, MainnetBanner, WalletButton
│   └── ui/                 # shadcn primitives
├── hooks/                  # useMorse, useMyPublications, useWritePublicPost, useUploadMedia, ...
├── services/               # publications, errors (mapSdkError), public-blog.server, morse-reader.server
├── utils/                  # slug, address, format, entry-status
├── lib/                    # wallet-standard adapter, morse-config (collection names, faucet URLs)
└── styles/                 # globals.css (dark-only tokens, teal accent)
```

## Run locally

Requires [Bun](https://bun.sh) (the project uses bun for installs + dev).

```sh
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000), connect a wallet on Sui testnet, and create a publication.

You'll need a small amount of testnet SUI for gas. Drop your address into the [Sui testnet faucet](https://faucet.sui.io/). WAL is not required because the demo uses a Walrus HTTP publisher that absorbs storage cost.

## Deploy your own

This is a static-export-friendly Next App Router project — Vercel auto-detects it.

1. Fork this repo
2. Click "Import Project" on [vercel.com](https://vercel.com/new) and select the fork
3. Vercel detects Next, builds, deploys. No environment variables required (testnet config is hardcoded; swap the Walrus publisher in `src/lib/morse-config.ts` if you operate your own)

## Tech stack

- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript 5
- Tailwind v4 + shadcn/ui (dark-only)
- `@mysten/dapp-kit` 1.x for wallet integration
- `@uiw/react-md-editor` for the post writer (lazy-loaded)
- `react-markdown` + `remark-gfm` for the public reader
- TanStack Query for SDK reads and mutation orchestration

## License

MIT
