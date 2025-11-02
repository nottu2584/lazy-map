import { Controller, Post, Body, Get, Param, UseGuards, Request, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponse as ApiResponseType } from '@lazy-map/application';
import { MapGrid, ILogger, Dimensions, Seed } from '@lazy-map/domain';
import {
  GetMapQuery,
  GenerateTacticalMapUseCase,
  GenerateTacticalMapCommand,
  GetMapUseCase,
  GetUserMapsUseCase,
  GetUserMapsQuery,
  ValidateSeedUseCase,
  ValidateSeedCommand,
  ValidateSeedResult
} from '@lazy-map/application';
import { GenerateMapDto, ValidateSeedDto } from './dto';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LOGGER_TOKEN } from '@lazy-map/infrastructure';

@ApiTags('maps')
@Controller('maps')
export class MapsController {

  constructor(
    @Inject('GenerateTacticalMapUseCase')
    private readonly generateTacticalMapUseCase: GenerateTacticalMapUseCase,
    @Inject('GetMapUseCase')
    private readonly getMapUseCase: GetMapUseCase,
    @Inject('GetUserMapsUseCase')
    private readonly getUserMapsUseCase: GetUserMapsUseCase,
    @Inject('ValidateSeedUseCase')
    private readonly validateSeedUseCase: ValidateSeedUseCase,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
  ) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a new tactical battlemap' })
  @ApiResponse({ status: 201, description: 'Tactical map generated successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async generateMap(@Body() dto: GenerateMapDto, @Request() req: any): Promise<ApiResponseType<any>> {
    const operationLogger = this.logger.child({
      component: 'MapsController',
      operation: 'generateMap',
      userId: req.user.userId
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

      // Convert DTO to tactical map command
      const width = dto.width || dto.dimensions?.width || 50;
      const height = dto.height || dto.dimensions?.height || 50;
      const seedValue = dto.seed || Math.floor(Math.random() * 1000000).toString();

      const command: GenerateTacticalMapCommand = {
        dimensions: new Dimensions(width, height),
        seed: typeof seedValue === 'string' ? Seed.fromString(seedValue) : Seed.fromNumber(seedValue)
        // context is generated from seed if not provided
      };

      // Execute tactical map generation
      const startTime = Date.now();
      const result = await this.generateTacticalMapUseCase.execute(command);
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

  @Get('my-maps')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user\'s map history' })
  @ApiResponse({ status: 200, description: 'Map history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async getMyMaps(@Request() req: any): Promise<ApiResponseType<MapGrid[]>> {
    try {
      const query = new GetUserMapsQuery(req.user.userId);
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
