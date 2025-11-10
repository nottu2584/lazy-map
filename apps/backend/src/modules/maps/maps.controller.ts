import { ApiResponse as ApiResponseType, GenerateTacticalMapUseCase, GetMapQuery, GetMapUseCase, GetUserMapsQuery, GetUserMapsUseCase, SaveMapCommand, SaveMapUseCase, ValidateSeedResult, ValidateSeedUseCase } from '@lazy-map/application';
import {
  Dimensions,
  ILogger,
  MapGrid,
  MapId,
  MapMetadata,
  MapTile,
  Position,
  Seed,
  TacticalMapContext,
  Terrain,
  UserId
} from '@lazy-map/domain';
import { LOGGER_TOKEN } from '@lazy-map/infrastructure';
import { Body, Controller, Get, Inject, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateMapDto, SaveMapDto, SaveMapResponseDto, ValidateSeedDto } from './dto';

@ApiTags('maps')
@Controller('maps')
export class MapsController {

  constructor(
    @Inject(GenerateTacticalMapUseCase)
    private readonly generateTacticalMapUseCase: GenerateTacticalMapUseCase,
    @Inject(GetMapUseCase)
    private readonly getMapUseCase: GetMapUseCase,
    @Inject(GetUserMapsUseCase)
    private readonly getUserMapsUseCase: GetUserMapsUseCase,
    @Inject(SaveMapUseCase)
    private readonly saveMapUseCase: SaveMapUseCase,
    @Inject(ValidateSeedUseCase)
    private readonly validateSeedUseCase: ValidateSeedUseCase,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new tactical battlemap' })
  @ApiResponse({ status: 201, description: 'Tactical map generated successfully' })
  async generateMap(@Body() dto: GenerateMapDto, @Request() req: any): Promise<ApiResponseType<any>> {
    const operationLogger = this.logger.child({
      component: 'MapsController',
      operation: 'generateMap',
      userId: req.user?.userId || 'anonymous'
    });

    try {
      operationLogger.info('Tactical map generation request received', {
        metadata: {
          mapName: dto.name || 'New Map',
          dimensions: {
            width: dto.width || dto.dimensions?.width || 50,
            height: dto.height || dto.dimensions?.height || 50
          },
          seed: dto.seed || 'random'
        }
      });

      // Convert DTO to parameters
      const width = dto.width || dto.dimensions?.width || 50;
      const height = dto.height || dto.dimensions?.height || 50;
      const seedValue = dto.seed || Math.floor(Math.random() * 1000000).toString();
      const seed = typeof seedValue === 'string' ? Seed.fromString(seedValue) : Seed.fromNumber(seedValue);

      // Generate context from seed
      const context = TacticalMapContext.fromSeed(seed);

      // Execute tactical map generation
      const startTime = Date.now();
      const result = await this.generateTacticalMapUseCase.execute(width, height, context, seed);
      const duration = Date.now() - startTime;

      operationLogger.info('Tactical map generation completed successfully', {
        metadata: {
          width: result.width,
          height: result.height,
          context: result.context?.getDescription(),
          duration
        }
      });

      return {
        success: true,
        data: {
          map: result,
          width: result.width,
          height: result.height,
          context: result.context?.getDescription(),
          totalTime: duration
        },
        message: `Tactical map generated successfully in ${duration}ms`
      };
    } catch (error) {
      operationLogger.logError(error, {
        metadata: {
          mapName: dto.name,
          dimensions: dto.dimensions,
          seed: dto.seed
        }
      });

      return {
        success: false,
        error: error.message || 'Failed to generate map',
      };
    }
  }

  @Post('save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save a generated map for future retrieval' })
  @ApiResponse({ status: 201, description: 'Map saved successfully', type: SaveMapResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 400, description: 'Invalid map data' })
  async saveMap(
    @Body() dto: SaveMapDto,
    @Request() req: any
  ): Promise<ApiResponseType<SaveMapResponseDto>> {
    const operationLogger = this.logger.child({
      component: 'MapsController',
      operation: 'saveMap',
      entityId: dto.id
    });

    try {
      operationLogger.debug('Saving map', {
        metadata: {
          mapId: dto.id,
          userId: req.user?.id || req.user?.userId,
          name: dto.name
        }
      });

      // Create domain objects
      const mapId = new MapId(dto.id);
      const dimensions = new Dimensions(dto.width, dto.height);
      const metadata = new MapMetadata(
        new Date(),
        new Date(),
        req.user?.username || req.user?.email,
        dto.description
      );
      const userId = req.user?.id || req.user?.userId || req.user?.sub;
      const ownerId = userId ? UserId.fromString(userId) : undefined;

      // Convert tile DTOs to MapTile entities
      const tiles: MapTile[][] = [];
      for (let y = 0; y < dto.height; y++) {
        tiles[y] = [];
        for (let x = 0; x < dto.width; x++) {
          const tileDto = dto.tiles.find(t => t.x === x && t.y === y);
          if (tileDto) {
            // Create terrain object - for now just use grass as default
            // TODO: Create proper terrain mapping from string to Terrain objects
            const terrain = Terrain.grass();
            tiles[y][x] = new MapTile(
              new Position(x, y),
              terrain,
              tileDto.elevation || 1.0
            );
          } else {
            tiles[y][x] = new MapTile(new Position(x, y));
          }
        }
      }

      // Create the MapGrid entity
      const mapGrid = new MapGrid(
        mapId,
        dto.name || 'Untitled Map',
        dimensions,
        5, // Default cell size for tactical maps
        tiles,
        metadata,
        ownerId
      );

      // Create save command
      const command: SaveMapCommand = {
        map: mapGrid,
        userId: req.user?.id || req.user?.userId || req.user?.sub,
        name: dto.name,
        description: dto.description
      };

      // Execute save
      const result = await this.saveMapUseCase.execute(command);

      if (result.success) {
        operationLogger.info('Map saved successfully', {
          metadata: {
            mapId: result.mapId,
            userId: command.userId
          }
        });

        return {
          success: true,
          data: {
            success: true,
            mapId: result.mapId,
            message: 'Map saved successfully'
          }
        };
      } else {
        operationLogger.warn('Failed to save map', {
          metadata: {
            error: result.error,
            userId: command.userId
          }
        });

        return {
          success: false,
          error: result.error || 'Failed to save map'
        };
      }
    } catch (error) {
      operationLogger.logError(error, {
        metadata: {
          mapId: dto.id,
          userId: req.user?.id
        }
      });

      return {
        success: false,
        error: error.message || 'Failed to save map'
      };
    }
  }

