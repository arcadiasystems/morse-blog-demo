A CMS without drafts is a typewriter. Here's how Morse does editorial workflow on-chain.

Every entry keeps an **append-only vector of revisions** — nothing is ever mutated in place. Two pointers index into it:

```
revisions: [rev0, rev1(draft), rev2(draft), rev3(public), rev4(draft)]
                                             ↑ public_head    ↑ draft_head
```

- **`public_head`** is what readers see. Stable, boring, exactly what you want production to be.
- **`draft_head`** is where work happens. Append as many drafts as you like; readers never see them.

Publishing is just moving a pointer — `publish_from_draft` promotes your draft to public in one transaction. Rolling back? Point at an older revision. The history stays intact either way, because the history *is* the data structure.

On this very blog, the version-history panel on each post is reading that vector straight from the chain. Try editing a post on your own publication and watch the revisions stack up.

Details: [Entries & Revisions](https://docs.morsecms.xyz/entries.html).
