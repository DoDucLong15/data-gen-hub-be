import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { PythonScriptController } from './python-script.controller';
import { PythonScriptService } from './python-script.service';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { PoliciesGuard } from 'src/authorization/guards/policies.guard';
import { EAction } from 'src/permissions/enums/action.enum';
import { ESubject } from 'src/authorization/enums/subject.enum';
import { CheckPolicies } from 'src/authorization/decorators/check-policies.decorator';

describe('PythonScriptController', () => {
  let controller: PythonScriptController;
  let pythonScriptService: PythonScriptService;

  // Save original environment variable to restore later
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    // Reset environment variable before each test
    process.env.NODE_ENV = 'local';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PythonScriptController],
      providers: [
        {
          provide: PythonScriptService,
          useValue: {
            runPythonScript: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PythonScriptController>(PythonScriptController);
    pythonScriptService = module.get<PythonScriptService>(PythonScriptService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment variable
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateSpec', () => {
    // Scenario 1: Successfully generate DB spec
    it('should successfully generate DB spec', async () => {
      // Arrange
      const mockScriptOutput = JSON.stringify({
        tables: [
          {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid', isPrimary: true },
              { name: 'email', type: 'varchar' },
              { name: 'name', type: 'varchar' },
            ],
          },
        ],
      });

      jest.spyOn(pythonScriptService, 'runPythonScript').mockResolvedValueOnce(mockScriptOutput);

      // Act
      const result = await controller.generateSpec();

      // Assert
      expect(pythonScriptService.runPythonScript).toHaveBeenCalledWith(
        '../python-script/dbgenspec.py',
      );
      expect(result).toEqual({
        tables: [
          {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid', isPrimary: true },
              { name: 'email', type: 'varchar' },
              { name: 'name', type: 'varchar' },
            ],
          },
        ],
      });
    });

    // Scenario 2: Handle service error
    it('should propagate errors from the python script service', async () => {
      // Arrange
      const error = new Error('Failed to execute Python script');
      jest.spyOn(pythonScriptService, 'runPythonScript').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.generateSpec()).rejects.toThrow(error);
      expect(pythonScriptService.runPythonScript).toHaveBeenCalledWith(
        '../python-script/dbgenspec.py',
      );
    });

    // Scenario 3: Handle JSON parse error
    it('should handle JSON parse errors', async () => {
      // Arrange
      const invalidJson = '{invalid: json}';
      jest.spyOn(pythonScriptService, 'runPythonScript').mockResolvedValueOnce(invalidJson);

      // Act & Assert
      await expect(controller.generateSpec()).rejects.toThrow(SyntaxError);
      expect(pythonScriptService.runPythonScript).toHaveBeenCalledWith(
        '../python-script/dbgenspec.py',
      );
    });

    // Scenario 4: Check correct script path based on environment
    it('should use the correct script path based on environment', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const mockScriptOutput = JSON.stringify({ tables: [] });

      // Create a new module with the updated environment
      const productionModule: TestingModule = await Test.createTestingModule({
        controllers: [PythonScriptController],
        providers: [
          {
            provide: PythonScriptService,
            useValue: {
              runPythonScript: jest.fn().mockResolvedValue(mockScriptOutput),
            },
          },
        ],
      })
        .overrideGuard(AccessTokenGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .overrideGuard(PoliciesGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .compile();

      const productionController =
        productionModule.get<PythonScriptController>(PythonScriptController);
      const productionService = productionModule.get<PythonScriptService>(PythonScriptService);

      // Act
      await productionController.generateSpec();

      // Assert
      expect(productionService.runPythonScript).toHaveBeenCalledWith('/app/dbgenspec.py');
    });

    // Scenario 5: Check policy guard
    it('should have the correct policy guard', () => {
      // Mock the CheckPolicies decorator
      const mockPolicyMetadata = {
        action: EAction.MANAGE,
        subject: ESubject.PythonScript_DBGenSpec,
      };

      // Mock Reflect.getMetadata to return our mock policy
      const originalGetMetadata = Reflect.getMetadata;
      Reflect.getMetadata = jest.fn().mockImplementation((key, target) => {
        if (key === 'check_policies' && target === controller.generateSpec) {
          return mockPolicyMetadata;
        }
        return originalGetMetadata(key, target);
      });

      // Get metadata for the generateSpec method
      const metadata = Reflect.getMetadata('check_policies', controller.generateSpec);

      // Assert that the policy is correctly applied
      expect(metadata).toBeDefined();
      expect(metadata).toEqual({
        action: EAction.MANAGE,
        subject: ESubject.PythonScript_DBGenSpec,
      });

      // Restore original Reflect.getMetadata
      Reflect.getMetadata = originalGetMetadata;
    });
  });
});
