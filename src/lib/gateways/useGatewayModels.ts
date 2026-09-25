"use client";

import { useEffect, useState } from "react";
import { fetchModelsForGateway } from "./modelsClient";
import type { GatewayConfig } from "./types";
import type { ModelInfo } from "./adapters/models";

export interface GatewayModelRow extends ModelInfo {
  gatewayId: string;
  gatewayName: string;
  protocol: string;
}

export interface FailedGateway {
  gatewayId: string;
  gatewayName: string;
  protocol: string;
  error: string;
}

export interface UseGatewayModelsResult {
  gateways: GatewayConfig[];
  rows: GatewayModelRow[];
  failed: FailedGateway[];
  loading: boolean;
  reload: () => void;
}

/** Fetches every configured gateway's model list in parallel and flattens into one (gateway, model) row set. */
export function useGatewayModels(): UseGatewayModelsResult {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [rows, setRows] = useState<GatewayModelRow[]>([]);
  const [failed, setFailed] = useState<FailedGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/gateways");
      const gws = (await res.json()) as GatewayConfig[];
      if (cancelled) return;
      setGateways(gws);

      const results = await Promise.allSettled(
        gws.map((gw) => fetchModelsForGateway(gw.id, reloadToken > 0).then((models) => ({ gw, models }))),
      );
      if (cancelled) return;

      const nextRows: GatewayModelRow[] = [];
      const nextFailed: FailedGateway[] = [];
      results.forEach((r, i) => {
        const gw = gws[i];
        if (r.status === "fulfilled") {
          r.value.models.forEach((m) =>
            nextRows.push({ ...m, gatewayId: gw.id, gatewayName: gw.name, protocol: gw.protocol }),
          );
        } else {
          nextFailed.push({
            gatewayId: gw.id,
            gatewayName: gw.name,
            protocol: gw.protocol,
            error: r.reason instanceof Error ? r.reason.message : String(r.reason),
          });
        }
      });
      setRows(nextRows);
      setFailed(nextFailed);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { gateways, rows, failed, loading, reload: () => setReloadToken((t) => t + 1) };
}
