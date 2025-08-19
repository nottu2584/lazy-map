import { 
  INotificationPort, 
  Notification, 
  NotificationType 
} from '@lazy-map/application';

/**
 * Simple console-based notification service
 * Useful for development and CLI applications
 */
export class ConsoleNotificationService implements INotificationPort {
  private enabledTypes: Set<NotificationType> = new Set([
    NotificationType.INFO,
    NotificationType.WARNING,
    NotificationType.ERROR,
    NotificationType.SUCCESS
  ]);

  constructor(
    private readonly enableColors: boolean = true,
    private readonly enableTimestamps: boolean = true
  ) {}

  async notifyInfo(title: string, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.notify({
      type: NotificationType.INFO,
      title,
      message,
      timestamp: new Date(),
      metadata
    });
  }

  async notifyWarning(title: string, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.notify({
      type: NotificationType.WARNING,
      title,
      message,
      timestamp: new Date(),
      metadata
    });
  }

  async notifyError(title: string, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.notify({
      type: NotificationType.ERROR,
      title,
      message,
      timestamp: new Date(),
      metadata
    });
  }

  async notifySuccess(title: string, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.notify({
      type: NotificationType.SUCCESS,
      title,
      message,
      timestamp: new Date(),
      metadata
    });
  }

  async notify(notification: Notification): Promise<void> {
    if (!this.enabledTypes.has(notification.type)) {
      return;
    }

    const formattedMessage = this.formatNotification(notification);
    
    // Output to appropriate stream based on type
    switch (notification.type) {
      case NotificationType.ERROR:
        console.error(formattedMessage);
        break;
      case NotificationType.WARNING:
        console.warn(formattedMessage);
        break;
      case NotificationType.INFO:
        console.info(formattedMessage);
        break;
      case NotificationType.SUCCESS:
        console.log(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  async notifyMapGenerationProgress(
    mapId: string,
    progress: number,
    currentStep: string,
    totalSteps: number
  ): Promise<void> {
    const progressBar = this.createProgressBar(progress);
    const stepInfo = `Step ${Math.ceil(progress * totalSteps)}/${totalSteps}`;
    
    await this.notifyInfo(
      'Map Generation Progress',
      `${progressBar} ${(progress * 100).toFixed(1)}% - ${currentStep}`,
      { mapId, progress, currentStep, totalSteps, stepInfo }
    );
  }

  async notifyMapGenerationComplete(
    mapId: string,
    mapName: string,
    generationTime: number,
    featuresGenerated: number
  ): Promise<void> {
    const timeFormatted = this.formatDuration(generationTime);
    
    await this.notifySuccess(
      'Map Generation Complete',
      `"${mapName}" generated successfully in ${timeFormatted} with ${featuresGenerated} features`,
      { mapId, mapName, generationTime, featuresGenerated }
    );
  }

  async notifyFeatureOperation(
    operation: 'created' | 'updated' | 'deleted' | 'removed',
    featureType: string,
    featureName: string,
    mapId: string
  ): Promise<void> {
    const operationPast = operation === 'created' ? 'created' :
                         operation === 'updated' ? 'updated' :
                         operation === 'deleted' || operation === 'removed' ? 'removed' : operation;
    
    await this.notifyInfo(
      'Feature Operation',
      `${featureType} "${featureName}" ${operationPast}`,
      { operation, featureType, featureName, mapId }
    );
  }

  // Configuration methods
  setEnabledTypes(types: NotificationType[]): void {
    this.enabledTypes = new Set(types);
  }

  enableType(type: NotificationType): void {
    this.enabledTypes.add(type);
  }

  disableType(type: NotificationType): void {
    this.enabledTypes.delete(type);
  }

  isTypeEnabled(type: NotificationType): boolean {
    return this.enabledTypes.has(type);
  }

  // Formatting methods
  private formatNotification(notification: Notification): string {
    const parts: string[] = [];

    // Timestamp
    if (this.enableTimestamps) {
      parts.push(`[${notification.timestamp.toISOString()}]`);
    }

    // Type badge
    const typeBadge = this.getTypeBadge(notification.type);
    parts.push(typeBadge);

    // Title and message
    if (notification.title) {
      parts.push(`${notification.title}:`);
    }
    parts.push(notification.message);

    // Metadata (if present and not too large)
    if (notification.metadata && Object.keys(notification.metadata).length > 0) {
      const metadataString = this.formatMetadata(notification.metadata);
      if (metadataString.length < 200) { // Only show small metadata
        parts.push(`(${metadataString})`);
      }
    }

    return parts.join(' ');
  }

  private getTypeBadge(type: NotificationType): string {
    if (!this.enableColors) {
      return `[${type.toUpperCase()}]`;
    }

    // ANSI color codes
    const colors = {
      [NotificationType.INFO]: '\x1b[36m',    // Cyan
      [NotificationType.WARNING]: '\x1b[33m', // Yellow
      [NotificationType.ERROR]: '\x1b[31m',   // Red
      [NotificationType.SUCCESS]: '\x1b[32m'  // Green
    };
    const reset = '\x1b[0m';

    const color = colors[type] || colors[NotificationType.INFO];
    return `${color}[${type.toUpperCase()}]${reset}`;
  }

  private formatMetadata(metadata: Record<string, any>): string {
    return Object.entries(metadata)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${this.formatValue(value)}`)
      .join(', ');
  }

  private formatValue(value: any): string {
    if (typeof value === 'string') {
      return value.length > 20 ? `${value.substring(0, 20)}...` : value;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    if (value instanceof Date) {
      return value.toISOString().substring(0, 19);
    }
    return JSON.stringify(value).substring(0, 30);
  }

  private createProgressBar(progress: number, width: number = 20): string {
    const filled = Math.floor(progress * width);
    const empty = width - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }

  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }
    
    const seconds = milliseconds / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }
}