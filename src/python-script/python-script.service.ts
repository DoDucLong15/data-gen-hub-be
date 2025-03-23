import { Injectable, Logger } from '@nestjs/common';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class PythonScriptService {
  private environment = process.env.NODE_ENV ?? 'local';
  private pythonContainer = process.env.PYTHON_CONTAINER ?? 'python-service';
  constructor() {}

  async runPythonScript(scriptPath: string, args?: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const fullPath = path.resolve(scriptPath);
      const venvPath =
        os.platform() === 'win32'
          ? path.resolve('../python-script/.venv/Scripts/python.exe')
          : path.resolve('../python-script/.venv/bin/python');

      let process: ChildProcessWithoutNullStreams;

      try {
        if (this.environment === 'local') {
          process = spawn(venvPath, [fullPath, ...(args || [])]);
        } else {
          process = spawn('docker', [
            'exec',
            '-i',
            this.pythonContainer,
            'python3',
            fullPath,
            ...(args || []),
          ]);
        }
      } catch (error) {
        Logger.error(`Failed to start process: ${error.message}`, 'PythonScriptService');
        reject(new Error(`Failed to start process: ${error.message}`));
        return;
      }

      Logger.log(
        `Running python script: ${process.spawnargs.join(' ')}`,
        'PythonScriptService.runPythonScript',
      );

      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('error', (err) => {
        Logger.error(`Process error: ${err.message}`, 'PythonScriptService');
        reject(new Error(`Process error: ${err.message}`));
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          Logger.error(`Python script exited with code ${code}: ${error}`, 'PythonScriptService');
          reject(new Error(error || `Python script exited with code ${code}`));
        }
      });
    });
  }
}
