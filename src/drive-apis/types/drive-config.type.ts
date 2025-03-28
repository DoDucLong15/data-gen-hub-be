export type TDriveConnectorConfig = {
  private_key: string;
  client_email: string;
};

export type DriveItem = {
  id: string;
  mimeType: string;
  name: string;
  originalFilename?: string;
  owners: {
    displayName: string;
    emailAddress: string;
    photoLink: string;
  }[];
  hasThumbnail: boolean;
  thumbnailLink?: string;
  webViewLink?: string;
  createdTime: string;
  modifiedTime: string;
  size: string;
  imageMediaMetadata: {
    height?: number;
    rotation?: number;
    width?: number;
  } | null;
  videoMediaMetadata?: {
    durationMillis?: string;
    height?: number;
    width?: number;
  } | null;
  children?: DriveItem[];
  trashed?: boolean;
};
