export type ClipStatus =
  | "idle"
  | "recording"
  | "saved"
  | "queued"
  | "processing"
  | "uploaded"
  | "error";

export function toClipStatus(serverStatus: unknown): ClipStatus {
  return serverStatus === "done" ? "uploaded" : "processing";
}

export type Clip = {
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
};
