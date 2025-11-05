import {
  ISettlementPlanningService,
  SettlementSize,
  HistoricalPeriod,
  SettlementPlan,
  SuitabilityMap,
  Seed,
  Position
} from '@lazy-map/domain';

/**
 * Command for planning a settlement
 */
export class PlanSettlementCommand {
  constructor(
    public readonly terrain: SuitabilityMap,
    public readonly size: SettlementSize,
    public readonly period: HistoricalPeriod,
    public readonly seed: Seed,
    public readonly hasDefenses?: boolean,
    public readonly hasMarket?: boolean,
    public readonly hasReligiousCenter?: boolean
  ) {}
}

/**
 * Result of settlement planning
 */
export class PlanSettlementResult {
  constructor(
    public readonly plan: SettlementPlan,
    public readonly buildingCount: number,
    public readonly roadLength: number,
    public readonly hasWalls: boolean,
    public readonly planningTime: number
  ) {}
}

/**
 * Use case for planning a settlement layout
 * Orchestrates the settlement planning process
 */
export class PlanSettlementUseCase {
  constructor(
    private readonly settlementPlanner: ISettlementPlanningService
  ) {}

  /**
   * Execute settlement planning
   */
  async execute(command: PlanSettlementCommand): Promise<PlanSettlementResult> {
    const startTime = Date.now();

    // 1. Validate terrain suitability
    this.validateTerrain(command.terrain);

    // 2. Generate settlement plan
    const plan = await this.settlementPlanner.planSettlement(
      command.terrain,
      command.size,
      command.period,
      command.seed
    );

    // 3. Add special buildings based on command
    if (command.hasMarket) {
      this.addMarketSquare(plan);
    }

    if (command.hasReligiousCenter) {
      this.addReligiousCenter(plan, command.period);
    }

    // 4. Add defenses if requested
    if (command.hasDefenses) {
      this.addDefenses(plan, command.size, command.period);
    }

    // 5. Optimize building placement for shared walls
    await this.optimizeSharedWalls(plan);

    // 6. Validate the plan
    this.validatePlan(plan, command);

    // 7. Calculate metrics
    const buildingCount = plan.buildings.length;
    const roadLength = this.calculateTotalRoadLength(plan);
    const hasWalls = plan.enclosure?.type === 'wall';
    const planningTime = Date.now() - startTime;

    return new PlanSettlementResult(
      plan,
      buildingCount,
      roadLength,
      hasWalls,
      planningTime
    );
  }

  /**
   * Validate terrain has suitable building sites
   */
  private validateTerrain(terrain: SuitabilityMap): void {
    const totalSuitable = terrain.suitability
      .flat()
      .filter(value => value > 0.3)
      .length;

    if (totalSuitable < 10) {
      throw new Error('Insufficient suitable terrain for settlement');
    }

    if (terrain.optimalSites.length === 0) {
      throw new Error('No optimal building sites found in terrain');
    }
  }

  /**
   * Add market square to settlement center
   */
  private addMarketSquare(plan: SettlementPlan): void {
    // Market should be near center
    const marketBuildings = [
      {
        type: 'market_hall',
        position: plan.center,
        orientation: 0,
        priority: 1
      },
      {
        type: 'shop',
        position: new Position(
          plan.center.x + 20,
          plan.center.y
        ),
        orientation: 0,
        priority: 2
      },
      {
        type: 'shop',
        position: new Position(
          plan.center.x - 20,
          plan.center.y
        ),
        orientation: 0,
        priority: 2
      }
    ];

    plan.buildings.push(...marketBuildings);
  }

  /**
   * Add religious center based on period
   */
  private addReligiousCenter(
    plan: SettlementPlan,
    period: HistoricalPeriod
  ): void {
    const religiousBuilding = {
      type: period === HistoricalPeriod.ANCIENT ? 'temple' : 'church',
      position: new Position(
        plan.center.x,
        plan.center.y + 30
      ),
      orientation: 0,
      priority: 0 // Build first
    };

    plan.buildings.unshift(religiousBuilding);
  }

