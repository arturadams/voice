export type ClipStatus = "idle" | "recording" | "saved" | "queued" | "processing" | "uploaded" | "error";

export interface Clip {
  id: string;
  createdAt: number;
  mimeType: string;
  size?: number;
  duration?: number;
  title?: string;
  tags?: string[];
  details?: string;
  serverId?: string;
  transcriptUrl?: string;
  status: ClipStatus;
  blob?: Blob;
  objectUrl?: string;
}

export interface ApiConfig {
  baseUrl: string;
  uploadPath: string;
  authToken?: string;
}

export interface StorageService {
  put(clip: Clip): Promise<void>;
  getAll(): Promise<Clip[]>;
  delete(id: string): Promise<void>;
}

export interface UploadStatus {
  status: string;
  id?: string;
  title?: string;
  tags?: string[];
  details?: string;
  transcriptUrl?: string;
}

export interface UploadService {
  upload(clip: Clip, api: ApiConfig): Promise<string>;
  status(serverId: string, api: ApiConfig): Promise<UploadStatus | null>;
}
