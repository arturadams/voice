import { Clip } from "../models/clip";

export interface StorageService {
  /** Save or update a clip */
  save(clip: Clip): Promise<void>;
  /** Retrieve all clips */
  getAll(): Promise<Clip[]>;
  /** Remove clip by id */
  remove(id: string): Promise<void>;
}

export type ApiConfig = {
  baseUrl: string;
  uploadPath: string;
  authToken?: string;
};

export interface UploadResult {
  serverId: string;
  title?: string;
  tags?: string[];
  details?: string;
  transcriptUrl?: string;
}

export interface UploadService {
  upload(clip: Clip, api: ApiConfig): Promise<UploadResult>;
}
