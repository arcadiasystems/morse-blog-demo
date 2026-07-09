# Welcome — this blog has no backend

Everything you're reading right now is served without a CMS vendor, a database, or an admin server.

- The **publication** you're browsing is a shared object on **Sui testnet** — its identity, permissions, and revision history live in Move smart contracts.
- This **post's bytes** live on **Walrus**, a decentralized storage network. The chain stores a verifiable reference, not the content.
- The **premium post** in this list is encrypted client-side with **Seal** — the server you're not talking to couldn't read it either.

You can verify all of it. The publication ID is in your address bar; look it up on [Suiscan](https://suiscan.xyz/testnet/home) and you'll find every revision of every post, timestamped and signed.

This demo runs on [`@arcadiasystems/morse-sdk`](https://www.npmjs.com/package/@arcadiasystems/morse-sdk). Connect a wallet and you can create your own publication in about a minute — [docs here](https://docs.morsecms.xyz/quick-start-sdk.html).
