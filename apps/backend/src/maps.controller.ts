import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiResponse as ApiResponseType } from '@lazy-map/core';
import { GridMap, MapId } from '@lazy-map/domain';
import { GenerateMapCommand, MapGenerationResult } from '@lazy-map/application';
import { MapApplicationService } from '@lazy-map/application';
import { GenerateMapDto } from './dto';

@ApiTags('maps')
@Controller('maps')
export class MapsController {
  constructor(private readonly mapApplicationService: MapApplicationService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new battlemap' })
  @ApiResponse({ status: 201, description: 'Map generated successfully' })
  async generateMap(@Body() dto: GenerateMapDto): Promise<ApiResponseType<GridMap>> {
    try {
      // Convert DTO to command
      const command = new GenerateMapCommand({
        name: dto.name || 'New Map',
        description: dto.description || '',
        width: dto.width || dto.dimensions?.width || 100,
        height: dto.height || dto.dimensions?.height || 100,
        cellSize: dto.cellSize || 32,
        seed: dto.seed || Math.floor(Math.random() * 1000000),
        tags: dto.tags || [],
        author: dto.author || 'Anonymous',
        terrainDistribution: dto.terrainDistribution || {
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
        biomeType: dto.biomeType || 'temperate'
      });
      
      // Execute use case via application service
      const result: MapGenerationResult = await this.mapApplicationService.generateMap(command);
      
      return {
        success: result.success,
        data: result.map,
        message: 'Map generated successfully',
        warnings: result.warnings,
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
  async getMap(@Param('id') id: string): Promise<ApiResponseType<GridMap>> {
    try {
      const mapId = new MapId(id);
      const result = await this.mapApplicationService.getMap(mapId);
      
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
