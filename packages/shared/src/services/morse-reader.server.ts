import "server-only";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import {
  HttpAggregatorReadAdapter,
  RpcPublicationReader,
} from "@arcadiasystems/morse-sdk";
import { morseAppConfig } from "../lib/morse-config";

/**
 * Builds a fresh reader + walrus + gRPC client per call. We do not cache
 * at module scope because a cached client can hold stale RPC responses
 * across requests (e.g. a publication scanned before its first entry was
 * indexed). Demos prefer freshness over a tiny construction overhead.
 */
export function getServerMorseReader() {
  const config = morseAppConfig;
  const client = new SuiGrpcClient({
    network: "testnet",
    baseUrl: config.rpcUrl,
  });
  const reader = RpcPublicationReader.fromMorseConfig(config, client);
  const walrusRead = HttpAggregatorReadAdapter.fromMorseConfig(config, client);
  return { reader, walrusRead, client, config };
}
