export * from './entities';
export * from './enums/ArtificialFeatureType';
export { MaterialType } from './enums/MaterialType'; // For roads/structures
export * from './repositories';
export * from './value-objects/BuildingFootprint';
export {
  BuildingMaterial,
  BuildingType,
  WallMaterial,
  ConstructionStyle
} from './value-objects/BuildingMaterial';
export * from './value-objects/Room';
export * from './value-objects/Floor';
export * from './services/IBuildingGenerationService';
export * from './services/ISettlementPlanningService';