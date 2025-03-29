export const DRIVE_VERSION = 'v3';
export const DRIVE_KEY_PATH = './drive.config.json'; // from root

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

export const FOLDER_MIMETYPE = 'application/vnd.google-apps.folder';
export const FOLDER_SAVE_FILE = 'drive_file';
export const FOLDER_FILES_SAVE_TIME_MODIFIED = 'files_save_modified_time';

export const FOLDER_DRIVE_REGEX = /^https:\/\/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9-_]+)/;
