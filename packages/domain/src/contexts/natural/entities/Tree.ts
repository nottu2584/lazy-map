// Legacy Tree exports - now handled by the Plant hierarchy
// This file maintains backward compatibility while redirecting to the new system

import { TreePlant, PlantSpecies, PlantSize } from './Plant';

/**
 * @deprecated Use PlantSpecies instead
 * Legacy tree types for backward compatibility
 */
export enum TreeType {
  OAK = 'oak',
  PINE = 'pine', 
  BIRCH = 'birch',
  MAPLE = 'maple',
  CEDAR = 'cedar',
  WILLOW = 'willow',
  FRUIT = 'fruit',
  DEAD = 'dead',
}

/**
 * @deprecated Use PlantSize instead
 * Legacy tree size categories for backward compatibility
 */
export enum TreeSize {
  SAPLING = 'sapling',
  YOUNG = 'young',
  MATURE = 'mature',
  ANCIENT = 'ancient',
}

/**
 * @deprecated Use TreePlant from Plant.ts instead
 * Legacy tree interface for backward compatibility
 */
export interface Tree {
  id: string;
  type: TreeType;
  size: TreeSize;
  position: any; // SubTilePosition
  diameter: number;
  height: number;
  health: number;
  age: number;
  canopyDensity: number;
  properties: {
    hasVines?: boolean;
    hasDeadBranches?: boolean;
    leanAngle?: number;
    trunkThickness?: number;
    inosculated?: string[];
  };
}

// Export the new TreePlant as the primary Tree implementation
export { TreePlant as EnhancedTree };

// Helper function to convert legacy TreeType to PlantSpecies
export function convertTreeTypeToPlantSpecies(treeType: TreeType): PlantSpecies {
  const mapping: Record<TreeType, PlantSpecies> = {
    [TreeType.OAK]: PlantSpecies.OAK,
    [TreeType.PINE]: PlantSpecies.PINE,
    [TreeType.BIRCH]: PlantSpecies.BIRCH,
    [TreeType.MAPLE]: PlantSpecies.MAPLE,
    [TreeType.CEDAR]: PlantSpecies.CEDAR,
    [TreeType.WILLOW]: PlantSpecies.WILLOW,
    [TreeType.FRUIT]: PlantSpecies.FRUIT_TREE,
    [TreeType.DEAD]: PlantSpecies.DEAD_TREE,
  };
  
  return mapping[treeType] || PlantSpecies.OAK;
}

// Helper function to convert legacy TreeSize to PlantSize
export function convertTreeSizeToPlantSize(treeSize: TreeSize): PlantSize {
  const mapping: Record<TreeSize, PlantSize> = {
    [TreeSize.SAPLING]: PlantSize.SMALL,
    [TreeSize.YOUNG]: PlantSize.MEDIUM,
    [TreeSize.MATURE]: PlantSize.LARGE,
    [TreeSize.ANCIENT]: PlantSize.HUGE,
  };
  
  return mapping[treeSize] || PlantSize.MEDIUM;
}