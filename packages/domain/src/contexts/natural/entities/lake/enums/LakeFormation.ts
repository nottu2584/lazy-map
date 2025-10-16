/**
 * Lake formation types
 * Describes how the lake was formed geologically
 */
export enum LakeFormation {
  NATURAL = 'natural', // Natural depression, general formation
  VOLCANIC = 'volcanic', // Crater lake from volcanic activity
  ARTIFICIAL = 'artificial', // Reservoir, dam, human-made
  OXBOW = 'oxbow', // Former river meander cut off
  GLACIAL = 'glacial', // Formed by glacial activity
  KARST = 'karst', // Formed by groundwater erosion of limestone
}

/**
 * Check if lake formation is natural (not human-made)
 */
export function isNaturalFormation(formation: LakeFormation): boolean {
  return formation !== LakeFormation.ARTIFICIAL;
}

/**
 * Get typical characteristics for formation type
 */
export function getFormationCharacteristics(formation: LakeFormation): {
  typicalDepth: string;
  waterClarity: string;
  shorelineRegularity: string;
} {
  switch (formation) {
    case LakeFormation.VOLCANIC:
      return {
        typicalDepth: 'very deep',
        waterClarity: 'very clear',
        shorelineRegularity: 'circular'
      };
    case LakeFormation.GLACIAL:
      return {
        typicalDepth: 'moderate to deep',
        waterClarity: 'clear',
        shorelineRegularity: 'irregular'
      };
    case LakeFormation.KARST:
      return {
        typicalDepth: 'variable',
        waterClarity: 'very clear',
        shorelineRegularity: 'irregular with caves'
      };
    case LakeFormation.OXBOW:
      return {
        typicalDepth: 'shallow',
        waterClarity: 'murky',
        shorelineRegularity: 'crescent-shaped'
      };
    case LakeFormation.ARTIFICIAL:
      return {
        typicalDepth: 'deep',
        waterClarity: 'variable',
        shorelineRegularity: 'angular'
      };
    default:
      return {
        typicalDepth: 'moderate',
        waterClarity: 'moderate',
        shorelineRegularity: 'irregular'
      };
  }
}