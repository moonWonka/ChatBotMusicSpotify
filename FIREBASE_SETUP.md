# Firebase Configuration Setup

## 📋 Configuración de Firebase para Authentication

### 1. Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Authentication** en el proyecto

### 2. Configurar Authentication Providers

#### Email/Password
1. En Authentication → Sign-in method
2. Habilita **Email/Password**

#### Google OAuth
1. En Authentication → Sign-in method  
2. Habilita **Google**
3. Configura el email del proyecto

### 3. Obtener Configuración del Proyecto

1. Ve a Project Settings (⚙️)
2. En la sección "Your apps", selecciona la app web
3. Copia la configuración de Firebase

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com  
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 5. Configurar Dominios Autorizados

En Authentication → Settings → Authorized domains:
- Agrega tu dominio de desarrollo (localhost:5173)
- Agrega tu dominio de producción

## 🔧 Estructura de Archivos

```
src/
├── firebaseConfig.ts           # Configuración Firebase
├── services/
│   └── firebaseAuthService.ts  # Servicio de autenticación
└── hooks/
    └── useAuth.ts              # Hook React para auth
```

## 🚀 Funcionalidades Implementadas

- ✅ **Login con Email/Password**
- ✅ **Registro de usuarios**
- ✅ **Login con Google OAuth**
- ✅ **Logout**
- ✅ **Estado de autenticación en tiempo real**
- ✅ **Manejo de errores en español**
- ✅ **Persistencia automática de sesión**

## 🛠 Uso

```tsx
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, login, logout, isLoading } = useAuth();
  
  if (isLoading) return <div>Cargando...</div>;
  
  return user ? <Dashboard /> : <LoginPage />;
}
```

## 🔒 Seguridad

- Variables de entorno para credenciales sensibles
- Manejo seguro de tokens Firebase
- Validación de errores Firebase
- Dominios autorizados configurados