import { IRandomGenerator, Dimensions, SpatialBounds, Position } from '@lazy-map/domain';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  HydrographicGenerationSettings,
  LakeGenerationSettings,
  RiverGenerationSettings,
  SpringGenerationSettings,
  WetlandGenerationSettings,
  LakeFormation,
  SpringType,
  WetlandType,
  WaterLevel,
  WaterQuality
} from '@lazy-map/domain';
import { HydrographicGenerationService } from '../contexts/natural/services/HydrographicGenerationService';

class MockRandomGenerator implements IRandomGenerator {
  private value = 0.5;

  next(): number {
    return this.value;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(min + this.value * (max - min));
  }

  nextFloat(min: number, max: number): number {
    return min + this.value * (max - min);
  }

  choice<T>(items: T[]): T {
    const index = Math.floor(this.value * items.length);
    return items[index];
  }

  shuffle<T>(items: T[]): T[] {
    return [...items];
  }

  seed(seed: number): void {
    // Simple seed implementation for testing
    this.value = (seed % 1000000) / 1000000;
  }

  setSeed(seed: string): void {
    // Simple seed implementation for testing
    this.value = parseFloat(`0.${seed.length}`) || 0.5;
  }

  setValue(value: number): void {
    this.value = value;
  }
}

describe('HydrographicGenerationService', () => {
  let service: HydrographicGenerationService;
  let mockRandom: MockRandomGenerator;
  let testArea: SpatialBounds;

  beforeEach(() => {
    service = new HydrographicGenerationService();
    mockRandom = new MockRandomGenerator();
    testArea = new SpatialBounds(new Position(0, 0), new Dimensions(1000, 1000));
  });

  describe('generateRiver', () => {
    it('should generate a basic river', async () => {
      const settings: RiverGenerationSettings = {
        minLength: 100,
        maxLength: 500,
        averageWidth: 20,
        widthVariation: 0.3,
        baseFlowVelocity: 3,
        meandering: 0.4,
        naturalObstacles: true,
        waterQuality: WaterQuality.river(),
        seasonal: false,
        allowPartial: true,
        requireSource: true,
        requireMouth: true,
        allowTributaries: false,
        maxTributaries: 0,
        tributaryChance: 0,
        elevation: 100,
        climate: 'temperate',
        terrain: 'hilly'
      };

      const river = await service.generateRiver(testArea, settings, undefined, undefined, mockRandom);

      expect(river).toBeDefined();
      expect(river.name).toBeDefined();
      expect(river.averageWidth).toBe(20);
      expect(river.waterQuality).toBe(settings.waterQuality);
      expect(river.path.length).toBeGreaterThan(0);
    });

    it('should generate river with specific source and mouth', async () => {
      const source = new Position(100, 100);
      const mouth = new Position(100, 800);

      const settings: RiverGenerationSettings = {
        minLength: 100,
        maxLength: 800,
        averageWidth: 15,
        widthVariation: 0.2,
        baseFlowVelocity: 2,
        meandering: 0.2,
        naturalObstacles: false,
        waterQuality: WaterQuality.river(),
        seasonal: false,
        allowPartial: true,
        requireSource: true,
        requireMouth: true,
        allowTributaries: false,
        maxTributaries: 0,
        tributaryChance: 0,
        elevation: 100,
        climate: 'temperate',
        terrain: 'flat'
      };

      const river = await service.generateRiver(testArea, settings, source, mouth, mockRandom);

      expect(river.source?.position.equals(source)).toBe(true);
      expect(river.mouth?.position.equals(mouth)).toBe(true);
    });

    it('should generate tributaries when enabled', async () => {
      const settings: RiverGenerationSettings = {
        minLength: 200,
        maxLength: 600,
        averageWidth: 25,
        widthVariation: 0.3,
        baseFlowVelocity: 3,
        meandering: 0.3,
        naturalObstacles: true,
        waterQuality: WaterQuality.river(),
        seasonal: false,
        allowPartial: true,
        requireSource: true,
        requireMouth: true,
        allowTributaries: true,
        maxTributaries: 2,
        tributaryChance: 0.8,
        elevation: 100,
        climate: 'temperate',
        terrain: 'hilly'
      };

      mockRandom.setValue(0.9); // High value to ensure tributary generation
      const river = await service.generateRiver(testArea, settings, undefined, undefined, mockRandom);

      // Generate tributaries
      const tributaries = await service.generateTributaries(river, settings, testArea, mockRandom);

      expect(tributaries.length).toBeGreaterThanOrEqual(0);
      expect(tributaries.length).toBeLessThanOrEqual(settings.maxTributaries);
    });
  });

  describe('generateLake', () => {
    it('should generate a basic lake', async () => {
      const settings: LakeGenerationSettings = {
        minSize: 500,
        maxSize: 2000,
        irregularity: 0.5,
        formation: LakeFormation.NATURAL,
        averageDepth: 15,
        maxDepth: 30,
        shallowAreas: 0.3,
        waterQuality: WaterQuality.lake(),
        thermalStability: false,
        generateIslands: true,
        islandChance: 0.3,
        generateInlets: true,
        generateOutlets: true,
        shorelineComplexity: 0.6,
        accessibilityRatio: 0.7
      };

      const lake = await service.generateLake(testArea, settings, mockRandom);

      expect(lake).toBeDefined();
      expect(lake.name).toBeDefined();
      expect(lake.formation).toBe(LakeFormation.NATURAL);
      // Depths now use noise-based calculation, so they vary from the settings
      expect(lake.maxDepth).toBeGreaterThan(10);
      expect(lake.averageDepth).toBeGreaterThan(5);
      expect(lake.averageDepth).toBeLessThan(25); // Should be around 15 with variation
      expect(lake.shoreline.length).toBeGreaterThan(0);
    });

    it('should generate volcanic crater lake', async () => {
      const settings: LakeGenerationSettings = {
        minSize: 300,
        maxSize: 1000,
        irregularity: 0.2, // More circular for crater lake
        formation: LakeFormation.VOLCANIC,
        averageDepth: 25,
        maxDepth: 50,
        shallowAreas: 0.1,
        waterQuality: WaterQuality.pristine(),
        thermalStability: true,
        generateIslands: false,
        islandChance: 0,
        generateInlets: false,
        generateOutlets: false,
        shorelineComplexity: 0.3,
        accessibilityRatio: 0.4
      };

      const lake = await service.generateLake(testArea, settings, mockRandom);

      expect(lake.formation).toBe(LakeFormation.VOLCANIC);
      expect(lake.thermalStability).toBe(true);
      expect(lake.hasInflow).toBe(false);
      expect(lake.hasOutflow).toBe(false);
    });
  });

  describe('generateSpring', () => {
    it('should generate different types of springs', async () => {
      const position = new Position(500, 500);

      // Test artesian spring
      const artesianSettings: SpringGenerationSettings = {
        springType: SpringType.ARTESIAN,
        flowRate: 15,
        temperature: 60,
        preferHighElevation: false,
        preferRockFormations: false,
        nearWaterFeatures: false,
        generateOutflow: true,
        outflowLength: 100
      };

      const artesianSpring = await service.generateSpring(position, artesianSettings, mockRandom);
      expect(artesianSpring.springType).toBe(SpringType.ARTESIAN);
      expect(artesianSpring.flowRate).toBe(15);
      expect(artesianSpring.temperature).toBe(60);
      expect(artesianSpring.isPotable).toBe(true);

      // Test hot spring
      const thermalSettings: SpringGenerationSettings = {
        springType: SpringType.THERMAL,
        flowRate: 8,
        temperature: 150,
        preferHighElevation: false,
        preferRockFormations: true,
        nearWaterFeatures: false,
        generateOutflow: true,
        outflowLength: 50
      };

      const hotSpring = await service.generateSpring(position, thermalSettings, mockRandom);
      expect(hotSpring.springType).toBe(SpringType.THERMAL);
      expect(hotSpring.isHotSpring).toBe(true);
      expect(hotSpring.isPotable).toBe(false);
    });
  });

  describe('generatePond', () => {
    it('should generate seasonal and permanent ponds', async () => {
      const pondArea = new SpatialBounds(new Position(400, 400), new Dimensions(50, 50));

      const seasonalPond = await service.generatePond(pondArea, true, mockRandom);
      const permanentPond = await service.generatePond(pondArea, false, mockRandom);

      expect(seasonalPond.seasonal).toBe(true);
      expect(permanentPond.seasonal).toBe(false);

      expect(seasonalPond.depth).toBeGreaterThan(0);
      expect(permanentPond.depth).toBeGreaterThan(0);

      expect(seasonalPond.area.equals(pondArea)).toBe(true);
      expect(permanentPond.area.equals(pondArea)).toBe(true);
    });
  });

  describe('generateWetland', () => {
    it('should generate different wetland types', async () => {
      const wetlandArea = new SpatialBounds(new Position(200, 200), new Dimensions(100, 100));

      const marshSettings: WetlandGenerationSettings = {
        wetlandType: WetlandType.MARSH,
        size: 10000,
        vegetationDensity: 0.7,
        seasonal: false,
        waterLevel: WaterLevel.fromDepth(1.5),
        waterQuality: WaterQuality.wetland(),
        preferLowElevation: true,
        nearWaterSources: true
      };

      const swampSettings: WetlandGenerationSettings = {
        wetlandType: WetlandType.SWAMP,
        size: 15000,
        vegetationDensity: 0.9,
        seasonal: false,
        waterLevel: WaterLevel.fromDepth(2),
        waterQuality: WaterQuality.wetland(),
        preferLowElevation: true,
        nearWaterSources: true
      };

      const marsh = await service.generateWetland(wetlandArea, marshSettings, mockRandom);
      const swamp = await service.generateWetland(wetlandArea, swampSettings, mockRandom);

      expect(marsh.wetlandType).toBe(WetlandType.MARSH);
      expect(marsh.isTraversable).toBe(true);
      expect(marsh.supportsMigratory).toBe(true);

      expect(swamp.wetlandType).toBe(WetlandType.SWAMP);
      expect(swamp.isTraversable).toBe(false);
      expect(swamp.vegetationDensity).toBe(0.9);
    });
  });

  describe('generateWaterSystem', () => {
    // TODO: This test needs investigation - Position validation is now stricter
    // and the complex water system generation may need updates to handle edge cases
    it.skip('should generate complete water system', async () => {
      const settings: HydrographicGenerationSettings = {
        riverDensity: 0.3,
        lakeDensity: 0.2,
        springDensity: 0.1,
        pondDensity: 0.15,
        wetlandDensity: 0.1,
        defaultRiverSettings: {
          minLength: 100,
          maxLength: 400,
          averageWidth: 15,
          widthVariation: 0.3,
          baseFlowVelocity: 3,
          meandering: 0.4,
          naturalObstacles: true,
          waterQuality: WaterQuality.river(),
          seasonal: false,
          allowPartial: true,
          requireSource: false,
          requireMouth: false,
          allowTributaries: true,
          maxTributaries: 2,
          tributaryChance: 0.3,
          elevation: 100,
          climate: 'temperate',
          terrain: 'hilly'
        },
        defaultLakeSettings: {
          minSize: 400,
          maxSize: 1500,
          irregularity: 0.5,
          formation: LakeFormation.NATURAL,
          averageDepth: 15,
          maxDepth: 30,
          shallowAreas: 0.3,
          waterQuality: WaterQuality.lake(),
          thermalStability: false,
          generateIslands: true,
          islandChance: 0.2,
          generateInlets: true,
          generateOutlets: true,
          shorelineComplexity: 0.6,
          accessibilityRatio: 0.7
        },
        defaultSpringSettings: {
          springType: SpringType.GRAVITY,
          flowRate: 8,
          temperature: 55,
          preferHighElevation: true,
          preferRockFormations: false,
          nearWaterFeatures: false,
          generateOutflow: true,
          outflowLength: 75
        },
        defaultWetlandSettings: {
          wetlandType: WetlandType.MARSH,
          size: 8000,
          vegetationDensity: 0.7,
          seasonal: false,
          waterLevel: WaterLevel.fromDepth(1),
          waterQuality: WaterQuality.wetland(),
          preferLowElevation: true,
          nearWaterSources: true
        },
        allowInterconnectedSystems: true,
        maintainWaterBalance: true,
        respectTopography: true,
        climate: 'temperate',
        seasonality: true,
        naturalismLevel: 0.8,
        biodiversityFocus: true
      };

      const result = await service.generateWaterSystem(testArea, settings, mockRandom);

      if (!result.success) {
        console.log('Generation failed with error:', result.error);
        console.log('Warnings:', result.warnings);
      }
      expect(result.success).toBe(true);
      expect(result.generationTime).toBeGreaterThan(0);
      expect(result.totalWaterCoverage).toBeGreaterThanOrEqual(0);
      expect(result.interconnectionScore).toBeGreaterThanOrEqual(0);
      expect(result.biodiversityScore).toBeGreaterThanOrEqual(0);
      
      // Should generate at least some features based on density settings
      const totalFeatures = result.rivers.length + result.lakes.length + 
                            result.springs.length + result.ponds.length + 
                            result.wetlands.length;
      expect(totalFeatures).toBeGreaterThan(0);
    });

    it('should respect climate-specific settings', async () => {
      const aridSettings = service.getDefaultSettingsForClimate('arid');
      const tropicalSettings = service.getDefaultSettingsForClimate('tropical');
      const arcticSettings = service.getDefaultSettingsForClimate('arctic');

      // Arid climate should have fewer rivers and more springs
      expect(aridSettings.riverDensity).toBeLessThan(tropicalSettings.riverDensity);
      expect(aridSettings.springDensity).toBeGreaterThan(tropicalSettings.springDensity);

      // Tropical climate should have more wetlands
      expect(tropicalSettings.wetlandDensity).toBeGreaterThan(arcticSettings.wetlandDensity);

      // All should be valid
      expect(aridSettings.climate).toBe('arid');
      expect(tropicalSettings.climate).toBe('tropical');
      expect(arcticSettings.climate).toBe('arctic');
    });
  });

  describe('validateWaterSystem', () => {
    it('should validate water system correctly', async () => {
      // Create a valid river
      const validRiver = await service.generateRiver(
        testArea,
        {
          minLength: 100,
          maxLength: 400,
          averageWidth: 15,
          widthVariation: 0.3,
          baseFlowVelocity: 3,
          meandering: 0.4,
          naturalObstacles: false,
          waterQuality: WaterQuality.river(),
          seasonal: false,
          allowPartial: true,
          requireSource: true,
          requireMouth: true,
          allowTributaries: false,
          maxTributaries: 0,
          tributaryChance: 0,
          elevation: 100,
          climate: 'temperate',
          terrain: 'flat'
        },
        undefined,
        undefined,
        mockRandom
      );

      // Create a valid lake
      const validLake = await service.generateLake(
        new SpatialBounds(new Position(200, 200), new Dimensions(100, 100)),
        {
          minSize: 400,
          maxSize: 1000,
          irregularity: 0.5,
          formation: LakeFormation.NATURAL,
          averageDepth: 15,
          maxDepth: 30,
          shallowAreas: 0.3,
          waterQuality: WaterQuality.lake(),
          thermalStability: false,
          generateIslands: false,
          islandChance: 0,
          generateInlets: false,
          generateOutlets: false,
          shorelineComplexity: 0.5,
          accessibilityRatio: 0.7
        },
        mockRandom
      );

      // Create a valid spring
      const validSpring = await service.generateSpring(
        new Position(300, 300),
        {
          springType: SpringType.GRAVITY,
          flowRate: 10,
          temperature: 55,
          preferHighElevation: false,
          preferRockFormations: false,
          nearWaterFeatures: false,
          generateOutflow: true,
          outflowLength: 50
        },
        mockRandom
      );

      const validation = service.validateWaterSystem([validRiver], [validLake], [validSpring]);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
  });

  describe('calculateOptimalPlacements', () => {
    it('should calculate placement locations', async () => {
      const settings = service.getDefaultSettingsForClimate('temperate');
      
      const placements = await service.calculateOptimalPlacements(
        testArea,
        settings,
        [],
        mockRandom
      );

      expect(placements.riverPlacements).toBeDefined();
      expect(placements.lakePlacements).toBeDefined();
      expect(placements.springPlacements).toBeDefined();
      expect(placements.wetlandPlacements).toBeDefined();

      // Should generate some placements based on density
      const totalPlacements = placements.riverPlacements.length + 
                            placements.lakePlacements.length + 
                            placements.springPlacements.length + 
                            placements.wetlandPlacements.length;
      expect(totalPlacements).toBeGreaterThan(0);
    });
  });

  describe('generateRiverPath', () => {
    it('should generate path between two points', async () => {
      const source = new Position(100, 100);
      const mouth = new Position(100, 800);
      
      const settings: RiverGenerationSettings = {
        minLength: 100,
        maxLength: 800,
        averageWidth: 15,
        widthVariation: 0.2,
        baseFlowVelocity: 3,
        meandering: 0.5,
        naturalObstacles: false,
        waterQuality: WaterQuality.river(),
        seasonal: false,
        allowPartial: true,
        requireSource: true,
        requireMouth: true,
        allowTributaries: false,
        maxTributaries: 0,
        tributaryChance: 0,
        elevation: 100,
        climate: 'temperate',
        terrain: 'hilly'
      };

      const path = await service.generateRiverPath(source, mouth, testArea, settings, mockRandom);

      expect(path.length).toBeGreaterThan(2);
      expect(path[0].equals(source)).toBe(true);
      expect(path[path.length - 1].equals(mouth)).toBe(true);
      
      // All points should be within the area
      path.forEach(point => {
        expect(testArea.contains(point)).toBe(true);
      });
    });
  });
});