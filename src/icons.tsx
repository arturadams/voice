import React from "react";

// Generic icon component
export const Icon = ({
  path,
  size = 20,
  className = "",
}: {
  path: string;
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={path} />
  </svg>
);

export const MicIcon = (p: any) => <Icon {...p} path="M12 1v11a3 3 0 0 1-6 0V5a3 3 0 0 1 6 0" />;
export const StopIcon = (p: any) => <Icon {...p} path="M5 5h14v14H5z" />;
export const PauseIcon = (p: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={p.size || 20}
    height={p.size || 20}
    className={p.className || ""}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="6" y1="4" x2="6" y2="20" />
    <line x1="18" y1="4" x2="18" y2="20" />
  </svg>
);
export const PlayIcon = (p: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={p.size || 20}
    height={p.size || 20}
    className={p.className || ""}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
export const UploadIcon = (p: any) => <Icon {...p} path="M12 16V3m0 0l-4 4m4-4l4 4M5 21h14" />;
export const TrashIcon = (p: any) => <Icon {...p} path="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />;
export const SettingsIcon = (p: any) => (
  <Icon {...p} path="M12 1l2 3 3 1 1 3 3 2-3 2-1 3-3 1-2 3-2-3-3-1-1-3-3-2 3-2 1-3 3-1z" />
);
export const SaveIcon = (p: any) => (
  <Icon {...p} path="M19 21H5a2 2 0 0 1-2-2V5h13l3 3v11a2 2 0 0 1-2 2z" />
);
export const TagIcon = (p: any) => <Icon {...p} path="M20 12l-8 8-9-9 4-4 9 9z" />;

export default Icon;
