export type TClassDriveItem = {
  driveId: string;
  folderInputId: string;
  folderOutputId: string;
};

export type TClassOneDriveItem = {
  driveId: string;
  itemId: string;
  folderInput: {
    driveId: string;
    itemId: string;
  };
  folderOutput: {
    driveId: string;
    itemId: string;
  };
};
