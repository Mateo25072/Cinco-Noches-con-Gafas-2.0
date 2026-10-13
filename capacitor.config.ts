import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cinconoches.gafas",
  appName: "Cinco Noches con Gafas",
  webDir: "dist-android",
  android: {
    allowMixedContent: false,
  },
};

export default config;
