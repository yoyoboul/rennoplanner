import { RateLimitError } from './errors';

// ============================================
// IN-MEMORY RATE LIMITER
// ============================================

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestLog {
  timestamps: number[];
}

class RateLimiter {
  private requests: Map<string, RequestLog>;
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.requests = new Map();
    this.config = config;
    
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Vérifie si une requête est autorisée pour un identifiant donné
   */
  check(identifier: string): boolean {
    const now = Date.now();
    const log = this.requests.get(identifier) || { timestamps: [] };

    // Filtrer les timestamps dans la fenêtre de temps
    const windowStart = now - this.config.windowMs;
    log.timestamps = log.timestamps.filter((ts) => ts > windowStart);

    // Vérifier la limite
    if (log.timestamps.length >= this.config.maxRequests) {
      return false;
    }

    // Enregistrer la nouvelle requête
    log.timestamps.push(now);
    this.requests.set(identifier, log);

    return true;
  }

  /**
   * Retourne le nombre de requêtes restantes
   */
  remaining(identifier: string): number {
    const log = this.requests.get(identifier);
    if (!log) return this.config.maxRequests;

    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const validTimestamps = log.timestamps.filter((ts) => ts > windowStart);

    return Math.max(0, this.config.maxRequests - validTimestamps.length);
  }

  /**
   * Retourne le temps en ms avant le prochain reset
   */
  resetTime(identifier: string): number {
    const log = this.requests.get(identifier);
    if (!log || log.timestamps.length === 0) return 0;

    const oldestTimestamp = Math.min(...log.timestamps);
    const resetTime = oldestTimestamp + this.config.windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }

  /**
   * Nettoie les anciennes entrées
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [identifier, log] of this.requests.entries()) {
      log.timestamps = log.timestamps.filter((ts) => ts > windowStart);
      
      if (log.timestamps.length === 0) {
        this.requests.delete(identifier);
      }
    }
  }

  /**
   * Réinitialise le rate limit pour un identifiant
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Nettoie et arrête le cleanup automatique
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requests.clear();
  }
}

// ============================================
// RATE LIMITERS INSTANCES
// ============================================

// Rate limiter pour l'API OpenAI
// 20 requêtes par heure par projet
export const openaiRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60 * 60 * 1000, // 1 heure
});

// Rate limiter général pour l'API
// 100 requêtes par minute par IP
export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
});

// Rate limiter pour la création de ressources
// 10 créations par minute
export const createRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
});

// ============================================
// MIDDLEWARE HELPERS
// ============================================

/**
 * Extrait l'IP du client depuis la requête
 */
export function getClientIdentifier(request: Request): string {
  // En production, utiliser le header X-Forwarded-For
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback sur l'IP réelle (moins fiable derrière un proxy)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback ultime
  return 'unknown';
}

/**
 * Vérifie le rate limit et lance une erreur si dépassé
 */
export function checkRateLimit(
  limiter: RateLimiter,
  identifier: string,
  errorMessage?: string
): void {
  if (!limiter.check(identifier)) {
    const resetTime = limiter.resetTime(identifier);
    const resetInSeconds = Math.ceil(resetTime / 1000);
    
    throw new RateLimitError(
      errorMessage || 
      `Limite de requêtes atteinte. Réessayez dans ${resetInSeconds} secondes.`
    );
  }
}

/**
 * Headers de rate limit pour les réponses API
 */
export function getRateLimitHeaders(
  limiter: RateLimiter,
  identifier: string
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
    'X-RateLimit-Remaining': limiter.remaining(identifier).toString(),
    'X-RateLimit-Reset': new Date(
      Date.now() + limiter.resetTime(identifier)
    ).toISOString(),
  };
}

// ============================================
// ADVANCED RATE LIMITING STRATEGIES
// ============================================

/**
 * Rate limiter adaptatif qui ajuste les limites selon l'utilisation
 */
export class AdaptiveRateLimiter extends RateLimiter {
  private abusers: Set<string>;

  constructor(config: RateLimitConfig) {
    super(config);
    this.abusers = new Set();
  }

  check(identifier: string): boolean {
    // Si l'utilisateur est marqué comme abuseur, limite plus stricte
    if (this.abusers.has(identifier)) {
      const strictConfig = {
        maxRequests: Math.floor(this.config.maxRequests / 2),
        windowMs: this.config.windowMs,
      };
      
      const log = this.requests.get(identifier) || { timestamps: [] };
      const now = Date.now();
      const windowStart = now - strictConfig.windowMs;
      const validTimestamps = log.timestamps.filter((ts) => ts > windowStart);
      
      if (validTimestamps.length >= strictConfig.maxRequests) {
        return false;
      }
    }

    const allowed = super.check(identifier);
    
    // Marquer comme abuseur si limite atteinte 3 fois d'affilée
    if (!allowed) {
      this.markAsAbuser(identifier);
    }
    
    return allowed;
  }

  private markAsAbuser(identifier: string): void {
    this.abusers.add(identifier);
    
    // Retirer le marqueur après 1 heure
    setTimeout(() => {
      this.abusers.delete(identifier);
    }, 60 * 60 * 1000);
  }
}

// ============================================
// EXPORT UTILITY FUNCTION
// ============================================

/**
 * Wrapper pour protéger une route API avec rate limiting
 */
export async function withRateLimit<T>(
  request: Request,
  limiter: RateLimiter,
  handler: () => Promise<T>,
  identifierOverride?: string
): Promise<T> {
  const identifier = identifierOverride || getClientIdentifier(request);
  checkRateLimit(limiter, identifier);
  return handler();
}

