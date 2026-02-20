/**
 * Layer data DTOs matching the serialized backend response.
 * These mirror the domain layer data types but as plain objects.
 */

// ─── Geology ───────────────────────────────────────────────

export interface GeologicalFormationDTO {
  rockType: string;
  mineralComposition: {
    primary: string;
    secondary?: string;
    accessory?: string[];
  };
  structure: {
    bedding: string;
    jointSpacing: number;
    jointOrientation: string;
    foliation?: string;
  };
  properties: {
    hardness: number;
    permeability: string;
    chemicalStability: string;
    grainSize: string;
  };
  weathering: {
    dominant: string;
    rate: string;
    products: string[];
  };
}

export interface GeologyTileDataDTO {
  formation: GeologicalFormationDTO;
  soilDepth: number;
  permeability: string;
  features: string[];
  fractureIntensity: number;
}

export interface GeologyLayerDataDTO {
  tiles: GeologyTileDataDTO[][];
  primaryFormation: GeologicalFormationDTO;
  secondaryFormation?: GeologicalFormationDTO;
  transitionZones: { x: number; y: number }[];
}

// ─── Topography ────────────────────────────────────────────

export interface TopographyTileDataDTO {
  elevation: number;
  slope: number;
  aspect: string;
  relativeElevation: number;
  isRidge: boolean;
  isValley: boolean;
  isDrainage: boolean;
}

export interface TopographyLayerDataDTO {
  tiles: TopographyTileDataDTO[][];
  minElevation: number;
  maxElevation: number;
  averageSlope: number;
}

// ─── Hydrology ─────────────────────────────────────────────

export interface HydrologyTileDataDTO {
  flowAccumulation: number;
  flowDirection: number;
  waterDepth: number;
  moisture: string;
  isSpring: boolean;
  isStream: boolean;
  isPool: boolean;
  streamOrder: number;
}

export interface StreamSegmentDTO {
  points: { x: number; y: number }[];
  order: number;
  width: number;
}

export interface HydrologyLayerDataDTO {
  tiles: HydrologyTileDataDTO[][];
  streams: StreamSegmentDTO[];
  springs: { x: number; y: number }[];
  totalWaterCoverage: number;
}

// ─── Vegetation ────────────────────────────────────────────

export interface VegetationTileDataDTO {
  canopyHeight: number;
  canopyDensity: number;
  vegetationType: string;
  dominantSpecies: string | null;
  groundCover: number;
  isPassable: boolean;
  providesConcealment: boolean;
  providesCover: boolean;
}

export interface ForestPatchDTO {
  tiles: { x: number; y: number }[];
  type: 'deciduous' | 'coniferous' | 'mixed';
  density: number;
}

export interface VegetationLayerDataDTO {
  tiles: VegetationTileDataDTO[][];
  forestPatches: ForestPatchDTO[];
  clearings: { x: number; y: number; radius: number }[];
  totalTreeCount: number;
  averageCanopyCoverage: number;
}

// ─── Structures ────────────────────────────────────────────

export interface StructureTileDataDTO {
  hasStructure: boolean;
  structureType: string | null;
  material: string | null;
  height: number;
  isRoad: boolean;
  isPath: boolean;
  condition: string;
}

export interface RoadSegmentDTO {
  points: { x: number; y: number }[];
  width: number;
  material: string;
}

export interface RoadNetworkDTO {
  segments: RoadSegmentDTO[];
  intersections: { x: number; y: number }[];
  totalLength: number;
}

export interface StructuresLayerDataDTO {
  tiles: StructureTileDataDTO[][];
  roads: RoadNetworkDTO;
  totalStructureCount: number;
}

// ─── Features ──────────────────────────────────────────────

export interface FeatureTileDataDTO {
  hasFeature: boolean;
  featureType: string | null;
  hazardLevel: string;
  resourceValue: number;
  visibility: string;
  interactionType: string | null;
  description: string | null;
}

export interface HazardLocationDTO {
  position: { x: number; y: number };
  type: string;
  level: string;
  radius: number;
}

export interface ResourceLocationDTO {
  position: { x: number; y: number };
  type: string;
  quantity: number;
  quality: number;
}

export interface LandmarkLocationDTO {
  position: { x: number; y: number };
  type: string;
  significance: number;
  lore: string;
}

export interface FeaturesLayerDataDTO {
  tiles: FeatureTileDataDTO[][];
  hazards: HazardLocationDTO[];
  resources: ResourceLocationDTO[];
  landmarks: LandmarkLocationDTO[];
  totalFeatureCount: number;
}

// ─── Combined ──────────────────────────────────────────────

export interface TacticalMapLayersDTO {
  geology: GeologyLayerDataDTO;
  topography: TopographyLayerDataDTO;
  hydrology: HydrologyLayerDataDTO;
  vegetation: VegetationLayerDataDTO;
  structures: StructuresLayerDataDTO;
  features: FeaturesLayerDataDTO;
}
