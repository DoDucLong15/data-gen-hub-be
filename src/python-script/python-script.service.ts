import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class PythonScriptService {
  private pythonCommand = process.env.PYTHON_PATH || 'python';
  private environment = process.env.NODE_ENV ?? 'local';
  constructor() {}

  async runPythonScript(scriptPath: string, args: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const argsArray = [JSON.stringify(args)];

      const fullPath = path.resolve(scriptPath);
      const venvPath =
        os.platform() === 'win32'
          ? path.resolve('../python-script/.venv/Scripts/python.exe')
          : path.resolve('../python-script/.venv/bin/python');
      // Chạy Python script
      const process = spawn(this.environment === 'local' ? venvPath : this.pythonCommand, [
        fullPath,
        ...argsArray,
      ]);
      Logger.log(
        `Running python script: ${process.spawnargs.join(' ')}`,
        'PythonScriptService.runPythonScript',
      );
      let output = '';
      let error = '';

      // Lấy output từ Python script
      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      // Lấy lỗi nếu có
      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      // Xử lý khi tiến trình kết thúc
      process.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(error || `Python script exited with code ${code}`));
        }
      });
    });
  }
}
