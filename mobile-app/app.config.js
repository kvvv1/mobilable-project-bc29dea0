export default {
  expo: {
    name: "Corrida Certa - Gestão Inteligente para Motoristas de Aplicativos",
    slug: "corrida-certa",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#8B5CF6"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "Precisamos acessar sua câmera para capturar informações de corridas.",
        NSPhotoLibraryUsageDescription: "Precisamos acessar suas fotos para processar screenshots de corridas."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#8B5CF6"
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      package: "com.driverflow.app",
      versionCode: 1
    },
    scheme: "corridacerta",
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wlfmhygheizuuyohcbyj.supabase.co',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZm1oeWdoZWl6dXV5b2hjYnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDM3NjMsImV4cCI6MjA3OTMxOTc2M30.ojY2FqJq24HzPqf2DwiFDZUCCzA7LlUIDUCRtORZm00',
    }
  }
};

