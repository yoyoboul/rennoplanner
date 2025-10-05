import { toast } from 'sonner';

// ============================================
// ERROR MESSAGE FORMATTING
// ============================================

interface APIError {
  error: string;
  code?: string;
  details?: Record<string, string[]> | string;
  timestamp?: string;
}

/**
 * Extrait et formate les messages d'erreur API
 */
export function formatAPIError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const apiError = error as Partial<APIError>;

    if (apiError.error) {
      // Si on a des détails de validation
      if (apiError.details && typeof apiError.details === 'object') {
        const validationErrors = Object.entries(apiError.details)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        return `${apiError.error}\n${validationErrors}`;
      }

      return apiError.error;
    }
  }

  return 'Une erreur inattendue est survenue';
}

/**
 * Affiche un toast d'erreur formaté
 */
export function showErrorToast(error: unknown, fallbackMessage?: string): void {
  const message = formatAPIError(error) || fallbackMessage || 'Une erreur est survenue';
  
  toast.error(message, {
    duration: 5000,
    closeButton: true,
  });
}

/**
 * Affiche un toast de succès
 */
export function showSuccessToast(message: string): void {
  toast.success(message, {
    duration: 3000,
  });
}

/**
 * Affiche un toast d'avertissement
 */
export function showWarningToast(message: string): void {
  toast.warning(message, {
    duration: 4000,
  });
}

/**
 * Affiche un toast d'info
 */
export function showInfoToast(message: string): void {
  toast.info(message, {
    duration: 3000,
  });
}

// ============================================
// ERROR HANDLING UTILITIES
// ============================================

/**
 * Wrapper pour les appels API avec gestion d'erreurs
 */
export async function handleAPICall<T>(
  apiCall: () => Promise<Response>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    showSuccess?: boolean;
  }
): Promise<T> {
  try {
    const response = await apiCall();

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `Erreur ${response.status}: ${response.statusText}`,
      }));

      throw errorData;
    }

    const data = await response.json();

    if (options?.showSuccess && options?.successMessage) {
      showSuccessToast(options.successMessage);
    }

    return data;
  } catch (error) {
    showErrorToast(error, options?.errorMessage);
    throw error;
  }
}

/**
 * Vérifie si une erreur est une erreur de rate limit
 */
export function isRateLimitError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as Partial<APIError>;
    return apiError.code === 'RATE_LIMIT_EXCEEDED';
  }
  return false;
}

/**
 * Vérifie si une erreur est une erreur de validation
 */
export function isValidationError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as Partial<APIError>;
    return apiError.code === 'VALIDATION_ERROR';
  }
  return false;
}

/**
 * Extrait les erreurs de validation par champ
 */
export function getValidationErrors(error: unknown): Record<string, string[]> | null {
  if (!isValidationError(error)) {
    return null;
  }

  const apiError = error as APIError;
  if (typeof apiError.details === 'object') {
    return apiError.details;
  }

  return null;
}

// ============================================
// RETRY LOGIC
// ============================================

/**
 * Retry une fonction avec backoff exponentiel
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        showInfoToast(`Nouvelle tentative dans ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ============================================
// NETWORK ERROR DETECTION
// ============================================

/**
 * Vérifie si l'erreur est due à un problème réseau
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    );
  }
  return false;
}

/**
 * Affiche un message approprié selon le type d'erreur
 */
export function handleError(error: unknown, context?: string): void {
  if (isNetworkError(error)) {
    showErrorToast(
      'Problème de connexion. Vérifiez votre connexion internet et réessayez.'
    );
  } else if (isRateLimitError(error)) {
    showWarningToast(formatAPIError(error));
  } else if (isValidationError(error)) {
    showErrorToast(error);
  } else {
    const message = context
      ? `${context}: ${formatAPIError(error)}`
      : formatAPIError(error);
    showErrorToast(message);
  }
}

