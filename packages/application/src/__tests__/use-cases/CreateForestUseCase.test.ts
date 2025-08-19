import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateForestUseCase } from '../../use-cases/feature-management/CreateForestUseCase';
import { CreateForestCommand } from '../../ports/input';
import { 
  IVegetationGenerationService,
  Forest,
  FeatureArea,
  Position,
  Dimensions,
  PlantSpecies
} from '@lazy-map/domain';

// Mock the dependencies
const mockVegetationGenerationService = {
  generateEnhancedForest: vi.fn(),
  generateGrassland: vi.fn(),
  generateUnderstoryVegetation: vi.fn(),
  generateTransitionZone: vi.fn(),
  getSpeciesForBiome: vi.fn(),
  getDefaultForestSettings: vi.fn(),
  getDefaultGrasslandSettings: vi.fn(),
  validateForestSettings: vi.fn(),
  validateGrasslandSettings: vi.fn(),
  calculatePlantInteractions: vi.fn(),
  applySeasonalChanges: vi.fn(),
  generatePlantProperties: vi.fn(),
  calculateOptimalPlantDensity: vi.fn()
} as unknown as IVegetationGenerationService;

const mockMapPersistence = {
  saveMap: vi.fn(),
  loadMap: vi.fn(),  
  updateMap: vi.fn(),
  removeMap: vi.fn(),
  mapExists: vi.fn(),
  listMaps: vi.fn(),
  saveFeature: vi.fn(),
  loadFeature: vi.fn(),
  updateFeature: vi.fn(),
  removeFeature: vi.fn()
};

const mockRandomGenerator = {
  createRandom: vi.fn(),
  createSeeded: vi.fn()
};

const mockNotificationPort = {
  notifyMapGenerationProgress: vi.fn(),
  notifyMapGenerationComplete: vi.fn(),
  notifyFeatureOperation: vi.fn(),
  notifyError: vi.fn()
};

describe('CreateForestUseCase', () => {
  let useCase: CreateForestUseCase;
  let validCommand: CreateForestCommand;

  beforeEach(() => {
    useCase = new CreateForestUseCase(
      mockVegetationGenerationService,
      mockMapPersistence,
      mockRandomGenerator,
      mockNotificationPort
    );

    validCommand = {
      name: 'Test Forest',
      mapId: 'test-map-id',
      x: 10,
      y: 10,
      width: 20,
      height: 15,
      seed: 12345,
      forestSettings: {
        treeDensity: 0.6,
        treeClumping: 0.7,
        preferredSpecies: ['oak', 'pine'],
        allowTreeOverlap: true,
        enableInosculation: true,
        underbrushDensity: 0.4
      }
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  it('should successfully create a forest with valid command', async () => {
    // Arrange
    const mockForest = new Forest(
      { value: 'forest-id' } as any,
      'Test Forest',
      new FeatureArea(new Position(10, 10), new Dimensions(20, 15)),
      [],
      PlantSpecies.OAK,
      0.4,
      1
    );

    mockMapPersistence.mapExists = vi.fn().mockResolvedValue(true);
    mockVegetationGenerationService.generateEnhancedForest = vi.fn().mockResolvedValue({ forest: mockForest, result: { success: true, generatedPlants: 10, speciesCount: 1, coveragePercentage: 0.75, biodiversityIndex: 0.5 } });
    mockRandomGenerator.createSeeded = vi.fn().mockReturnValue({});
    mockMapPersistence.saveFeature = vi.fn().mockResolvedValue(undefined);

    // Act
    const result = await useCase.execute(validCommand);

    // Assert
    expect(result.success).toBe(true);
    expect(result.feature).toBeDefined();
    expect(mockMapPersistence.mapExists).toHaveBeenCalledWith({ value: 'test-map-id' });
    expect(mockVegetationGenerationService.generateEnhancedForest).toHaveBeenCalledOnce();
    expect(mockMapPersistence.saveFeature).toHaveBeenCalledOnce();
    expect(mockNotificationPort.notifyFeatureOperation).toHaveBeenCalledWith(
      'created',
      'forest',
      'Test Forest',
      'test-map-id'
    );
  });

  it('should fail validation with invalid command', async () => {
    // Arrange
    const invalidCommand = {
      ...validCommand,
      name: '', // Invalid: empty name
      width: -5, // Invalid: negative width
      forestSettings: {
        ...validCommand.forestSettings,
        treeDensity: 1.5 // Invalid: > 1
      }
    };

    // Act
    const result = await useCase.execute(invalidCommand);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Validation failed');
    expect(mockMapPersistence.mapExists).not.toHaveBeenCalled();
    expect(mockVegetationGenerationService.generateEnhancedForest).not.toHaveBeenCalled();
  });

  it('should fail when map does not exist', async () => {
    // Arrange
    mockMapPersistence.mapExists = vi.fn().mockResolvedValue(false);

    // Act
    const result = await useCase.execute(validCommand);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Map with ID test-map-id does not exist');
    expect(mockVegetationGenerationService.generateEnhancedForest).not.toHaveBeenCalled();
  });

  it('should handle generation service errors gracefully', async () => {
    // Arrange
    const error = new Error('Forest generation failed');
    mockMapPersistence.mapExists = vi.fn().mockResolvedValue(true);
    mockRandomGenerator.createSeeded = vi.fn().mockReturnValue({});
    mockVegetationGenerationService.generateEnhancedForest = vi.fn().mockRejectedValue(error);

    // Act
    const result = await useCase.execute(validCommand);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Forest generation failed');
    expect(mockNotificationPort.notifyError).toHaveBeenCalledWith(
      'Forest Creation Failed',
      'Forest generation failed',
      expect.any(Object)
    );
  });

  it('should provide warnings for very large forests', async () => {
    // Arrange
    const largeForestCommand = {
      ...validCommand,
      width: 200,
      height: 200 // Large area = 40,000
    };

    const mockForest = new Forest(
      { value: 'forest-id' } as any,
      'Large Forest',
      new FeatureArea(new Position(10, 10), new Dimensions(200, 200)),
      [],
      PlantSpecies.OAK,
      0.4,
      1
    );

    mockMapPersistence.mapExists = vi.fn().mockResolvedValue(true);
    mockVegetationGenerationService.generateEnhancedForest = vi.fn().mockResolvedValue({ forest: mockForest, result: { success: true, generatedPlants: 10, speciesCount: 1, coveragePercentage: 0.75, biodiversityIndex: 0.5 } });
    mockRandomGenerator.createSeeded = vi.fn().mockReturnValue({});
    mockMapPersistence.saveFeature = vi.fn().mockResolvedValue(undefined);

    // Act
    const result = await useCase.execute(largeForestCommand);

    // Assert
    expect(result.success).toBe(true);
    expect(result.warnings).toContain('Very large forests may take significant time to generate');
  });

  it('should validate tree species correctly', async () => {
    // Arrange
    const invalidSpeciesCommand = {
      ...validCommand,
      forestSettings: {
        ...validCommand.forestSettings,
        preferredSpecies: ['oak', 'invalid-species'] // Contains invalid species
      }
    };

    // Act
    const result = await useCase.execute(invalidSpeciesCommand);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid tree species: invalid-species');
  });
});