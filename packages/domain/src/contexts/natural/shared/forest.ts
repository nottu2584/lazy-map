import { Position, Dimensions, SpatialBounds } from '../../../common/value-objects';
import {
  Tree,
  TreeType,
  TreeSize,
  SubTilePosition,
  ForestGenerationSettings,
  MapFeature,
  FeatureCategory,
  NaturalFeatureType,
} from './types';
import { createFeature, generateFeatureId } from './utils';

// Forest feature that contains individual trees
export interface ForestFeature extends MapFeature {
  type: NaturalFeatureType.FOREST;
  trees: Tree[];
  forestDensity: number;
  dominantSpecies: TreeType[];
  underbrush: number; // 0.0-1.0 density of undergrowth
}

// Create a forest feature with generated trees
export function createForest(
  name: string,
  area: SpatialBounds,
  settings: ForestGenerationSettings,
  seed?: number,
): ForestFeature {
  const trees = generateTreesInArea(area, settings, seed);
  const dominantSpecies = getDominantSpecies(trees);

  const baseFeature = createFeature(
    name,
    FeatureCategory.NATURAL,
    NaturalFeatureType.FOREST,
    area,
    2, // Forest priority
    {
      forestType: 'mixed', // TODO: Determine from species distribution
      canopyDensity: calculateAverageCanopyDensity(trees),
      undergrowthDensity: Math.random() * 0.6 + 0.2, // 0.2-0.8
    },
  );

  return {
    ...baseFeature,
    type: NaturalFeatureType.FOREST,
    trees,
    forestDensity: settings.treeDensity,
    dominantSpecies,
    underbrush: baseFeature.properties.undergrowthDensity,
  };
}

// Generate trees within a forest area
export function generateTreesInArea(
  area: SpatialBounds,
  settings: ForestGenerationSettings,
  seed?: number,
): Tree[] {
  const trees: Tree[] = [];
  const rng = createSeededRandom(seed);

  // Calculate total area coverage needed
  const totalTiles = area.width * area.height;
  const targetTreeCount = Math.floor(totalTiles * settings.treeDensity * (0.5 + rng() * 1.0));

  // Generate tree positions using clumping algorithm
  const positions = generateClumpedPositions(area, targetTreeCount, settings.treeClumping, rng);

  for (const position of positions) {
    const tree = generateTreeAtPosition(position, settings, rng);
    trees.push(tree);
  }

  // Apply natural interactions (inosculation, competition)
  if (settings.enableInosculation) {
    applyInosculation(trees, settings.inosculationChance, settings.maxOverlapDistance, rng);
  }

  return trees;
}

// Generate clumped tree positions using Poisson disk sampling with clusters
function generateClumpedPositions(
  area: SpatialBounds,
  targetCount: number,
  clumpiness: number,
  rng: () => number,
): SubTilePosition[] {
  const positions: SubTilePosition[] = [];
  const minDistance = 0.3; // Minimum distance between tree centers
  const maxAttempts = targetCount * 4;

  // Generate cluster centers
  const clusterCount = Math.max(1, Math.floor((targetCount * (1 - clumpiness)) / 5));
  const clusterCenters: Position[] = [];

  for (let i = 0; i < clusterCount; i++) {
    clusterCenters.push(new Position(
      area.x + rng() * area.width,
      area.y + rng() * area.height
    ));
  }

  // Generate trees around cluster centers
  const treesPerCluster = Math.ceil(targetCount / clusterCount);

  for (const center of clusterCenters) {
    const clusterRadius = 2 + rng() * 3; // 2-5 tile radius clusters

    for (let i = 0; i < treesPerCluster && positions.length < targetCount; i++) {
      let attempts = 0;
      let validPosition = false;

      while (!validPosition && attempts < maxAttempts / clusterCount) {
        // Generate position within cluster radius using normal distribution
        const angle = rng() * Math.PI * 2;
        const distance = ((rng() + rng()) / 2) * clusterRadius; // Bias toward center

        const tileX = Math.floor(center.x + Math.cos(angle) * distance);
        const tileY = Math.floor(center.y + Math.sin(angle) * distance);
        const offsetX = rng();
        const offsetY = rng();

        // Check if position is within forest area
        if (
          tileX >= area.x &&
          tileX < area.x + area.width &&
          tileY >= area.y &&
          tileY < area.y + area.height
        ) {
          const newPosition: SubTilePosition = { tileX, tileY, offsetX, offsetY };

          // Check minimum distance to existing trees
          const tooClose = positions.some(
            (pos) => getPositionDistance(pos, newPosition) < minDistance,
          );

          if (!tooClose) {
            positions.push(newPosition);
            validPosition = true;
          }
        }
        attempts++;
      }
    }
  }

  return positions;
}

