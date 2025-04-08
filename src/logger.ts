import { Logger as NestLogger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Lưu trữ các phương thức gốc của Logger
const originalLogMethod = NestLogger.log;
const originalErrorMethod = NestLogger.error;
const originalWarnMethod = NestLogger.warn;
const originalDebugMethod = NestLogger.debug;
const originalVerboseMethod = NestLogger.verbose;

// Thư mục chứa log files
const logDir = path.join(process.cwd(), 'logs');

// Đảm bảo thư mục logs tồn tại
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Hàm lấy đường dẫn file log cho ngày hiện tại
function getLogFilePath() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  return path.join(logDir, `application-${dateStr}.log`);
}

// Hàm xóa các file log cũ hơn 30 ngày
function cleanupOldLogs() {
  try {
    const files = fs.readdirSync(logDir);
    const now = new Date();

    files.forEach((file) => {
      // Chỉ xử lý các file có định dạng application-YYYY-MM-DD.log
      if (!file.match(/^application-\d{4}-\d{2}-\d{2}\.log$/)) return;

      const filePath = path.join(logDir, file);
      const dateStr = file.match(/\d{4}-\d{2}-\d{2}/)?.[0];
      if (!dateStr) return;
      const fileDate = new Date(dateStr);

      // Tính số ngày giữa ngày hiện tại và ngày của file
      const diffTime = Math.abs(now.getTime() - fileDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Nếu file cũ hơn 30 ngày, xóa
      if (diffDays > 30) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old log file: ${file}`);
      }
    });
  } catch (err) {
    console.error('Error cleaning up old logs:', err);
  }
}

// Hàm ghi log vào file
function writeToFile(level: string, message: any, context?: string, trace?: string) {
  try {
    const logFilePath = getLogFilePath();
    const timestamp = new Date().toISOString();

    // Xử lý message để đảm bảo không phải undefined
    const formattedMessage = message !== undefined ? message : 'undefined';

    // Xử lý context để đảm bảo không phải undefined
    const contextMessage = context ? `[${context}] ` : '';

    let logMessage = `${timestamp} [${level}] ${contextMessage}${formattedMessage}`;

    if (trace) {
      logMessage += `\nStack Trace: ${trace}`;
    }

    fs.appendFileSync(logFilePath, logMessage + '\n');
  } catch (err) {
    console.error('Error writing to log file:', err);
  }
}

// Ghi đè phương thức log với xử lý cẩn thận hơn
NestLogger.log = function () {
  // Copy lại arguments để sử dụng
  const args = Array.from(arguments);

  // Gọi phương thức gốc với arguments gốc
  originalLogMethod.apply(NestLogger, args);

  // Phân tích arguments để lấy message và context
  let message, context;

  if (args.length === 1) {
    message = args[0];
    context = undefined;
  } else if (args.length >= 2) {
    message = args[0];
    // Context có thể ở vị trí thứ 2
    context = args[1];
  }

  // Ghi log ra file
  writeToFile('LOG', message, context);
};

// Ghi đè phương thức error với xử lý cẩn thận hơn
NestLogger.error = function () {
  // Copy lại arguments để sử dụng
  const args = Array.from(arguments);

  // Gọi phương thức gốc với arguments gốc
  originalErrorMethod.apply(NestLogger, args);

  // Phân tích arguments để lấy message, trace và context
  let message, trace, context;

  if (args.length === 1) {
    message = args[0];
  } else if (args.length === 2) {
    message = args[0];
    // Trong một số trường hợp NestJS, đối số thứ 2 có thể là trace hoặc context
    trace = typeof args[1] === 'string' ? args[1] : undefined;
    context = typeof args[1] === 'string' ? undefined : args[1];
  } else if (args.length >= 3) {
    message = args[0];
    trace = args[1];
    context = args[2];
  }

  // Ghi log ra file
  writeToFile('ERROR', message, context, trace);
};

// Ghi đè phương thức warn với xử lý cẩn thận hơn
NestLogger.warn = function () {
  // Copy lại arguments để sử dụng
  const args = Array.from(arguments);

  // Gọi phương thức gốc với arguments gốc
  originalWarnMethod.apply(NestLogger, args);

  // Phân tích arguments để lấy message và context
  let message, context;

  if (args.length === 1) {
    message = args[0];
  } else if (args.length >= 2) {
    message = args[0];
    context = args[1];
  }

  // Ghi log ra file
  writeToFile('WARN', message, context);
};

// Ghi đè phương thức debug với xử lý cẩn thận hơn
NestLogger.debug = function () {
  // Copy lại arguments để sử dụng
  const args = Array.from(arguments);

  // Gọi phương thức gốc với arguments gốc
  originalDebugMethod.apply(NestLogger, args);

  // Phân tích arguments để lấy message và context
  let message, context;

  if (args.length === 1) {
    message = args[0];
  } else if (args.length >= 2) {
    message = args[0];
    context = args[1];
  }

  // Ghi log ra file
  writeToFile('DEBUG', message, context);
};

// Ghi đè phương thức verbose với xử lý cẩn thận hơn
NestLogger.verbose = function () {
  // Copy lại arguments để sử dụng
  const args = Array.from(arguments);

  // Gọi phương thức gốc với arguments gốc
  originalVerboseMethod.apply(NestLogger, args);

  // Phân tích arguments để lấy message và context
  let message, context;

  if (args.length === 1) {
    message = args[0];
  } else if (args.length >= 2) {
    message = args[0];
    context = args[1];
  }

  // Ghi log ra file
  writeToFile('VERBOSE', message, context);
};

// Tương tự, ghi đè các phương thức prototype với xử lý cẩn thận hơn
const proto = NestLogger.prototype;
const originalInstanceLog = proto.log;
const originalInstanceError = proto.error;
const originalInstanceWarn = proto.warn;
const originalInstanceDebug = proto.debug;
const originalInstanceVerbose = proto.verbose;

// Ghi đè phương thức log của instance
proto.log = function () {
  // Copy lại arguments để sử dụng
  const args = Array.from(arguments);

  // Gọi phương thức gốc với arguments gốc
  originalInstanceLog.apply(this, args);

  // Phân tích arguments để lấy message và context
  let message, context;

  if (args.length === 1) {
    message = args[0];
    context = this.context;
  } else if (args.length >= 2) {
    message = args[0];
    context = args[1] || this.context;
  }

  // Ghi log ra file
  writeToFile('LOG', message, context);
};

// Ghi đè phương thức error của instance
proto.error = function () {
  // Copy lại arguments để sử dụng
  const args = Array.from(arguments);

  // Gọi phương thức gốc với arguments gốc
  originalInstanceError.apply(this, args);

  // Phân tích arguments để lấy message, trace và context
  let message, trace, context;

  if (args.length === 1) {
    message = args[0];
    context = this.context;
  } else if (args.length === 2) {
    message = args[0];
    // Trong một số trường hợp NestJS, đối số thứ 2 có thể là trace hoặc context
    if (typeof args[1] === 'string') {
      trace = args[1];
      context = this.context;
    } else {
      trace = undefined;
      context = args[1] || this.context;
    }
  } else if (args.length >= 3) {
    message = args[0];
    trace = args[1];
    context = args[2] || this.context;
  }

  // Ghi log ra file
  writeToFile('ERROR', message, context, trace);
};

// Ghi đè các phương thức khác tương tự...
proto.warn = function () {
  const args = Array.from(arguments);
  originalInstanceWarn.apply(this, args);

  let message, context;
  if (args.length === 1) {
    message = args[0];
    context = this.context;
  } else if (args.length >= 2) {
    message = args[0];
    context = args[1] || this.context;
  }

  writeToFile('WARN', message, context);
};

proto.debug = function () {
  const args = Array.from(arguments);
  originalInstanceDebug.apply(this, args);

  let message, context;
  if (args.length === 1) {
    message = args[0];
    context = this.context;
  } else if (args.length >= 2) {
    message = args[0];
    context = args[1] || this.context;
  }

  writeToFile('DEBUG', message, context);
};

proto.verbose = function () {
  const args = Array.from(arguments);
  originalInstanceVerbose.apply(this, args);

  let message, context;
  if (args.length === 1) {
    message = args[0];
    context = this.context;
  } else if (args.length >= 2) {
    message = args[0];
    context = args[1] || this.context;
  }

  writeToFile('VERBOSE', message, context);
};

export function initializeLogger() {
  // Chạy cleanup một lần khi khởi động
  cleanupOldLogs();

  // Đặt lịch xóa log cũ mỗi ngày vào lúc nửa đêm
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const timeUntilMidnight = tomorrow.getTime() - now.getTime();

  // Đặt lịch chạy lần đầu vào lúc nửa đêm
  setTimeout(() => {
    cleanupOldLogs();

    // Sau đó, chạy mỗi 24 giờ
    setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);

  console.log('Logger has been patched to write to daily files with 30-day retention');
}
