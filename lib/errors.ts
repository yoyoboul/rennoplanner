import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// ============================================
// ERROR CLASSES
// ============================================

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    const message = id 
      ? `${resource} avec l'ID ${id} introuvable`
      : `${resource} introuvable`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Non autorisé') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Accès interdit') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Trop de requêtes, veuillez réessayer plus tard') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(
      `Erreur du service ${service}`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      originalError?.message
    );
    this.name = 'ExternalServiceError';
  }
}

// ============================================
// ERROR HANDLER
// ============================================

interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}

export function handleAPIError(error: unknown): NextResponse<ErrorResponse> {
  const timestamp = new Date().toISOString();

  // AppError (nos erreurs personnalisées)
  if (error instanceof AppError) {
    logError(error);
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp,
      },
      { status: error.statusCode }
    );
  }

  // Zod Validation Error
  if (error instanceof ZodError) {
    const validationErrors: Record<string, string[]> = {};
    error.issues.forEach((err) => {
      const path = err.path.join('.');
      if (!validationErrors[path]) {
        validationErrors[path] = [];
      }
      validationErrors[path].push(err.message);
    });

    logError(error);
    return NextResponse.json(
      {
        error: 'Erreur de validation',
        code: 'VALIDATION_ERROR',
        details: validationErrors,
        timestamp,
      },
      { status: 400 }
    );
  }

  // Database errors
  if (error instanceof Error && error.message.includes('SQLITE')) {
    logError(error);
    return NextResponse.json(
      {
        error: 'Erreur de base de données',
        code: 'DATABASE_ERROR',
        timestamp,
      },
      { status: 500 }
    );
  }

  // Unknown errors
  console.error('[UNKNOWN ERROR]', error);
  return NextResponse.json(
    {
      error: 'Une erreur inattendue est survenue',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp,
    },
    { status: 500 }
  );
}

// ============================================
// LOGGING
// ============================================

interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  error?: Error;
  context?: Record<string, unknown>;
}

function logError(error: Error, context?: Record<string, unknown>): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    error,
    context,
  };

  // En production, vous pourriez envoyer vers un service de logging
  // comme Sentry, LogRocket, Datadog, etc.
  if (process.env.NODE_ENV === 'production') {
    // TODO: Intégrer avec service de logging
    console.error('[ERROR]', JSON.stringify(logEntry, null, 2));
  } else {
    console.error('[ERROR]', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      context,
    });
  }
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    message,
    context,
  };

  console.warn('[WARN]', logEntry);
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    context,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log('[INFO]', logEntry);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Wrapper pour exécuter une fonction API avec gestion d'erreurs automatique
 */
export async function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<NextResponse<T> | NextResponse<ErrorResponse>> {
  try {
    const result = await handler();
    return NextResponse.json(result);
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Vérifie qu'une ressource existe, sinon lance une NotFoundError
 */
export function assertExists<T>(
  resource: T | null | undefined,
  resourceName: string,
  id?: string | number
): asserts resource is T {
  if (!resource) {
    throw new NotFoundError(resourceName, id);
  }
}

/**
 * Wrapper pour les opérations async avec retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        logWarn(`Tentative ${attempt}/${maxRetries} échouée, nouvelle tentative...`, {
          error: lastError.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw new AppError(
    `Échec après ${maxRetries} tentatives: ${lastError?.message}`,
    500,
    'RETRY_FAILED'
  );
}

