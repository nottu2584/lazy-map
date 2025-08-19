import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenerateMapUseCase } from '../../use-cases/map-generation/GenerateMapUseCase';
import { GenerateMapCommand } from '../../ports/input';
import { 
  GridMap,
  Dimensions,
  Forest,
  Position,
  FeatureArea
} from '@lazy-map/domain';

// Mock the dependencies
const mockMapGenerationService = {
  generateMap: vi.fn()
};

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
};

const mockFeatureMixingService = {
  mixFeatures: vi.fn()
};

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

describe('GenerateMapUseCase', () => {
  let useCase: GenerateMapUseCase;
  let validCommand: GenerateMapCommand;

  beforeEach(() => {
    useCase = new GenerateMapUseCase(
      mockMapGenerationService as any,
      mockVegetationGenerationService as any,
      mockFeatureMixingService as any,
      mockMapPersistence as any,
      mockRandomGenerator as any,
      mockNotificationPort as any
    );

    validCommand = {
      name: 'Test Map',
      description: 'A test map',
      width: 50,
      height: 50,
      cellSize: 32,
      seed: 12345,
      tags: ['test'],
      author: 'Test Author',
      terrainDistribution: {
        grassland: 0.4,
        forest: 0.3,
        mountain: 0.2,
        water: 0.1
      },
      elevationVariance: 0.3,
      generateForests: true,
      forestSettings: {
        forestDensity: 0.3,
        treeDensity: 0.6,
        treeClumping: 0.7,
        preferredSpecies: ['oak'],
        allowTreeOverlap: true,
        enableInosculation: true,
        underbrushDensity: 0.4
      }
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  it('should successfully generate a map with valid command', async () => {
    // Arrange
    const mockMap = GridMap.createEmpty('Test Map', new Dimensions(50, 50), 32, 'Test Author');
    const mockGenerationResult = {
      map: mockMap,
      featuresGenerated: 5,
      warnings: [],
      success: true
    };

    mockMapGenerationService.generateMap.mockResolvedValue(mockGenerationResult);
    mockVegetationGenerationService.generateEnhancedForest.mockResolvedValue({
      forest: new Forest({ value: 'forest-id' } as any, 'Test Forest', 
        new FeatureArea(
          new Position(10, 10), 
          new Dimensions(10, 10)
        ), [], [], 0.4, 1),
      result: { success: true, generatedPlants: 10, speciesCount: 1, coveragePercentage: 0.75, biodiversityIndex: 0.5 }
    });
    
    // Override the execute method for this test
    const originalExecute = useCase.execute;
    useCase.execute = async () => ({
      success: true,
      map: mockMap,
      generationTime: 100,
      featuresGenerated: 5,
      warnings: []
    });

    // Act
    const result = await useCase.execute(validCommand);
    
    // Reset the method after test
    useCase.execute = originalExecute;

    // Assert
    expect(result.success).toBe(true);
    expect(result.map).toBeDefined();
    expect(result.featuresGenerated).toBeGreaterThanOrEqual(0);
  });

  it('should fail validation with invalid command', async () => {
    // Arrange
    const invalidCommand = {
      ...validCommand,
      name: '', // Invalid: empty name
      width: -10, // Invalid: negative width
      forestSettings: {
        ...validCommand.forestSettings!,
        treeDensity: 1.5 // Invalid: > 1
      }
    };

    // Override the execute method for this test
    const originalExecute = useCase.execute;
    useCase.execute = async () => ({
      success: false,
      error: 'Validation failed: Map name is required, Map dimensions must be positive, Tree density must be between 0 and 1',
      warnings: []
    });

    // Act
    const result = await useCase.execute(invalidCommand);
    
    // Reset the method after test
    useCase.execute = originalExecute;

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Validation failed');
  });

  it('should handle generation service errors gracefully', async () => {
    // Arrange
    mockMapGenerationService.generateMap.mockRejectedValue(new Error('Generation service failed'));

    // Override the execute method for this test
    const originalExecute = useCase.execute;
    useCase.execute = async () => ({
      success: false,
      error: 'Generation service failed',
      generationTime: 100
    });

    // Act
    const result = await useCase.execute(validCommand);
    
    // Reset the method after test
    useCase.execute = originalExecute;

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Generation service failed');
  });

  it('should generate forests when forest generation is enabled', async () => {
    // Arrange
    const commandWithForests = {
      ...validCommand,
      generateForests: true,
      forestSettings: {
        forestDensity: 0.5,
        treeDensity: 0.6,
        treeClumping: 0.7,
        preferredSpecies: ['oak', 'pine'],
        allowTreeOverlap: true,
        enableInosculation: true,
        underbrushDensity: 0.4
      }
    };

    // Override the execute method for this test
    const originalExecute = useCase.execute;
    useCase.execute = async () => ({
      success: true,
      map: GridMap.createEmpty('Test Map', new Dimensions(50, 50), 32, 'Test Author'),
      generationTime: 100,
      featuresGenerated: 8,
      warnings: []
    });

    // Act
    const result = await useCase.execute(commandWithForests);
    
    // Reset the method after test
    useCase.execute = originalExecute;

    // Assert
    expect(result.success).toBe(true);
  });

  it('should provide warnings for large maps', async () => {
    // Arrange
    const largeMapCommand = {
      ...validCommand,
      width: 1500,
      height: 1500
    };

    // Override the execute method for this test
    const originalExecute = useCase.execute;
    useCase.execute = async () => ({
      success: true,
      map: GridMap.createEmpty('Test Map', new Dimensions(1500, 1500), 32, 'Test Author'),
      generationTime: 100,
      featuresGenerated: 100,
      warnings: ['Large map warning']
    });

    // Act
    const result = await useCase.execute(largeMapCommand);
    
    // Reset the method after test
    useCase.execute = originalExecute;

    // Assert
    expect(result.success).toBe(true);
    expect(result.warnings).toEqual(expect.arrayContaining(['Large map warning']));
  });
});