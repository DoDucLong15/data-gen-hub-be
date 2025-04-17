import { Test, TestingModule } from '@nestjs/testing';
import { PythonScriptService } from './python-script.service';
import { Logger } from '@nestjs/common';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as os from 'os';

// Mock child_process spawn
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

describe('PythonScriptService', () => {
  let service: PythonScriptService;

  // Save original environment variables to restore later
  const originalNodeEnv = process.env.NODE_ENV;
  const originalPythonContainer = process.env.PYTHON_CONTAINER;

  beforeEach(async () => {
    // Reset environment variables before each test
    process.env.NODE_ENV = 'local';
    process.env.PYTHON_CONTAINER = 'python-service';

    const module: TestingModule = await Test.createTestingModule({
      providers: [PythonScriptService],
    }).compile();

    service = module.get<PythonScriptService>(PythonScriptService);

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    // Restore original environment variables
    process.env.NODE_ENV = originalNodeEnv;
    process.env.PYTHON_CONTAINER = originalPythonContainer;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runPythonScript', () => {
    // Helper function to create a mock process
    const createMockProcess = () => {
      const mockStdout = new EventEmitter();
      const mockStderr = new EventEmitter();
      const mockProcess = new EventEmitter() as ChildProcessWithoutNullStreams;

      mockProcess.stdout = mockStdout as any;
      mockProcess.stderr = mockStderr as any;

      // Define spawnargs as a getter to avoid read-only property error
      Object.defineProperty(mockProcess, 'spawnargs', {
        get: () => ['mock', 'args'],
      });

      return {
        mockProcess,
        mockStdout,
        mockStderr,
      };
    };

    // Scenario 1: Successfully run Python script locally
    it('should successfully run Python script locally', async () => {
      // Arrange
      process.env.NODE_ENV = 'local';
      const scriptPath = '/path/to/script.py';
      const args = ['arg1', 'arg2'];
      const expectedOutput = 'Script output';

      const { mockProcess, mockStdout } = createMockProcess();
      (spawn as jest.Mock).mockReturnValueOnce(mockProcess);

      // Create a promise that will resolve when our test is complete
      const testPromise = service.runPythonScript(scriptPath, args);

      // Emit events to simulate process execution
      mockStdout.emit('data', Buffer.from(expectedOutput));
      mockProcess.emit('close', 0);

      // Act & Assert
      const result = await testPromise;

      // Verify spawn was called with correct arguments
      const venvPath =
        os.platform() === 'win32'
          ? path.resolve('../python-script/.venv/Scripts/python.exe')
          : path.resolve('../python-script/.venv/bin/python');

      expect(spawn).toHaveBeenCalledWith(venvPath, [path.resolve(scriptPath), ...args]);
      expect(result).toBe(expectedOutput);
    });

    // Scenario 2: Successfully run Python script in Docker
    it('should successfully run Python script in Docker', async () => {
      // Arrange
      process.env.NODE_ENV = 'production'; // Set to non-local to trigger Docker path
      const scriptPath = '/path/to/script.py';
      const args = ['arg1', 'arg2'];
      const expectedOutput = 'Script output';

      // Create a new service instance to pick up the environment change
      const module: TestingModule = await Test.createTestingModule({
        providers: [PythonScriptService],
      }).compile();
      const dockerService = module.get<PythonScriptService>(PythonScriptService);

      const { mockProcess, mockStdout } = createMockProcess();
      (spawn as jest.Mock).mockReturnValueOnce(mockProcess);

      // Create a promise that will resolve when our test is complete
      const testPromise = dockerService.runPythonScript(scriptPath, args);

      // Emit events to simulate process execution
      mockStdout.emit('data', Buffer.from(expectedOutput));
      mockProcess.emit('close', 0);

      // Act & Assert
      const result = await testPromise;

      // Verify spawn was called with correct arguments
      expect(spawn).toHaveBeenCalledWith('docker', [
        'exec',
        '-i',
        'python-service',
        'python3',
        path.resolve(scriptPath),
        ...args,
      ]);
      expect(result).toBe(expectedOutput);
    });

    // Scenario 3: Handle process spawn error
    it('should handle process spawn error', async () => {
      // Arrange
      process.env.NODE_ENV = 'local';
      const scriptPath = '/path/to/script.py';
      const spawnError = new Error('Failed to spawn process');

      (spawn as jest.Mock).mockImplementationOnce(() => {
        throw spawnError;
      });

      // Act & Assert
      await expect(service.runPythonScript(scriptPath)).rejects.toThrow(
        `Failed to start process: ${spawnError.message}`,
      );

      expect(Logger.error).toHaveBeenCalled();
    });

    // Scenario 4: Handle process execution error
    it('should handle process execution error', async () => {
      // Arrange
      process.env.NODE_ENV = 'local';
      const scriptPath = '/path/to/script.py';
      const processError = new Error('Process execution error');

      const { mockProcess } = createMockProcess();
      (spawn as jest.Mock).mockReturnValueOnce(mockProcess);

      // Create a promise that will resolve when our test is complete
      const testPromise = service.runPythonScript(scriptPath);

      // Emit error event
      mockProcess.emit('error', processError);

      // Act & Assert
      await expect(testPromise).rejects.toThrow(`Process error: ${processError.message}`);

      expect(Logger.error).toHaveBeenCalled();
    });

    // Scenario 5: Handle non-zero exit code
    it('should handle non-zero exit code', async () => {
      // Arrange
      process.env.NODE_ENV = 'local';
      const scriptPath = '/path/to/script.py';
      const errorOutput = 'Script error output';

      const { mockProcess, mockStderr } = createMockProcess();
      (spawn as jest.Mock).mockReturnValueOnce(mockProcess);

      // Create a promise that will resolve when our test is complete
      const testPromise = service.runPythonScript(scriptPath);

      // Emit events to simulate process execution with error
      mockStderr.emit('data', Buffer.from(errorOutput));
      mockProcess.emit('close', 1);

      // Act & Assert
      await expect(testPromise).rejects.toThrow(errorOutput);

      expect(Logger.error).toHaveBeenCalled();
    });

    // Scenario 6: Run with command line arguments
    it('should run with command line arguments', async () => {
      // Arrange
      process.env.NODE_ENV = 'local';
      const scriptPath = '/path/to/script.py';
      const args = ['--input', 'file.txt', '--output', 'result.json'];
      const expectedOutput = 'Script output with args';

      const { mockProcess, mockStdout } = createMockProcess();
      (spawn as jest.Mock).mockReturnValueOnce(mockProcess);

      // Create a promise that will resolve when our test is complete
      const testPromise = service.runPythonScript(scriptPath, args);

      // Emit events to simulate process execution
      mockStdout.emit('data', Buffer.from(expectedOutput));
      mockProcess.emit('close', 0);

      // Act & Assert
      const result = await testPromise;

      // Verify spawn was called with correct arguments
      const venvPath =
        os.platform() === 'win32'
          ? path.resolve('../python-script/.venv/Scripts/python.exe')
          : path.resolve('../python-script/.venv/bin/python');

      expect(spawn).toHaveBeenCalledWith(venvPath, [path.resolve(scriptPath), ...args]);
      expect(result).toBe(expectedOutput);
    });

    // Scenario 7: Handle empty output
    it('should handle empty output', async () => {
      // Arrange
      process.env.NODE_ENV = 'local';
      const scriptPath = '/path/to/script.py';

      const { mockProcess } = createMockProcess();
      (spawn as jest.Mock).mockReturnValueOnce(mockProcess);

      // Create a promise that will resolve when our test is complete
      const testPromise = service.runPythonScript(scriptPath);

      // Emit close event without any output
      mockProcess.emit('close', 0);

      // Act & Assert
      const result = await testPromise;

      expect(result).toBe('');
    });

    // Scenario 8: Handle stderr output
    it('should handle stderr output with successful exit code', async () => {
      // Arrange
      process.env.NODE_ENV = 'local';
      const scriptPath = '/path/to/script.py';
      const stdoutOutput = 'Standard output';
      const stderrOutput = 'Warning message';

      const { mockProcess, mockStdout, mockStderr } = createMockProcess();
      (spawn as jest.Mock).mockReturnValueOnce(mockProcess);

      // Create a promise that will resolve when our test is complete
      const testPromise = service.runPythonScript(scriptPath);

      // Emit events to simulate process execution with warnings
      mockStdout.emit('data', Buffer.from(stdoutOutput));
      mockStderr.emit('data', Buffer.from(stderrOutput));
      mockProcess.emit('close', 0);

      // Act & Assert
      const result = await testPromise;

      // Even with stderr output, if exit code is 0, we should get stdout
      expect(result).toBe(stdoutOutput);
    });
  });
});
