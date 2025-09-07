// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const isDevelopment = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.yrdly.app',
  appName: 'Yrdly',
  webDir: 'out',
  
  // Development server configuration (only for dev builds)
  ...(isDevelopment && {
    server: { 
      url: 'http://10.0.2.2:9002', 
      cleartext: true 
    }
  }),
  
  // Production-ready configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#ffffff",
      overlaysWebView: false,
      contentStyle: "dark-content"
    }
  },
  
  // Exclude unnecessary files from sync
  includePlugins: [
    '@capacitor/app',
    '@capacitor/haptics',
    '@capacitor/splash-screen',
    '@capacitor/status-bar'
  ]
};

export default config;