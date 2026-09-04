"use client";

import { useEffect, useRef } from "react";
import { trackReadAction } from "@/app/actions/auth";
import type { ResourceKind } from "@/lib/types";

export function TrackRead({ kind, id }: { kind: ResourceKind; id: string }) {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void trackReadAction(kind, id);
  }, [kind, id]);
  return null;
}
