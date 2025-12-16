import { EventEmitter } from 'events';
import { EventPayloadMap, EventType } from './eventTypes';

class ApplicationEventEmitter extends EventEmitter {
  private static instance: ApplicationEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(20); // Prevent memory leak warnings
  }

  static getInstance(): ApplicationEventEmitter {
    if (!ApplicationEventEmitter.instance) {
      ApplicationEventEmitter.instance = new ApplicationEventEmitter();
    }
    return ApplicationEventEmitter.instance;
  }

  emitEvent<T extends EventType>(
    event: T,
    payload: T extends keyof EventPayloadMap ? EventPayloadMap[T] : never
  ): void {
    this.emit(event, payload);
    
    // Log event for debugging
    console.log(`[EVENT] ${event}`, {
      timestamp: new Date().toISOString(),
      payload: this.sanitizePayload(payload)
    });
  }

  private sanitizePayload(payload: any): any {
    // Remove sensitive data from logs
    const sanitized = { ...payload };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    return sanitized;
  }
}

export const eventEmitter = ApplicationEventEmitter.getInstance();
