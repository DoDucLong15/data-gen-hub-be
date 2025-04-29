export type TOnedriveDataConnectorConfig = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type TOnedriveItem = {
  createdDateTime: string;
  id: string;
  lastModifiedDateTime: string;
  name: string;
  webUrl: string;
  size: number;
  createdBy: {
    user: {
      email: string;
      id: string;
      displayName: string;
    };
  };
  lastModifiedBy: {
    user: {
      email: string;
      id: string;
      displayName: string;
    };
  };
  parentReference: {
    driveType: string;
    driveId: string;
    id: string;
    name: string;
    path: string;
    siteId: string;
  };
  folder?: {
    childCount: number;
    view: {
      sortBy: string;
      sortOrder: string;
      viewType: string;
    };
  };
  specialFolder?: {
    name: string;
  };
  '@microsoft.graph.downloadUrl'?: string;
  file?: {
    mimeType: string;
  };
  fileSystemInfo: {
    createdDateTime: string;
    lastModifiedDateTime: string;
  };
};

export type TOnedrivePreviewItem = {
  '@odata.context': string;
  getUrl: string;
  postParameters?: string;
  postUrl?: string;
};

export type TOnedriveChildren = TOnedriveItem & {
  children?: TOnedriveItem[];
};
