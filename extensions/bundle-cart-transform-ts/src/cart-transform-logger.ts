/**
 * Clean logging utility for cart transform debugging
 * Provides structured, contextual logging that's easy to filter and understand
 */

export interface LogContext {
  bundleId?: string;
  cartLineId?: string;
  operation?: string;
  phase?: string;
}

export class CartTransformLogger {
  private static enabled = true; // Set to false to disable all logging
  
  static info(message: string, context?: LogContext, data?: any) {
    if (!this.enabled) return;
    
    const prefix = this.formatPrefix('INFO', context);
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
  
  static warn(message: string, context?: LogContext, data?: any) {
    if (!this.enabled) return;
    
    const prefix = this.formatPrefix('WARN', context);
    if (data) {
      console.warn(`${prefix} ${message}`, data);
    } else {
      console.warn(`${prefix} ${message}`);
    }
  }
  
  static error(message: string, context?: LogContext, error?: any) {
    if (!this.enabled) return;
    
    const prefix = this.formatPrefix('ERROR', context);
    if (error) {
      console.error(`${prefix} ${message}`, error);
    } else {
      console.error(`${prefix} ${message}`);
    }
  }
  
  static debug(message: string, context?: LogContext, data?: any) {
    if (!this.enabled) return;
    
    const prefix = this.formatPrefix('DEBUG', context);
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
  
  private static formatPrefix(level: string, context?: LogContext): string {
    let prefix = `[CART_TRANSFORM:${level}]`;
    
    if (context) {
      const parts: string[] = [];
      if (context.phase) parts.push(`phase=${context.phase}`);
      if (context.operation) parts.push(`op=${context.operation}`);
      if (context.bundleId) parts.push(`bundle=${context.bundleId.substring(0, 8)}...`);
      if (context.cartLineId) parts.push(`line=${context.cartLineId.substring(0, 8)}...`);
      
      if (parts.length > 0) {
        prefix += `[${parts.join(',')}]`;
      }
    }
    
    return prefix;
  }
  
  // Performance tracking
  static startTimer(operation: string, context?: LogContext): () => void {
    if (!this.enabled) return () => {};
    
    const startTime = Date.now();
    this.debug(`Started ${operation}`, context);
    
    return () => {
      const elapsed = Date.now() - startTime;
      this.debug(`Completed ${operation} in ${elapsed}ms`, context);
    };
  }
  
  // Summary logging for key operations
  static summary(operation: string, result: any, context?: LogContext) {
    if (!this.enabled) return;
    
    this.info(`${operation} completed`, context, {
      success: !!result,
      resultType: typeof result,
      resultLength: Array.isArray(result) ? result.length : undefined
    });
  }
}