import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.devhorizon.askthemanual',
  appName: 'Ask the Manual',
  webDir: 'dist',
  server: {
    url: 'https://aistudio.devhorizon.online/ask-the-manual/',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0a0c14',
  },
};

export default config;