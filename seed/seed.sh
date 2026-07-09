#!/usr/bin/env bash
# Seed the Morse demo blog with curated content.
#
# Creates a publication + "posts" collection and publishes the posts in
# seed/posts/ (04 public + 1 Seal-encrypted premium), funded for EPOCHS
# of Walrus storage (~1 day per epoch on testnet).
#
# Requirements:
#   - morse CLI on PATH (npm install -g @arcadiasystems/morse-cli)
#   - MORSE_PRIVATE_KEY set to a Bech32 suiprivkey1... holding SUI + WAL
#     (fund via https://faucet.sui.io then swap at https://stake-wal.wal.app/?network=testnet)
#
# Re-run after a testnet reset to re-seed; it creates a fresh slug each time.
# On success it prints the publication ID — set NEXT_PUBLIC_DEMO_PUBLICATION_ID
# to it and redeploy so the homepage "Read the demo blog" link appears.

set -euo pipefail
cd "$(dirname "$0")"

: "${MORSE_PRIVATE_KEY:?Set MORSE_PRIVATE_KEY to a funded testnet suiprivkey1... key}"
EPOCHS="${EPOCHS:-50}"
SLUG="morse-demo-$(date +%s)"

command -v morse >/dev/null || { echo "morse CLI not found — npm install -g @arcadiasystems/morse-cli" >&2; exit 1; }

echo "── creating publication ($SLUG, epochs=$EPOCHS) ──"
morse publication create --name "The Morse Demo Blog" --slug "$SLUG"
morse collection create posts --mode blob

publish() { # publish <entry-name> <file>
  echo "── publishing: $1 ──"
  morse entry add "$1" --file "$2" --content-type text/markdown --epochs "$EPOCHS"
}

publish "Welcome — this blog has no backend"        posts/01-welcome.md
publish "Why your CMS should be a protocol"         posts/02-cms-as-protocol.md
publish "How revisions work: the dual-head model"   posts/03-revisions.md
publish "Publishing from an AI agent"               posts/04-agents.md

echo "── publishing premium (Seal-encrypted): The launch playbook ──"
morse entry add-encrypted "The launch playbook (premium)" --file posts/05-premium.md --content-type text/markdown --epochs "$EPOCHS"

echo
echo "── done ──"
morse status
echo
echo "Next: set NEXT_PUBLIC_DEMO_PUBLICATION_ID to the publication ID above,"
echo "redeploy the blog, and set a renewal reminder before $EPOCHS epochs elapse."
