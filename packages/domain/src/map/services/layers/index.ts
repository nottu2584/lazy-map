// Layer service interfaces (Ports for Clean Architecture)
export * from './IGeologyLayerService';
export * from './ITopographyLayerService';
export * from './IHydrologyLayerService';
export * from './IVegetationLayerService';
export * from './IStructuresLayerService';

// Re-export types for convenience
export { StructureType } from './IStructuresLayerService';