import { Logger } from '@nestjs/common';

export class OnedriveHelper {
  static parseContentDisposition(contentDisposition: string): string {
    if (!contentDisposition) {
      return `unknown-${Date.now()}`;
    }

    try {
      // Chia thành các phần dựa trên dấu chấm phẩy và loại bỏ phần 'attachment' hoặc 'inline'
      const parts = contentDisposition
        .split(';')
        .map((part) => part.trim())
        .filter(
          (part) =>
            !part.toLowerCase().startsWith('attachment') &&
            !part.toLowerCase().startsWith('inline'),
        );

      // Xử lý filename*=UTF-8''... format (ưu tiên) theo RFC 6266
      const utf8Part = parts.find((part) => part.toLowerCase().startsWith('filename*='));
      if (utf8Part) {
        const utf8Match = /filename\*=([^']*'')?([^;]*)/.exec(utf8Part);
        if (utf8Match && utf8Match[2]) {
          return decodeURIComponent(utf8Match[2]);
        }
      }

      // Xử lý filename="..." hoặc filename=... format
      const filenamePart = parts.find(
        (part) =>
          part.toLowerCase().startsWith('filename=') &&
          !part.toLowerCase().startsWith('filename*='),
      );
      if (filenamePart) {
        // Xử lý filename="example.txt" hoặc filename=example.txt
        const filenameMatch = /filename=["']?([^"';]+)["']?/.exec(filenamePart);
        if (filenameMatch && filenameMatch[1]) {
          return filenameMatch[1].trim();
        }
      }

      // Nếu không tìm thấy filename pattern
      return `unknown-${Date.now()}`;
    } catch (error) {
      Logger.error(
        `Failed to parse Content-Disposition: ${error.message}`,
        'OnedriveHelper.parseContentDisposition',
      );
      return `unknown-${Date.now()}`;
    }
  }

  static sanitizeFileNameForOneDriveUrl(fileName: string): string {
    // Danh sách các ký tự không được phép trong URL OneDrive
    const forbiddenChars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|', '#', '%'];

    // Thay thế các ký tự không được phép
    let sanitizedName = fileName;
    forbiddenChars.forEach((char) => {
      sanitizedName = sanitizedName.split(char).join('_');
    });

    // Lấy extension
    const lastDotIndex = sanitizedName.lastIndexOf('.');
    const fileExtension = lastDotIndex !== -1 ? sanitizedName.slice(lastDotIndex) : '';
    const fileNameWithoutExt =
      lastDotIndex !== -1 ? sanitizedName.slice(0, lastDotIndex) : sanitizedName;

    // Giới hạn độ dài tên file (không bao gồm extension)
    // URL OneDrive có giới hạn, nên chúng ta cắt ngắn tên file
    const maxFileNameLength = 50; // Giới hạn độ dài hợp lý
    let shortenedName = fileNameWithoutExt;

    if (fileNameWithoutExt.length > maxFileNameLength) {
      shortenedName = fileNameWithoutExt.substring(0, maxFileNameLength);
      Logger.debug(
        `File name too long, shortened from ${fileNameWithoutExt.length} to ${maxFileNameLength} chars`,
        'OnedriveHelper',
      );
    }

    // Kết hợp tên file đã cắt với extension
    const finalName = shortenedName + fileExtension;

    // Mã hóa tên file đã được làm sạch
    return encodeURIComponent(finalName);
  }
}
