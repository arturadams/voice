import { Clip } from "../models/clip";

export interface ClipWriter {
  /**
   * Save or update a clip.
   * @pre clip.id is a non-empty string.
   * @post the clip can be retrieved via `ClipReader.getAll()`.
   */
  save(clip: Clip): Promise<void>;
  /**
   * Remove a clip by its id.
   * @pre `id` is a non-empty string.
   * @post the clip is no longer returned by `ClipReader.getAll()`.
   */
  remove(id: string): Promise<void>;
}

export interface ClipReader {
  /**
   * Retrieve all persisted clips.
   * @post the returned array contains every clip previously saved.
   */
  getAll(): Promise<Clip[]>;
}

export type ClipStore = ClipReader & ClipWriter;

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
  /**
   * Upload a clip to the remote service.
   * @pre `clip.id` and `clip.blob` are defined and `api.baseUrl`/`uploadPath` are non-empty.
   * @post resolves with server metadata describing the uploaded clip.
   */
  upload(clip: Clip, api: ApiConfig): Promise<UploadResult>;
}
