import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  ApiResponse as ApiResponseType,
  GetAllFeaturesUseCase,
  GetFeatureByIdUseCase,
  GetFeatureStatisticsUseCase,
  ClearAllFeaturesUseCase,
  FeatureContext,
} from '@lazy-map/application';
import { MapFeature, FeatureId } from '@lazy-map/domain';

@ApiTags('features')
@Controller('features')
export class FeaturesController {
  constructor(
    @Inject('GetAllFeaturesUseCase')
    private readonly getAllFeaturesUseCase: GetAllFeaturesUseCase,
    @Inject('GetFeatureByIdUseCase')
    private readonly getFeatureByIdUseCase: GetFeatureByIdUseCase,
    @Inject('GetFeatureStatisticsUseCase')
    private readonly getFeatureStatisticsUseCase: GetFeatureStatisticsUseCase,
    @Inject('ClearAllFeaturesUseCase')
    private readonly clearAllFeaturesUseCase: ClearAllFeaturesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all map features' })
  @ApiResponse({ status: 200, description: 'Features retrieved successfully' })
  @ApiQuery({ name: 'context', required: false, enum: ['relief', 'natural', 'artificial', 'cultural'] })
  async getAllFeatures(@Query('context') context?: string): Promise<ApiResponseType<MapFeature[]>> {
    try {
      if (context && !['relief', 'natural', 'artificial', 'cultural'].includes(context)) {
        return {
          success: false,
          error: 'Invalid context. Must be one of: relief, natural, artificial, cultural',
        };
      }

      const features = await this.getAllFeaturesUseCase.execute(context as FeatureContext);

      return {
        success: true,
        data: features,
        message: `${features.length} feature(s) found`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to retrieve features',
      };
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get feature statistics by context' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getFeatureStatistics(): Promise<ApiResponseType<{
    relief: number;
    natural: number;
    artificial: number;
    cultural: number;
    total: number;
  }>> {
    try {
      const stats = await this.getFeatureStatisticsUseCase.execute();

      return {
        success: true,
        data: stats,
        message: 'Feature statistics retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to retrieve feature statistics',
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a feature by ID' })
  @ApiResponse({ status: 200, description: 'Feature found' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  @ApiParam({ name: 'id', description: 'Feature ID' })
  async getFeature(@Param('id') id: string): Promise<ApiResponseType<MapFeature>> {
    try {
      const featureId = new FeatureId(id);
      const feature = await this.getFeatureByIdUseCase.execute(featureId);

      if (!feature) {
        return {
          success: false,
          error: 'Feature not found',
        };
      }

      return {
        success: true,
        data: feature,
        message: 'Feature found',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get feature',
      };
    }
  }

  @Delete('all')
  @ApiOperation({ summary: 'Clear all features from all contexts' })
  @ApiResponse({ status: 200, description: 'All features cleared successfully' })
  async clearAllFeatures(): Promise<ApiResponseType<string>> {
    try {
      await this.clearAllFeaturesUseCase.execute();

      return {
        success: true,
        data: 'All features cleared successfully',
        message: 'Operation completed',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to clear features',
      };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for features service' })
  healthCheck(): ApiResponseType<string> {
    return {
      success: true,
      data: 'Features service is running',
      message: 'OK',
    };
  }
}