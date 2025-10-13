/**
 * Configuration pour l'application mobile (Capacitor)
 */

export const mobileConfig = {
  // URL de l'API backend
  // En développement: localhost avec port Android emulator (10.0.2.2)
  // En production: votre serveur déployé
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://10.0.2.2:3000',
  
  // Timeout des requêtes API
  apiTimeout: 30000,
  
  // Configuration de l'app
  app: {
    name: 'Reno Planner',
    version: '1.0.0',
    bundleId: 'com.renoplanner.app',
  },
};

export default mobileConfig;



