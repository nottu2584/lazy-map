/**
 * Notification types
 */
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

/**
 * Notification message
 */
export interface Notification {
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Output port for sending notifications
 * This allows the application to notify external systems about events
 */
export interface INotificationPort {
  /**
   * Sends an info notification
   */
  notifyInfo(title: string, message: string, metadata?: Record<string, any>): Promise<void>;

  /**
   * Sends a warning notification
   */
  notifyWarning(title: string, message: string, metadata?: Record<string, any>): Promise<void>;

  /**
   * Sends an error notification
   */
  notifyError(title: string, message: string, metadata?: Record<string, any>): Promise<void>;

  /**
   * Sends a success notification
   */
  notifySuccess(title: string, message: string, metadata?: Record<string, any>): Promise<void>;

  /**
   * Sends a generic notification
   */
  notify(notification: Notification): Promise<void>;

  /**
   * Notifies about map generation progress
   */
  notifyMapGenerationProgress(
    mapId: string,
    progress: number,
    currentStep: string,
    totalSteps: number
  ): Promise<void>;

  /**
   * Notifies when map generation is complete
   */
  notifyMapGenerationComplete(
    mapId: string,
    mapName: string,
    generationTime: number,
    featuresGenerated: number
  ): Promise<void>;

  /**
   * Notifies about feature operations
   */
  notifyFeatureOperation(
    operation: 'created' | 'updated' | 'deleted' | 'removed',
    featureType: string,
    featureName: string,
    mapId: string
  ): Promise<void>;
}