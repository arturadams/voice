import React, { createContext, useContext } from 'react';
import type { ClipStore, UploadService } from '../services/types';

interface ServicesContextValue {
  storage: ClipStore;
  uploader: UploadService;
}

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

export function ServicesProvider({ storage, uploader, children }: React.PropsWithChildren<ServicesContextValue>) {
  return (
    <ServicesContext.Provider value={{ storage, uploader }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useStorage(): ClipStore {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useStorage must be used within a ServicesProvider');
  return ctx.storage;
}

export function useUploader(): UploadService {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useUploader must be used within a ServicesProvider');
  return ctx.uploader;
}