// Generate a tree at a specific position
function generateTreeAtPosition(
  position: SubTilePosition,
  settings: ForestGenerationSettings,
  rng: () => number,
): Tree {
  // Select tree size based on distribution
  const sizeRoll = rng();
  let size: TreeSize;
  let diameter: number;

  if (sizeRoll < settings.saplingChance) {
    size = TreeSize.SAPLING;
    diameter = 0.1 + rng() * 0.2; // 0.1-0.3
  } else if (sizeRoll < settings.saplingChance + settings.youngChance) {
    size = TreeSize.YOUNG;
    diameter = 0.3 + rng() * 0.3; // 0.3-0.6
  } else if (sizeRoll < settings.saplingChance + settings.youngChance + settings.matureChance) {
    size = TreeSize.MATURE;
    diameter = 0.6 + rng() * 0.6; // 0.6-1.2
  } else {
    size = TreeSize.ANCIENT;
    diameter = 1.0 + rng() * 1.0; // 1.0-2.0
  }

  // Select tree type
  const treeType = selectTreeType(settings, rng);

  // Calculate height based on size and type
  const height = calculateTreeHeight(treeType, size, diameter, rng);

  // Generate natural variations
  const health = settings.enableNaturalVariation ? 0.6 + rng() * 0.4 : 1.0;
  const canopyDensity = 0.4 + rng() * 0.5; // 0.4-0.9
  const age = generateTreeAge(size, rng);

  return {
    id: generateFeatureId(),
    type: treeType,
    size,
    position,
    diameter,
    height,
    health,
    age,
    canopyDensity,
    properties: {
      hasVines: rng() < 0.15,
      hasDeadBranches: health < 0.8 && rng() < 0.3,
      leanAngle: settings.enableNaturalVariation ? (rng() - 0.5) * 20 : 0, // -10 to +10 degrees
      trunkThickness: diameter * (0.8 + rng() * 0.4), // 80%-120% of diameter
      inosculated: [], // Will be populated by applyInosculation if enabled
    },
  };
}

// Select tree type based on settings and biome
function selectTreeType(settings: ForestGenerationSettings, rng: () => number): TreeType {
  if (settings.preferredSpecies.length > 0 && rng() < 0.7) {
    // 70% chance to use preferred species
    return settings.preferredSpecies[Math.floor(rng() * settings.preferredSpecies.length)];
  }

  // Random selection from all types
  const allTypes = Object.values(TreeType);
  return allTypes[Math.floor(rng() * allTypes.length)];
}

// Calculate tree height based on type, size, and diameter
function calculateTreeHeight(
  type: TreeType,
  size: TreeSize,
  diameter: number,
  rng: () => number,
): number {
  const baseHeights = {
    [TreeType.OAK]: { base: 15, variance: 10 },
    [TreeType.PINE]: { base: 25, variance: 15 },
    [TreeType.BIRCH]: { base: 20, variance: 8 },
    [TreeType.MAPLE]: { base: 18, variance: 12 },
    [TreeType.CEDAR]: { base: 30, variance: 20 },
    [TreeType.WILLOW]: { base: 12, variance: 6 },
    [TreeType.FRUIT]: { base: 8, variance: 4 },
    [TreeType.DEAD]: { base: 10, variance: 15 }, // Highly variable
  };

  const sizeMultipliers = {
    [TreeSize.SAPLING]: 0.2,
    [TreeSize.YOUNG]: 0.5,
    [TreeSize.MATURE]: 1.0,
    [TreeSize.ANCIENT]: 1.3,
  };

  const typeData = baseHeights[type];
  const baseHeight = typeData.base * sizeMultipliers[size];
  const variance = typeData.variance * sizeMultipliers[size];

  return Math.max(1, baseHeight + (rng() - 0.5) * variance);
}

// Generate age appropriate for tree size
function generateTreeAge(size: TreeSize, rng: () => number): number {
  const ageRanges = {
    [TreeSize.SAPLING]: { min: 1, max: 10 },
    [TreeSize.YOUNG]: { min: 10, max: 30 },
    [TreeSize.MATURE]: { min: 30, max: 100 },
    [TreeSize.ANCIENT]: { min: 100, max: 500 },
  };

  const range = ageRanges[size];
  return range.min + rng() * (range.max - range.min);
}