  @Get('my-maps')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user\'s map history' })
  @ApiResponse({ status: 200, description: 'Map history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async getMyMaps(@Request() req: any): Promise<ApiResponseType<MapGrid[]>> {
    try {
      const userId = req.user?.id || req.user?.userId || req.user?.sub;
      if (!userId) {
        return {
          success: false,
          error: 'User ID not found in token'
        };
      }
      const query = new GetUserMapsQuery(userId);
      const result = await this.getUserMapsUseCase.execute(query);

      return {
        success: result.success,
        data: result.data,
        message: result.success ? 'Maps retrieved successfully' : undefined,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get user maps',
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a map by ID' })
  @ApiResponse({ status: 200, description: 'Map found' })
  @ApiResponse({ status: 404, description: 'Map not found' })
  async getMap(@Param('id') id: string): Promise<ApiResponseType<MapGrid>> {
    const operationLogger = this.logger.child({
      component: 'MapsController',
      operation: 'getMap',
      entityId: id
    });

    try {
      operationLogger.debug('Retrieving map by ID', {
        metadata: { mapId: id }
      });

      const query: GetMapQuery = { mapId: id };
      const result = await this.getMapUseCase.execute(query);
      
      if (!result.success || !result.data) {
        operationLogger.warn('Map not found', {
          metadata: { 
            mapId: id,
            error: result.error 
          }
        });
        return {
          success: false,
          error: result.error || 'Map not found',
        };
      }
      
      operationLogger.debug('Map retrieved successfully', {
        metadata: { mapId: id }
      });

      return {
        success: true,
        data: result.data,
        message: 'Map found',
      };
    } catch (error) {
      operationLogger.logError(error, {
        metadata: { mapId: id }
      });

      return {
        success: false,
        error: error.message || 'Failed to get map',
      };
    }
  }

  @Post('seeds/validate')
  @ApiOperation({ summary: 'Validate a seed value for map generation' })
  @ApiResponse({ status: 200, description: 'Seed validation result' })
  async validateSeed(@Body() dto: ValidateSeedDto): Promise<ApiResponseType<ValidateSeedResult>> {
    try {
      const result = this.validateSeedUseCase.execute(dto.seed);

      return {
        success: true,
        data: result,
        message: result.valid ? 'Seed is valid' : 'Seed validation failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to validate seed',
      };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for maps service' })
  healthCheck(): ApiResponseType<string> {
    return {
      success: true,
      data: 'Maps service is running',
      message: 'OK',
    };
  }
}
