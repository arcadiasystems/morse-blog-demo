# Why your CMS should be a protocol

Every headless CMS makes the same trade: great ergonomics now, a landlord forever.

Your content model, your edit history, your team's permissions — all of it lives inside a vendor's database. Migrating means rebuilding. Pricing changes are weather. And the audit trail is whatever the vendor says it is.

**Morse inverts the deal.** The backend is an open protocol:

1. **Identity on-chain** — your publication is a Sui object with a globally unique slug. Nobody can take it, rename it, or lock you out of it.
2. **Permissions as capabilities** — write access is an object (`PublisherCap`) you hold, transfer, or revoke. Not a row in someone's `users` table.
3. **History that can't be rewritten** — every edit appends an immutable revision. The draft you published at 3am is provably the draft you published at 3am.
4. **Storage you fund directly** — payloads live on Walrus for the epochs you pay for, renewable anytime. No hostage data.

Services can still exist — indexers, APIs, pretty admin UIs. But they compete on ergonomics, not on custody. The contracts are the only source of truth.

Read the full model in the [Core Concepts](https://docs.morsecms.xyz/core-concepts.html).
