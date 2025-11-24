# Guia de Implementação: Overlay com Acessibilidade (Estilo Gigu)

## 📋 O que é o Gigu?

O **GigU (Gigu)** é um aplicativo para motoristas que:
- Usa **AccessibilityService** do Android para ler a tela
- Cria um **overlay flutuante** sobre outros apps
- Captura **automaticamente** ofertas de corrida (Uber, 99, iFood)
- Analisa em **tempo real** se a corrida compensa
- Mostra um **semáforo de cores** (verde/amarelo/vermelho)

## 🔧 Implementação Técnica

### 1. Módulo Nativo Android Necessário

Como o Expo Go não suporta módulos nativos, precisamos fazer **eject** ou usar **Development Build**.

### 2. Estrutura Necessária

```
android/
├── app/src/main/
│   ├── java/com/driverflow/
│   │   ├── MainActivity.java
│   │   ├── OverlayService.java (novo)
│   │   ├── AccessibilityService.java (novo)
│   │   └── OverlayModule.java (novo)
│   └── res/
│       └── xml/
│           └── accessibility_service_config.xml (novo)
└── AndroidManifest.xml (modificar)
```

### 3. Permissões Necessárias

#### AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />

<service
    android:name=".AccessibilityService"
    android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
    android:exported="true">
    <intent-filter>
        <action android:name="android.accessibilityservice.AccessibilityService" />
    </intent-filter>
    <meta-data
        android:name="android.accessibilityservice"
        android:resource="@xml/accessibility_service_config" />
</service>

<service
    android:name=".OverlayService"
    android:enabled="true"
    android:exported="false" />
```

### 4. AccessibilityService.java

Este serviço lê o conteúdo da tela e detecta ofertas de corrida:

```java
package com.driverflow;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.view.accessibility.AccessibilityEvent;
import android.util.Log;

public class CorridaAccessibilityService extends AccessibilityService {
    
    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Detectar quando tela muda
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            String packageName = event.getPackageName().toString();
            
            // Verificar se é app de corrida (Uber, 99, iFood)
            if (packageName.contains("uber") || 
                packageName.contains("app99") || 
                packageName.contains("ifood")) {
                
                // Extrair informações da tela
                String screenContent = event.getText().toString();
                parseCorridaData(screenContent);
            }
        }
    }
    
    private void parseCorridaData(String content) {
        // Usar regex ou análise de texto para extrair:
        // - Valor da corrida
        // - Distância
        // - Tempo estimado
        
        // Enviar dados para o OverlayService
        OverlayService.updateOverlay(extractedData);
    }
    
    @Override
    public void onInterrupt() {
        Log.d("Accessibility", "Service interrupted");
    }
    
    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS;
        setServiceInfo(info);
    }
}
```

### 5. OverlayService.java

Este serviço cria a janela flutuante:

```java
package com.driverflow;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

public class OverlayService extends Service {
    private WindowManager windowManager;
    private View overlayView;
    
    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        createOverlay();
    }
    
    private void createOverlay() {
        LayoutInflater inflater = LayoutInflater.from(this);
        overlayView = inflater.inflate(R.layout.overlay_layout, null);
        
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O 
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );
        
        params.gravity = Gravity.TOP | Gravity.CENTER;
        params.x = 0;
        params.y = 100;
        
        windowManager.addView(overlayView, params);
    }
    
    public static void updateOverlay(CorridaData data) {
        // Atualizar UI do overlay com dados da corrida
        // Mostrar análise (compensa ou não)
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (overlayView != null) {
            windowManager.removeView(overlayView);
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
```

### 6. React Native Bridge

Para comunicar com JavaScript:

```java
// OverlayModule.java
package com.driverflow;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class OverlayModule extends ReactContextBaseJavaModule {
    
    public OverlayModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    
    @Override
    public String getName() {
        return "OverlayModule";
    }
    
    @ReactMethod
    public void requestOverlayPermission(Promise promise) {
        // Abrir configurações de sobreposição
    }
    
    @ReactMethod
    public void requestAccessibilityPermission(Promise promise) {
        // Abrir configurações de acessibilidade
    }
    
    @ReactMethod
    public void startOverlay(Promise promise) {
        // Iniciar overlay
    }
    
    @ReactMethod
    public void stopOverlay(Promise promise) {
        // Parar overlay
    }
}
```

## 📱 Uso no React Native

```javascript
import { NativeModules } from 'react-native';

const { OverlayModule } = NativeModules;

// Solicitar permissões
await OverlayModule.requestOverlayPermission();
await OverlayModule.requestAccessibilityPermission();

// Iniciar overlay
await OverlayModule.startOverlay();
```

## ⚠️ Limitações do Expo

O Expo Go **NÃO suporta** módulos nativos. Para implementar isso, você precisa:

1. **Fazer eject** do Expo (`expo eject`)
2. Ou usar **Development Build** (`expo prebuild`)
3. Criar módulo nativo Android
4. Compilar APK customizado

## 🚀 Alternativa Temporária (Implementada)

Por enquanto, o app usa:
- ✅ Captura de foto/screenshot manual
- ✅ Análise automática de viabilidade
- ✅ Interface moderna e intuitiva

Para implementar o overlay como o Gigu, será necessário desenvolver o módulo nativo Android.

## 📚 Recursos

- [Android AccessibilityService](https://developer.android.com/reference/android/accessibilityservice/AccessibilityService)
- [Android Overlay Windows](https://developer.android.com/reference/android/view/WindowManager.LayoutParams#TYPE_APPLICATION_OVERLAY)
- [GigU Site Oficial](https://www.gigu.app/pt)


