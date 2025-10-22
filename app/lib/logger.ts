/**
 * Professional logging utility for the main application
 * Provides structured, contextual logging for server-side operations
 */

export interface AppLogContext {
  operation?: string;
  bundleId?: string;
  shopId?: string;
  userId?: string;
  requestId?: string;
  component?: string;
}

export class AppLogger {
  private static enabled = true; // Set to false to disable all logging in production
  
  static info(message: string, context?: AppLogContext, data?: any) {
    if (!this.enabled) return;
    
    const prefix = this.formatPrefix('INFO', context);
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
  
  static warn(message: string, context?: AppLogContext, data?: any) {
    if (!this.enabled) return;
    
    const prefix = this.formatPrefix('WARN', context);
    if (data) {
      console.warn(`${prefix} ${message}`, data);
    } else {
      console.warn(`${prefix} ${message}`);
    }
  }
  
  static error(message: string, context?: AppLogContext, error?: any) {
    if (!this.enabled) return;
    
    const prefix = this.formatPrefix('ERROR', context);
    if (error) {
      console.error(`${prefix} ${message}`, error);
    } else {
      console.error(`${prefix} ${message}`);
    }
  }
  
  static debug(message: string, context?: AppLogContext, data?: any) {
    if (!this.enabled) return;
    
    const prefix = this.formatPrefix('DEBUG', context);
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
  
  private static formatPrefix(level: string, context?: AppLogContext): string {
    let prefix = `[APP:${level}]`;
    
    if (context) {
      const parts: string[] = [];
      if (context.component) parts.push(`component=${context.component}`);
      if (context.operation) parts.push(`op=${context.operation}`);
      if (context.bundleId) parts.push(`bundle=${context.bundleId.substring(0, 8)}...`);
      if (context.shopId) parts.push(`shop=${context.shopId.substring(0, 8)}...`);
      if (context.requestId) parts.push(`req=${context.requestId.substring(0, 8)}...`);
      
      if (parts.length > 0) {
        prefix += `[${parts.join(',')}]`;
      }
    }
    
    return prefix;
  }
  
  // Performance tracking
  static startTimer(operation: string, context?: AppLogContext): () => void {
    if (!this.enabled) return () => {};
    
    const startTime = Date.now();
    this.debug(`Started ${operation}`, context);
    
    return () => {
      const elapsed = Date.now() - startTime;
      this.debug(`Completed ${operation} in ${elapsed}ms`, context);
    };
  }
  
  // Summary logging for key operations
  static summary(operation: string, result: any, context?: AppLogContext) {
    if (!this.enabled) return;
    
    this.info(`${operation} completed`, context, {
      success: !!result,
      resultType: typeof result,
      resultLength: Array.isArray(result) ? result.length : undefined
    });
  }
  
  // Metafield operation logging
  static metafield(action: string, type: string, context?: AppLogContext, data?: any) {
    if (!this.enabled) return;
    
    const metafieldContext = { ...context, component: 'metafield' };
    this.info(`${action} ${type}`, metafieldContext, data);
  }
  
  // Bundle operation logging
  static bundle(action: string, context?: AppLogContext, data?: any) {
    if (!this.enabled) return;
    
    const bundleContext = { ...context, component: 'bundle' };
    this.info(`Bundle ${action}`, bundleContext, data);
  }
}