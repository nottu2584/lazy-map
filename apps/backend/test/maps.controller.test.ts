import { Test } from '@nestjs/testing';
import { MapsController } from '../src/maps.controller';
import { MapApplicationService } from '@lazy-map/application';
import { GenerateMapDto } from '../src/dto';
import { MapGrid, MapId, Position, Dimensions, TerrainType, MapTile, MapMetadata } from '@lazy-map/domain';

describe('MapsController', () => {
  let mapsController: MapsController;
  let mapApplicationService: MapApplicationService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MapsController],
      providers: [
        {
          provide: MapApplicationService,
          useValue: {
            generateMap: jest.fn(),
            getMap: jest.fn(),
          },
        },
      ],
    }).compile();

    mapsController = moduleRef.get<MapsController>(MapsController);
    mapApplicationService = moduleRef.get<MapApplicationService>(MapApplicationService);
  });

  describe('generateMap', () => {
    it('should call application service and return response', async () => {
      // Arrange
      const dto: GenerateMapDto = {
        dimensions: { width: 10, height: 10 },
        cellSize: 32,
        seed: 12345,
      };
      
      const mockMapId = new MapId('map_123');
      const mockDimensions = new Dimensions(10, 10);
      const mockTiles = Array.from({ length: 10 }).map((_, y) =>
        Array.from({ length: 10 }).map((_, x) => 
          new MapTile(new Position(x, y), TerrainType.GRASSLAND, 1.0, 1.0, false)
        )
      );
      
      const mockMap = new MapGrid(
        mockMapId,
        'Test Map',
        mockDimensions,
        32,
        mockTiles,
        new MapMetadata(new Date(), new Date(), 'Test', 'Test', [])
      );
      
      const mockResult = { 
        success: true, 
        map: mockMap, 
        warnings: [],
      };
      
      jest.spyOn(mapApplicationService, 'generateMap').mockResolvedValue(mockResult);
      
      // Act
      const result = await mapsController.generateMap(dto);
      
      // Assert
      expect(mapApplicationService.generateMap).toHaveBeenCalled();
      expect(result.success).toBeTruthy();
      expect(result.data).toBe(mockMap);
    });
    
    it('should handle errors and return failure response', async () => {
      // Arrange
      const dto: GenerateMapDto = {
        dimensions: { width: 10, height: 10 },
      };
      
      const errorMessage = 'Failed to generate map';
      jest.spyOn(mapApplicationService, 'generateMap').mockRejectedValue(new Error(errorMessage));
      
      // Act
      const result = await mapsController.generateMap(dto);
      
      // Assert
      expect(result.success).toBeFalsy();
      expect(result.error).toContain(errorMessage);
    });
  });

  describe('getMap', () => {
    it('should return a map when it exists', async () => {
      // Arrange
      const mockMapId = new MapId('map_123');
      const mockDimensions = new Dimensions(10, 10);
      const mockTiles = Array.from({ length: 10 }).map((_, y) =>
        Array.from({ length: 10 }).map((_, x) => 
          new MapTile(new Position(x, y), TerrainType.GRASSLAND, 1.0, 1.0, false)
        )
      );
      
      const mockMap = new MapGrid(
        mockMapId,
        'Test Map',
        mockDimensions,
        32,
        mockTiles,
        new MapMetadata(new Date(), new Date(), 'Test', 'Test', [])
      );
      
      const mockResult = { 
        success: true, 
        data: mockMap,
      };
      
      jest.spyOn(mapApplicationService, 'getMap').mockResolvedValue(mockResult);
      
      // Act
      const result = await mapsController.getMap('map_123');
      
      // Assert
      expect(result.success).toBeTruthy();
      expect(result.data).toBe(mockMap);
    });
    
    it('should return failure when map does not exist', async () => {
      // Arrange
      const mockResult = { 
        success: false, 
        data: null,
        error: 'Map not found'
      };
      
      jest.spyOn(mapApplicationService, 'getMap').mockResolvedValue(mockResult);
      
      // Act
      const result = await mapsController.getMap('non_existent_map');
      
      // Assert
      expect(result.success).toBeFalsy();
      expect(result.error).toContain('Map not found');
    });
  });
});