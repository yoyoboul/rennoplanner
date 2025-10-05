import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.renoplanner.app',
  appName: 'Reno Planner',
  webDir: 'out',
  
  // Configuration serveur - TOUJOURS actif car l'app nécessite les API routes
  server: {
    // Pour émulateur Android : utilisez 10.0.2.2
    // Pour appareil réel : changez cette IP vers votre IP locale
    // Pour trouver votre IP : ipconfig getifaddr en0 (Mac) ou ipconfig (Windows)
    url: 'http://192.168.1.90:3000',
    cleartext: true,
    androidScheme: 'https',
  },

  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: '#ffffff',
  },

  // Configuration des plugins
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#3b82f6', // Bleu de l'app
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#3b82f6',
    },
  },
};

export default config;
