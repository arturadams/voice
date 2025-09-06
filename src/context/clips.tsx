import React, { createContext, useContext } from 'react';
import type { Clip } from '../models/clip';

export interface ClipsContextValue {
  clips: Clip[];
  playingId: string | null;
  online: boolean;
  addClip(clip: Clip): void;
  playClip(c: Clip): void | Promise<void>;
  stopPlayback(): void;
  uploadClip(c: Clip): Promise<void>;
  removeClip(id: string): Promise<void>;
  updateClip(id: string, patch: Partial<Clip>): void;
  syncQueued(): void | Promise<void>;
  refreshMetadata(): void | Promise<void>;
}

const ClipsContext = createContext<ClipsContextValue | undefined>(undefined);

export function ClipsProvider({ value, children }: React.PropsWithChildren<{ value: ClipsContextValue }>) {
  return <ClipsContext.Provider value={value}>{children}</ClipsContext.Provider>;
}

export function useClips(): ClipsContextValue {
  const ctx = useContext(ClipsContext);
  if (!ctx) throw new Error('useClips must be used within a ClipsProvider');
  return ctx;
}