// Apply inosculation (tree grafting) between nearby trees
function applyInosculation(
  trees: Tree[],
  inosculationChance: number,
  maxDistance: number,
  rng: () => number,
): void {
  for (let i = 0; i < trees.length; i++) {
    for (let j = i + 1; j < trees.length; j++) {
      const tree1 = trees[i];
      const tree2 = trees[j];

      const distance = getPositionDistance(tree1.position, tree2.position);

      // Trees can only graft if they're close enough and both healthy
      if (
        distance <= maxDistance &&
        tree1.health > 0.7 &&
        tree2.health > 0.7 &&
        rng() < inosculationChance
      ) {
        // Add mutual references
        tree1.properties.inosculated = tree1.properties.inosculated || [];
        tree2.properties.inosculated = tree2.properties.inosculated || [];

        tree1.properties.inosculated.push(tree2.id);
        tree2.properties.inosculated.push(tree1.id);

        // Slightly boost health of both trees (mutual support)
        tree1.health = Math.min(1.0, tree1.health + 0.05);
        tree2.health = Math.min(1.0, tree2.health + 0.05);
      }
    }
  }
}

// Utility functions
function getPositionDistance(pos1: SubTilePosition, pos2: SubTilePosition): number {
  const dx = pos1.tileX + pos1.offsetX - (pos2.tileX + pos2.offsetX);
  const dy = pos1.tileY + pos1.offsetY - (pos2.tileY + pos2.offsetY);
  return Math.sqrt(dx * dx + dy * dy);
}

function getDominantSpecies(trees: Tree[]): TreeType[] {
  const speciesCounts = new Map<TreeType, number>();

  for (const tree of trees) {
    speciesCounts.set(tree.type, (speciesCounts.get(tree.type) || 0) + 1);
  }

  // Return species that make up more than 20% of the forest
  const totalTrees = trees.length;
  const dominantThreshold = totalTrees * 0.2;

  return Array.from(speciesCounts.entries())
    .filter(([_, count]) => count >= dominantThreshold)
    .sort(([_, a], [__, b]) => b - a)
    .map(([species, _]) => species);
}

function calculateAverageCanopyDensity(trees: Tree[]): number {
  if (trees.length === 0) return 0;

  const totalDensity = trees.reduce((sum, tree) => sum + tree.canopyDensity, 0);
  return totalDensity / trees.length;
}

// Simple seeded random number generator (Linear Congruential Generator)
function createSeededRandom(seed?: number): () => number {
  let s = seed ?? Math.floor(Math.random() * 2147483647);

  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Get all trees that occupy or partially occupy a specific tile
export function getTreesInTile(trees: Tree[], tileX: number, tileY: number): Tree[] {
  return trees.filter((tree) => {
    const treeLeft = tree.position.tileX + tree.position.offsetX - tree.diameter / 2;
    const treeRight = tree.position.tileX + tree.position.offsetX + tree.diameter / 2;
    const treeTop = tree.position.tileY + tree.position.offsetY - tree.diameter / 2;
    const treeBottom = tree.position.tileY + tree.position.offsetY + tree.diameter / 2;

    // Check if tree overlaps with tile boundaries
    return !(
      treeRight <= tileX ||
      treeLeft >= tileX + 1 ||
      treeBottom <= tileY ||
      treeTop >= tileY + 1
    );
  });
}

// Calculate the coverage percentage of trees in a specific tile
export function getTreeCoverageInTile(trees: Tree[], tileX: number, tileY: number): number {
  const treesInTile = getTreesInTile(trees, tileX, tileY);

  if (treesInTile.length === 0) return 0;

  let totalCoverage = 0;

  for (const tree of treesInTile) {
    // Calculate what portion of the tree's area overlaps with this tile
    const treeLeft = tree.position.tileX + tree.position.offsetX - tree.diameter / 2;
    const treeRight = tree.position.tileX + tree.position.offsetX + tree.diameter / 2;
    const treeTop = tree.position.tileY + tree.position.offsetY - tree.diameter / 2;
    const treeBottom = tree.position.tileY + tree.position.offsetY + tree.diameter / 2;

    // Calculate intersection with tile
    const intersectLeft = Math.max(tileX, treeLeft);
    const intersectRight = Math.min(tileX + 1, treeRight);
    const intersectTop = Math.max(tileY, treeTop);
    const intersectBottom = Math.min(tileY + 1, treeBottom);

    const intersectArea = (intersectRight - intersectLeft) * (intersectBottom - intersectTop);
    totalCoverage += intersectArea * tree.canopyDensity;
  }

  // Cap at 1.0 (100% coverage) even if trees overlap heavily
  return Math.min(1.0, totalCoverage);
}
