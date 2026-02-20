/**
 * Infrastructure layer service implementations
 *
 * Note: Domain types (interfaces, data structures) should be imported
 * directly from @lazy-map/domain. This file only exports the concrete
 * implementation classes following Clean Architecture principles.
 */

// Geological foundation layer implementation
export { GeologyLayer } from './GeologyLayer';

// Topographic expression layer implementation
export { TopographyLayer } from './TopographyLayer';
// Topography internal services
export * from './topography';

// Hydrological flow layer implementation
export { HydrologyLayer } from './HydrologyLayer';
// Hydrology internal services
export * from './hydrology';

// Vegetation growth layer implementation
export { VegetationLayer } from './VegetationLayer';
// Vegetation internal services
export * from './vegetation';

// Artificial structures layer implementation
export { StructuresLayer } from './StructuresLayer';
// Structures internal services
export * from './structures';

// Features and points of interest layer implementation
export { FeaturesLayer } from './FeaturesLayer';
// Features internal services
export * from './features';