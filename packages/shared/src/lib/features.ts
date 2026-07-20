export interface Feature {
  key: string;
  title: string;
  description: string;
}

export const FEATURES: Feature[] = [
  {
    key: "wallet-native",
    title: "Wallet-native",
    description:
      "Slush, Suiet, or any Sui Wallet Standard wallet. Your keys, your blog, no backend.",
  },
  {
    key: "walrus-stored",
    title: "Walrus-stored",
    description:
      "Post content lives on Walrus. Append-only revisions, version history out of the box.",
  },
  {
    key: "seal-encrypted",
    title: "Seal-encrypted",
    description:
      "Encrypt posts client-side. Readers decrypt with one signed message. No server in the middle.",
  },
];
