import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponse as ApiResponseType } from '@lazy-map/application';
import { MapGrid } from '@lazy-map/domain';
import { GenerateMapCommand, MapGenerationResult, GetMapQuery } from '@lazy-map/application';
import { MapService } from '@lazy-map/application';
import { GenerateMapDto } from './dto';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@ApiTags('maps')
@Controller('maps')
export class MapsController {
  constructor(private readonly mapService: MapService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a new battlemap' })
  @ApiResponse({ status: 201, description: 'Map generated successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async generateMap(@Body() dto: GenerateMapDto, @Request() req: any): Promise<ApiResponseType<MapGrid>> {
    try {
      // Convert DTO to command
      const command: GenerateMapCommand = {
        name: dto.name || 'New Map',
        description: dto.description || '',
        width: dto.width || dto.dimensions?.width || 100,
        height: dto.height || dto.dimensions?.height || 100,
        cellSize: dto.cellSize || 32,
        seed: dto.seed || Math.floor(Math.random() * 1000000),
        tags: dto.tags || [],
        author: dto.author || req.user.email || 'Anonymous',
        userId: req.user.userId,
        terrainDistribution: (dto.terrainDistribution as any) || {
          grassland: 0.4,
          forest: 0.3,
          mountain: 0.2,
          water: 0.1
        },
        elevationVariance: dto.elevationVariance ?? 0.3,
        elevationMultiplier: dto.elevationMultiplier ?? 1.0,
        addHeightNoise: dto.addHeightNoise ?? false,
        heightVariance: dto.heightVariance ?? 0.2,
        inclinationChance: dto.inclinationChance ?? 0.3,
        generateRivers: dto.generateRivers ?? false,
        generateRoads: dto.generateRoads ?? false,
        generateBuildings: dto.generateBuildings ?? false,
        generateForests: dto.generateForests ?? true,
        forestSettings: dto.forestSettings || {
          forestDensity: 0.3,
          treeDensity: 0.6,
          treeClumping: 0.7,
          preferredSpecies: ['oak', 'pine'],
          allowTreeOverlap: true,
          enableInosculation: true,
          underbrushDensity: 0.4
        },
        biomeType: (dto.biomeType as any) || 'temperate'
      };
      
      // Execute use case via application service
      const result: MapGenerationResult = await this.mapService.generateMap(command);
      
      return {
        success: result.success,
        data: result.map,
        message: 'Map generated successfully'
      };
    } catch (error) {
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
    try {
      const query: GetMapQuery = { mapId: id };
      const result = await this.mapService.getMap(query);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Map not found',
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Map found',
      };
    } catch (error) {
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
      const result = await this.mapService.getUserMaps(req.user.userId);
      
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