  /**
   * Add defensive structures
   */
  private addDefenses(
    plan: SettlementPlan,
    size: SettlementSize,
    period: HistoricalPeriod
  ): void {
    // Determine defense type based on size and period
    let enclosureType: 'wall' | 'palisade' | 'ditch';

    if (size === SettlementSize.CITY || size === SettlementSize.TOWN) {
      enclosureType = 'wall';
    } else if (period === HistoricalPeriod.EARLY_MEDIEVAL) {
      enclosureType = 'palisade';
    } else {
      enclosureType = 'ditch';
    }

    // Add gates at main roads
    const gates = this.determineGatePositions(plan);

    plan.enclosure = {
      type: enclosureType,
      gates
    };

    // Add towers or watchtowers
    if (enclosureType === 'wall') {
      this.addTowers(plan);
    }
  }

  /**
   * Optimize building placement for shared walls
   */
  private async optimizeSharedWalls(plan: SettlementPlan): Promise<void> {
    const sharedWalls = await this.settlementPlanner.determineSharedWalls(
      plan.buildings,
      15 // Max 15 feet apart to share walls
    );

    // Update building plans with shared wall information
    for (const [buildingId, neighbors] of sharedWalls) {
      const building = plan.buildings.find(b =>
        `${b.type}_${b.position.x}_${b.position.y}` === buildingId
      );
      if (building) {
        building.shareWalls = neighbors;
      }
    }
  }

  /**
   * Validate the generated plan
   */
  private validatePlan(plan: SettlementPlan, command: PlanSettlementCommand): void {
    // Check minimum building count for settlement size
    const minBuildings = {
      [SettlementSize.HAMLET]: 3,
      [SettlementSize.VILLAGE]: 8,
      [SettlementSize.TOWN]: 21,
      [SettlementSize.CITY]: 50
    };

    if (plan.buildings.length < minBuildings[command.size]) {
      throw new Error(
        `Insufficient buildings for ${command.size}: ${plan.buildings.length} < ${minBuildings[command.size]}`
      );
    }

    // Check all buildings are within terrain bounds
    for (const building of plan.buildings) {
      if (building.position.x < 0 ||
          building.position.y < 0 ||
          building.position.x >= command.terrain.width ||
          building.position.y >= command.terrain.height) {
        throw new Error('Building placed outside terrain bounds');
      }
    }
  }

  /**
   * Calculate total road length
   */
  private calculateTotalRoadLength(plan: SettlementPlan): number {
    return plan.roads.reduce((total, road) => {
      const dx = road.end.x - road.start.x;
      const dy = road.end.y - road.start.y;
      return total + Math.sqrt(dx * dx + dy * dy);
    }, 0);
  }

  /**
   * Determine gate positions for enclosure
   */
  private determineGatePositions(plan: SettlementPlan): Position[] {
    // Place gates where main roads exit the settlement
    const gates: Position[] = [];

    for (const road of plan.roads) {
      if (road.type === 'main') {
        // Check if road extends to settlement edge
        // Simplified - in full implementation would calculate intersection with enclosure
        gates.push(road.start);
        gates.push(road.end);
      }
    }

    // Ensure at least one gate
    if (gates.length === 0) {
      gates.push(plan.center);
    }

    return gates;
  }

  /**
   * Add defensive towers to walls
   */
  private addTowers(plan: SettlementPlan): void {
    // Add corner towers and gate towers
    // Simplified - in full implementation would calculate wall corners
    const towerPositions = [
      new Position(0, 0),
      new Position(plan.center.x * 2, 0),
      new Position(0, plan.center.y * 2),
      new Position(plan.center.x * 2, plan.center.y * 2)
    ];

    for (const position of towerPositions) {
      plan.buildings.push({
        type: 'tower',
        position,
        orientation: 0,
        priority: 10 // Build after main buildings
      });
    }
  }
}