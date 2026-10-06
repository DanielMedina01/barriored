import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'co.barriored.app',
  appName: 'BarrioRed',
  webDir: 'dist',
  android: { backgroundColor: '#f7f8f2' },
  ios: { backgroundColor: '#f7f8f2', contentInset: 'automatic' },
};
export default config;
