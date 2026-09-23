import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.samarthbuilds.arrowescape',
  appName: 'Arrow Escape',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#020617',
    allowMixedContent: true,
  },
};

export default config;
