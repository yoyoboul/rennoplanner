import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.renoplanner.app',
  appName: 'Reno Planner',
  webDir: 'out',
  
  // Configuration serveur - Pointe vers Vercel pour fonctionner partout
  server: {
    // URL de production Vercel - l'app fonctionnera depuis n'importe où
    url: 'https://rennoplanner.vercel.app',
    cleartext: false, // HTTPS donc false
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
