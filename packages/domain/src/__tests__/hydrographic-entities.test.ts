import { describe, expect, it } from 'vitest';
import { FeatureId } from '../common/entities/MapFeature';
import { Dimensions } from '../common/value-objects/Dimensions';
import { SpatialBounds } from '../common/value-objects/SpatialBounds';
import { Position } from '../common/value-objects/Position';

import {
  Lake,
  LakeFormation,
  LakeSize,
  River,
  RiverPoint,
  RiverSegmentType,
  RiverWidth,
  Spring,
  SpringType,
  Wetland,
  WetlandType
} from '../contexts/natural/entities';

import {
  CardinalDirection,
  FlowDirection,
  WaterClarity,
  WaterLevel,
  WaterLevelType,
  WaterQuality,
  WaterSalinity,
  WaterTemperature
} from '../contexts/natural/value-objects';

describe('Hydrographic Entities', () => {
  describe('FlowDirection', () => {
    it('should create flow direction with angle and velocity', () => {
      const flow = new FlowDirection(90, 5); // East, velocity 5
      expect(flow.angle).toBe(90);
      expect(flow.velocity).toBe(5);
    });

    it('should create from cardinal direction', () => {
      const flow = FlowDirection.fromCardinal(CardinalDirection.NORTH, 3);
      expect(flow.angle).toBe(0);
      expect(flow.velocity).toBe(3);
      expect(flow.getCardinalDirection()).toBe(CardinalDirection.NORTH);
    });

    it('should calculate flow vector correctly', () => {
      const flow = new FlowDirection(90, 4); // East
      const vector = flow.getVector();
      expect(Math.abs(vector.x - 4)).toBeLessThan(0.001);
      expect(Math.abs(vector.y - 0)).toBeLessThan(0.001);
    });

    it('should reverse flow direction', () => {
      const flow = new FlowDirection(90, 3); // East
      const reversed = flow.reverse();
      expect(reversed.angle).toBe(270); // West
      expect(reversed.velocity).toBe(3);
    });

    it('should detect conflicting flows', () => {
      const eastFlow = new FlowDirection(90, 3);
      const westFlow = new FlowDirection(270, 3);
      expect(eastFlow.conflictsWith(westFlow)).toBe(true);
      
      const northFlow = new FlowDirection(0, 3);
      expect(eastFlow.conflictsWith(northFlow)).toBe(false);
    });

    it('should combine flow directions', () => {
      const eastFlow = new FlowDirection(90, 2);
      const northFlow = new FlowDirection(0, 2);
      const combined = eastFlow.combineWith(northFlow);
      
      // Should be northeast direction
      expect(combined.angle).toBeCloseTo(45, 1);
    });

    it('should validate angle and velocity ranges', () => {
      expect(() => new FlowDirection(360, 5)).not.toThrow();
      expect(() => new FlowDirection(-90, 5)).not.toThrow();
      expect(() => new FlowDirection(90, -1)).toThrow();
      expect(() => new FlowDirection(90, 11)).toThrow();
    });
  });

  describe('WaterLevel', () => {
    it('should create water level from depth', () => {
      const waterLevel = WaterLevel.fromDepth(5);
      expect(waterLevel.depth).toBe(5);
      expect(waterLevel.type).toBe(WaterLevelType.MODERATE);
    });

    it('should categorize water levels correctly', () => {
      expect(WaterLevel.fromDepth(0).type).toBe(WaterLevelType.DRY);
      expect(WaterLevel.fromDepth(2).type).toBe(WaterLevelType.SHALLOW);
      expect(WaterLevel.fromDepth(5).type).toBe(WaterLevelType.MODERATE);
      expect(WaterLevel.fromDepth(15).type).toBe(WaterLevelType.DEEP);
      expect(WaterLevel.fromDepth(60).type).toBe(WaterLevelType.VERY_DEEP);
    });

    it('should create seasonal water level', () => {
      const seasonal = WaterLevel.seasonal(5, 2, 8);
      expect(seasonal.seasonal).toBe(true);
      expect(seasonal.depth).toBe(5);
      expect(seasonal.minDepth).toBe(2);
      expect(seasonal.maxDepth).toBe(8);
    });

    it('should calculate seasonal depths', () => {
      const seasonal = WaterLevel.seasonal(5, 2, 8);
      const springDepth = seasonal.getSeasonalDepth('spring');
      const summerDepth = seasonal.getSeasonalDepth('summer');
      
      expect(springDepth).toBeGreaterThan(summerDepth);
      expect(springDepth).toBeGreaterThanOrEqual(seasonal.minDepth);
      expect(springDepth).toBeLessThanOrEqual(seasonal.maxDepth);
    });

    it('should determine navigability and wadeability', () => {
      const shallow = WaterLevel.fromDepth(2);
      const moderate = WaterLevel.fromDepth(5);
      
      expect(shallow.isWadeable).toBe(true);
      expect(shallow.isNavigable).toBe(false);
      expect(moderate.isWadeable).toBe(false);
      expect(moderate.isNavigable).toBe(true);
    });

    it('should calculate volume for given area', () => {
      const waterLevel = WaterLevel.fromDepth(3);
      const volume = waterLevel.calculateVolume(100); // 100 sq units
      expect(volume).toBe(300); // 100 * 3
    });
  });

  describe('WaterQuality', () => {
    it('should create predefined water quality types', () => {
      const pristine = WaterQuality.pristine();
      expect(pristine.clarity).toBe(WaterClarity.CRYSTAL_CLEAR);
      expect(pristine.pollution).toBe(0);
      expect(pristine.isPotable).toBe(true);

      const river = WaterQuality.river();
      expect(river.salinity).toBe(WaterSalinity.FRESH);
      expect(river.supportsFish).toBe(true);
    });

    it('should calculate environmental health score', () => {
      const pristine = WaterQuality.pristine();
      const polluted = pristine.degrade(5);
      
      expect(pristine.environmentalHealth).toBeGreaterThan(polluted.environmentalHealth);
      expect(pristine.environmentalHealth).toBeLessThanOrEqual(10);
      expect(polluted.environmentalHealth).toBeGreaterThanOrEqual(0);
    });

    it('should determine suitability for various uses', () => {
      const hotSpring = WaterQuality.hotSpring();
      expect(hotSpring.isPotable).toBe(false);
      expect(hotSpring.isSafeForSwimming).toBe(true);

      const wetland = WaterQuality.wetland();
      expect(wetland.supportsPlants).toBe(true);
    });
  });

  describe('River', () => {
    let testArea: SpatialBounds;
    let waterLevel: WaterLevel;
    let waterQuality: WaterQuality;

    beforeEach(() => {
      testArea = new SpatialBounds(new Position(0, 0), new Dimensions(100, 100));
      waterLevel = WaterLevel.fromDepth(3);
      waterQuality = WaterQuality.river();
    });

    it('should create a basic river', () => {
      const river = new River(
        FeatureId.generate(),
        'Test River',
        testArea,
        waterLevel,
        waterQuality,
        10 // 10 feet average width
      );

      expect(river.name).toBe('Test River');
      expect(river.averageWidth).toBe(10);
      expect(river.widthCategory).toBe(RiverWidth.CREEK); // 10 feet is a creek (10-25 feet)
    });

    it('should add and manage river points', () => {
      const river = new River(
        FeatureId.generate(),
        'Test River',
        testArea,
        waterLevel,
        waterQuality,
        10
      );

      const sourcePoint = new RiverPoint(
        new Position(10, 10),
        8,
        2,
        FlowDirection.fromCardinal(CardinalDirection.SOUTH, 3),
        RiverSegmentType.SOURCE
      );

      const mouthPoint = new RiverPoint(
        new Position(10, 80),
        12,
        4,
        FlowDirection.fromCardinal(CardinalDirection.SOUTH, 2),
        RiverSegmentType.MOUTH
      );

      river.addPathPoint(sourcePoint);
      river.addPathPoint(mouthPoint);

      expect(river.path.length).toBe(2);
      expect(river.source?.segmentType).toBe(RiverSegmentType.SOURCE);
      expect(river.mouth?.segmentType).toBe(RiverSegmentType.MOUTH);
      expect(river.length).toBeGreaterThan(0);
    });

    it('should categorize river width correctly', () => {
      const stream = new River(FeatureId.generate(), 'Stream', testArea, waterLevel, waterQuality, 8);
      const creek = new River(FeatureId.generate(), 'Creek', testArea, waterLevel, waterQuality, 20);
      const river = new River(FeatureId.generate(), 'River', testArea, waterLevel, waterQuality, 50);

      expect(stream.widthCategory).toBe(RiverWidth.STREAM);
      expect(creek.widthCategory).toBe(RiverWidth.CREEK);
      expect(river.widthCategory).toBe(RiverWidth.RIVER);
    });

    it('should determine crossability', () => {
      const shallowStream = new River(FeatureId.generate(), 'Shallow', testArea, WaterLevel.fromDepth(2), waterQuality, 15);
      const deepRiver = new River(FeatureId.generate(), 'Deep', testArea, WaterLevel.fromDepth(8), waterQuality, 50);

      expect(shallowStream.isCrossable).toBe(true);
      expect(deepRiver.isCrossable).toBe(false);
    });

    it('should manage tributaries', () => {
      const mainRiver = new River(FeatureId.generate(), 'Main', testArea, waterLevel, waterQuality, 20);
      const tributary = new River(
        FeatureId.generate(),
        'Tributary',
        new SpatialBounds(new Position(20, 20), new Dimensions(50, 50)),
        waterLevel,
        waterQuality,
        10
      );

      // Add some points to make confluence work
      mainRiver.addPathPoint(new RiverPoint(
        new Position(25, 25),
        20,
        3,
        FlowDirection.fromCardinal(CardinalDirection.SOUTH, 3),
        RiverSegmentType.STRAIGHT
      ));

      mainRiver.addTributary(tributary);
      expect(mainRiver.tributaries.length).toBe(1);
      expect(mainRiver.tributaries[0]).toBe(tributary);
    });

    it('should check position containment', () => {
      const river = new River(FeatureId.generate(), 'Test', testArea, waterLevel, waterQuality, 10);
      
      river.addPathPoint(new RiverPoint(
        new Position(50, 20),
        10,
        3,
        FlowDirection.fromCardinal(CardinalDirection.SOUTH, 3)
      ));
      
      river.addPathPoint(new RiverPoint(
        new Position(50, 80),
        10,
        3,
        FlowDirection.fromCardinal(CardinalDirection.SOUTH, 3)
      ));

      expect(river.containsPosition(new Position(50, 50))).toBe(true);
      expect(river.containsPosition(new Position(10, 10))).toBe(false);
    });
  });

  describe('Lake', () => {
    let testArea: SpatialBounds;
    let waterLevel: WaterLevel;
    let waterQuality: WaterQuality;

    beforeEach(() => {
      testArea = new SpatialBounds(new Position(0, 0), new Dimensions(100, 100));
      waterLevel = WaterLevel.fromDepth(10);
      waterQuality = WaterQuality.lake();
    });

    it('should create a basic lake', () => {
      const lake = new Lake(
        FeatureId.generate(),
        'Test Lake',
        testArea,
        waterLevel,
        waterQuality,
        LakeFormation.NATURAL,
        [],
        15,
        10
      );

      expect(lake.name).toBe('Test Lake');
      expect(lake.maxDepth).toBe(15);
      expect(lake.averageDepth).toBe(10);
      expect(lake.formation).toBe(LakeFormation.NATURAL);
    });

    it('should categorize lake size correctly', () => {
      const smallArea = new SpatialBounds(new Position(0, 0), new Dimensions(20, 20));
      const largeArea = new SpatialBounds(new Position(0, 0), new Dimensions(200, 200));

      const smallLake = new Lake(FeatureId.generate(), 'Small', smallArea, waterLevel, waterQuality, LakeFormation.NATURAL);
      const largeLake = new Lake(FeatureId.generate(), 'Large', largeArea, waterLevel, waterQuality, LakeFormation.NATURAL);

      expect(smallLake.sizeCategory).toBe(LakeSize.POND);
      expect(largeLake.sizeCategory).toBeOneOf([LakeSize.MEDIUM_LAKE, LakeSize.LARGE_LAKE, LakeSize.GREAT_LAKE]);
    });

    it('should manage islands', () => {
      const lake = new Lake(FeatureId.generate(), 'Test', testArea, waterLevel, waterQuality, LakeFormation.NATURAL);
      
      const islandPos = new Position(50, 50);
      lake.addIsland(islandPos);
      
      expect(lake.hasIslands).toBe(true);
      expect(lake.islands.length).toBe(1);
      expect(lake.islands[0].equals(islandPos)).toBe(true);
    });

    it('should manage inlets and outlets', () => {
      const lake = new Lake(FeatureId.generate(), 'Test', testArea, waterLevel, waterQuality, LakeFormation.NATURAL);
      
      lake.addInlet(new Position(10, 50));
      lake.addOutlet(new Position(90, 50));
      
      expect(lake.hasInflow).toBe(true);
      expect(lake.hasOutflow).toBe(true);
      expect(lake.inlets.length).toBe(1);
      expect(lake.outlets.length).toBe(1);
    });

    it('should calculate depth at position', () => {
      const lake = new Lake(FeatureId.generate(), 'Test', testArea, waterLevel, waterQuality, LakeFormation.NATURAL, [], 20, 15);
      
      const centerDepth = lake.getDepthAt(new Position(50, 50));
      const edgeDepth = lake.getDepthAt(new Position(5, 5));
      
      expect(centerDepth).toBeGreaterThan(edgeDepth);
      expect(centerDepth).toBeLessThanOrEqual(20);
      expect(edgeDepth).toBeGreaterThanOrEqual(0);
    });

    it('should determine navigability and freezing potential', () => {
      const deepLake = new Lake(FeatureId.generate(), 'Deep', testArea, WaterLevel.fromDepth(15), waterQuality, LakeFormation.NATURAL);
      const freezingWaterQuality = new WaterQuality(
        WaterClarity.CLEAR,
        WaterTemperature.FREEZING,
        WaterSalinity.FRESH
      );
      const shallowPond = new Lake(
        FeatureId.generate(),
        'Shallow',
        new SpatialBounds(new Position(0, 0), new Dimensions(20, 20)),
        WaterLevel.fromDepth(2),
        freezingWaterQuality,
        LakeFormation.NATURAL
      );

      expect(deepLake.isNavigable).toBe(true);
      expect(shallowPond.isNavigable).toBe(false);
      expect(shallowPond.canFreeze).toBe(true);
    });

    it('should generate natural shoreline', () => {
      const lake = new Lake(FeatureId.generate(), 'Test', testArea, waterLevel, waterQuality, LakeFormation.NATURAL);
      
      lake.generateNaturalShoreline(12);
      
      expect(lake.shoreline.length).toBe(12);
      expect(lake.shorelineLength).toBeGreaterThan(0);
    });
  });

  describe('Spring', () => {
    it('should create different types of springs', () => {
      const artesian = new Spring(
        FeatureId.generate(),
        'Artesian Spring',
        new SpatialBounds(new Position(0, 0), new Dimensions(10, 10)),
        SpringType.ARTESIAN,
        WaterQuality.pristine(),
        10, // 10 GPM
        60, // 60°F
        FlowDirection.fromCardinal(CardinalDirection.SOUTH, 2)
      );

      const hotSpring = new Spring(
        FeatureId.generate(),
        'Hot Spring',
        new SpatialBounds(new Position(0, 0), new Dimensions(10, 10)),
        SpringType.THERMAL,
        WaterQuality.hotSpring(),
        5,
        180, // 180°F
        FlowDirection.fromCardinal(CardinalDirection.SOUTH, 1)
      );

      expect(artesian.springType).toBe(SpringType.ARTESIAN);
      expect(artesian.isHotSpring).toBe(false);
      expect(artesian.isPotable).toBe(true);
      
      expect(hotSpring.isHotSpring).toBe(true);
      expect(hotSpring.isPotable).toBe(false);
    });

    it('should calculate daily water output', () => {
      const spring = new Spring(
        FeatureId.generate(),
        'Test Spring',
        new SpatialBounds(new Position(0, 0), new Dimensions(10, 10)),
        SpringType.GRAVITY,
        WaterQuality.pristine(),
        10, // 10 GPM
        55,
        FlowDirection.fromCardinal(CardinalDirection.SOUTH, 2)
      );

      const dailyOutput = spring.dailyOutput;
      expect(dailyOutput).toBe(10 * 60 * 24); // 10 GPM * 60 minutes * 24 hours
    });

    it('should determine if spring can supply settlement', () => {
      const largeSpring = new Spring(
        FeatureId.generate(),
        'Large Spring',
        new SpatialBounds(new Position(0, 0), new Dimensions(10, 10)),
        SpringType.ARTESIAN,
        WaterQuality.pristine(),
        100, // 100 GPM
        55,
        FlowDirection.fromCardinal(CardinalDirection.SOUTH, 3)
      );

      const smallSpring = new Spring(
        FeatureId.generate(),
        'Small Spring',
        new SpatialBounds(new Position(0, 0), new Dimensions(10, 10)),
        SpringType.SEASONAL,
        WaterQuality.pristine(),
        1, // 1 GPM
        55,
        FlowDirection.fromCardinal(CardinalDirection.SOUTH, 1)
      );

      expect(largeSpring.canSupplySettlement(100)).toBe(true); // 100 people
      expect(smallSpring.canSupplySettlement(100)).toBe(false);
    });
  });

  describe('Wetland', () => {
    it('should create different wetland types', () => {
      const marsh = new Wetland(
        FeatureId.generate(),
        'Test Marsh',
        new SpatialBounds(new Position(0, 0), new Dimensions(50, 50)),
        WetlandType.MARSH,
        WaterLevel.fromDepth(1), // depth < 2
        WaterQuality.wetland(),
        0.7 // vegetation density < 0.8
      );

      const swamp = new Wetland(
        FeatureId.generate(),
        'Test Swamp',
        new SpatialBounds(new Position(0, 0), new Dimensions(100, 100)),
        WetlandType.SWAMP,
        WaterLevel.fromDepth(2),
        WaterQuality.wetland(),
        0.9
      );

      expect(marsh.wetlandType).toBe(WetlandType.MARSH);
      expect(marsh.isTraversable).toBe(true); // Should be true now: density < 0.8 && depth < 2
      expect(swamp.wetlandType).toBe(WetlandType.SWAMP);
      expect(swamp.isTraversable).toBe(false);
    });

    it('should calculate biodiversity score', () => {
      const healthyWetland = new Wetland(
        FeatureId.generate(),
        'Healthy Wetland',
        new SpatialBounds(new Position(0, 0), new Dimensions(50, 50)),
        WetlandType.FEN,
        WaterLevel.fromDepth(1.5),
        WaterQuality.pristine(),
        0.7,
        true // seasonal
      );

      expect(healthyWetland.biodiversityScore).toBeGreaterThanOrEqual(7);
      expect(healthyWetland.biodiversityScore).toBeLessThanOrEqual(10);
    });

    it('should support migratory species', () => {
      const marsh = new Wetland(
        FeatureId.generate(),
        'Migration Marsh',
        new SpatialBounds(new Position(0, 0), new Dimensions(50, 50)),
        WetlandType.MARSH,
        WaterLevel.fromDepth(1),
        WaterQuality.wetland(),
        0.6
      );

      const bog = new Wetland(
        FeatureId.generate(),
        'Test Bog',
        new SpatialBounds(new Position(0, 0), new Dimensions(30, 30)),
        WetlandType.BOG,
        WaterLevel.fromDepth(0.5),
        WaterQuality.wetland(),
        0.9
      );

      expect(marsh.supportsMigratory).toBe(true);
      expect(bog.supportsMigratory).toBe(false);
    });

    it('should generate nesting areas', () => {
      const wetland = new Wetland(
        FeatureId.generate(),
        'Nesting Wetland',
        new SpatialBounds(new Position(0, 0), new Dimensions(60, 60)),
        WetlandType.PRAIRIE_POTHOLE,
        WaterLevel.fromDepth(1),
        WaterQuality.wetland(),
        0.7
      );

      const nestingAreas = wetland.getNestingAreas();
      
      if (wetland.supportsMigratory) {
        expect(nestingAreas.length).toBeGreaterThan(0);
        nestingAreas.forEach(area => {
          expect(wetland.area.contains(area)).toBe(true);
        });
      }
    });
  });
});