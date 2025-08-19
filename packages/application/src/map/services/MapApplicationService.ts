import { 
  GenerateMapUseCase, 
  ValidateMapSettingsUseCase,
  GetMapUseCase,
  GetMapTileUseCase,
  ListMapsUseCase
} from '../use-cases';
import { 
  GenerateMapCommand, 
  MapGenerationResult,
  ValidationResult,
  GetMapQuery,
  GetMapTileQuery,
  ListMapsQuery,
  MapQueryResult
} from '../ports/input';
import { GridMap, MapTile, MapMetadata } from '@lazy-map/domain';

/**
 * Application service for map-related operations
 * Coordinates use cases and provides a clean interface for external systems
 */
export class MapApplicationService {
  constructor(
    private readonly generateMapUseCase: GenerateMapUseCase,
    private readonly validateMapSettingsUseCase: ValidateMapSettingsUseCase,
    private readonly getMapUseCase: GetMapUseCase,
    private readonly getMapTileUseCase: GetMapTileUseCase,
    private readonly listMapsUseCase: ListMapsUseCase
  ) {}

  /**
   * Generate a new map based on provided settings
   */
  async generateMap(command: GenerateMapCommand): Promise<MapGenerationResult> {
    return await this.generateMapUseCase.execute(command);
  }

  /**
   * Validate map generation settings without generating the map
   */
  async validateMapSettings(command: GenerateMapCommand): Promise<ValidationResult> {
    return await this.validateMapSettingsUseCase.execute(command);
  }

  /**
   * Retrieve a map by its ID
   */
  async getMap(query: GetMapQuery): Promise<MapQueryResult<GridMap | null>> {
    return await this.getMapUseCase.execute(query);
  }

  /**
   * Get a specific tile from a map
   */
  async getMapTile(query: GetMapTileQuery): Promise<MapQueryResult<MapTile | null>> {
    return await this.getMapTileUseCase.execute(query);
  }

  /**
   * List maps with optional filtering and pagination
   */
  async listMaps(query: ListMapsQuery): Promise<MapQueryResult<MapMetadata[]>> {
    return await this.listMapsUseCase.execute(query);
  }

  /**
   * Get default map generation settings
   */
  getDefaultMapSettings(): GenerateMapCommand {
    return {
      name: 'New Map',
      description: '',
      width: 100,
      height: 100,
      cellSize: 32,
      seed: Math.floor(Math.random() * 1000000),
      tags: [],
      author: 'Anonymous',
      terrainDistribution: {
        grassland: 0.4,
        forest: 0.3,
        mountain: 0.2,
        water: 0.1
      },
      elevationVariance: 0.3,
      elevationMultiplier: 1.0,
      addHeightNoise: false,
      heightVariance: 0.2,
      inclinationChance: 0.3,
      generateRivers: false,
      generateRoads: false,
      generateBuildings: false,
      generateForests: true,
      forestSettings: {
        forestDensity: 0.3,
        treeDensity: 0.6,
        treeClumping: 0.7,
        preferredSpecies: ['oak', 'pine'],
        allowTreeOverlap: true,
        enableInosculation: true,
        underbrushDensity: 0.4
      },
      biomeType: 'temperate'
    };
  }
}