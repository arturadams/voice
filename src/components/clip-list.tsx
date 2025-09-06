import { useEffect, useState } from "react";
import type { Clip } from "../models/clip";
import type { ClipReader } from "../services/types";

export function ClipList({ storage }: { storage: ClipReader }) {
  const [clips, setClips] = useState<Clip[]>([]);
  useEffect(() => {
    let active = true;
    (async () => {
      const all = await storage.getAll();
      if (active) setClips(all);
    })();
    return () => {
      active = false;
    };
  }, [storage]);

  return (
    <ul>
      {clips.map((c) => (
        <li key={c.id}>{c.title || c.id}</li>
      ))}
    </ul>
  );
}
