# 🤖 Asistente Musical Inteligente - Spotify Chatbot

Un chatbot de música inteligente desarrollado en React que funciona con un **Backend for Frontend (BFF)** desarrollado en .NET. La aplicación utiliza modelos de IA avanzados (Gemini y Anthropic) para proporcionar recomendaciones musicales, análisis de artistas y asistencia musical personalizada.

## ✨ Características Principales

### 🎵 Funcionalidades Musicales
- **Recomendaciones personalizadas** de canciones y artistas
- **Análisis de géneros musicales** y sus características
- **Información detallada** sobre artistas, álbumes y canciones
- **Ideas para listas de reproducción** temáticas
- **Descubrimiento musical** basado en preferencias

### 🧠 Inteligencia Artificial
- **Conversaciones contextuales** que recuerdan la conversación actual
- **Múltiples modelos de IA**: Gemini (Google) y Anthropic (Claude)
- **Análisis musical profundo** con comprensión de géneros y estilos
- **Recomendaciones adaptativas** basadas en el contexto

### 🎛️ Interfaz de Usuario
- **Menú principal interactivo** inspirado en interfaces CLI
- **Pantalla de bienvenida** con información de funcionalidades
- **Configuración de modelos** y URL del BFF
- **Información de conversación** con estadísticas y historial
- **Diseño responsive** y moderno con Tailwind CSS

## 🏗️ Arquitectura

### Frontend (React + TypeScript)
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **Vite** como build tool
- **Componentes modulares** y reutilizables

### Backend (BFF .NET)
- **Backend for Frontend** desarrollado en .NET
- **Integración con APIs de IA** (Gemini y Anthropic)
- **Gestión de conversaciones** y contexto
- **API RESTful** para comunicación con el frontend

## 🚀 Instalación y Configuración

### Prerequisitos
- Node.js (versión 18 o superior)
- npm o yarn
- BFF .NET ejecutándose

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone [URL_DEL_REPOSITORIO]
cd chatbot-de-música-spotify
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con la URL de tu BFF:
```env
VITE_BFF_URL=https://tu-bff-url.com/api
```

4. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

5. **Compilar para producción**
```bash
npm run build
```

## 🎮 Uso de la Aplicación

### Menú Principal
Al abrir la aplicación, encontrarás un menú principal con las siguientes opciones:

1. **💬 Iniciar nuevo chat**
   - Permite comenzar una nueva conversación
   - Selección de modelo de IA (Gemini o Anthropic)
   - Confirmación si hay una conversación activa

2. **📚 Ver historial** *(Próximamente)*
   - Funcionalidad planificada para cuando el BFF soporte persistencia

3. **⚙️ Configuración**
   - Configurar URL del BFF
   - Seleccionar modelo de IA preferido
   - Verificar estado de conexión

### Uso del Chat
- **Preguntas contextuales**: El asistente recuerda toda la conversación
- **Referencias**: Puedes usar "esa canción", "el artista anterior", etc.
- **Recomendaciones**: Usa "más como esa" para sugerencias similares
- **Información**: Pregunta sobre artistas, géneros, historia musical

### Ejemplos de Preguntas
```
• "Recomiéndame canciones de rock alternativo de los 90s"
• "¿Qué caracteriza al jazz fusion?"
• "Cuéntame sobre la historia de Radiohead"
• "Más canciones como la anterior"
• "Crea una lista para entrenar"
```

## 🔧 Configuración del BFF

### Variables de Entorno
```env
VITE_BFF_URL=https://tu-bff-url.com/api
```

### Endpoints Esperados
El BFF debe implementar los siguientes endpoints:

```
POST /api/chat/send
- Enviar mensaje al asistente
- Body: { message: string, model: string }
- Response: { response: string, error?: string }

GET /api/chat/models
- Obtener modelos disponibles
- Response: { models: string[] }
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatHistory.tsx        # Historial de mensajes
│   │   ├── ChatInput.tsx          # Input para enviar mensajes
│   │   └── ChatMessageItem.tsx    # Componente de mensaje individual
│   ├── menu/
│   │   ├── MainMenu.tsx           # Menú principal lateral
│   │   ├── ConfigModal.tsx        # Modal de configuración
│   │   ├── NewChatModal.tsx       # Modal para nuevo chat
│   │   ├── ModelSelector.tsx      # Selector de modelo de IA
│   │   └── ConversationInfo.tsx   # Información de conversación
│   └── shared/
│       ├── Button.tsx             # Componente de botón
│       ├── ErrorMessage.tsx       # Mensajes de error
│       ├── LoadingSpinner.tsx     # Spinner de carga
│       ├── Icons.tsx              # Iconos SVG
│       └── WelcomeScreen.tsx      # Pantalla de bienvenida
├── hooks/
│   └── useChatSession.ts          # Hook para gestión de chat
├── services/
│   └── geminiService.ts           # Servicio de comunicación con BFF
├── types/
│   └── index.ts                   # Tipos TypeScript
├── utils/                         # Utilidades
├── styles/
│   └── globals.css                # Estilos globales
├── App.tsx                        # Componente principal
└── main.tsx                       # Punto de entrada
```

## 🎨 Personalización

### Temas y Estilos
- Los estilos están definidos en **Tailwind CSS**
- Paleta de colores: Púrpura y rosa con tonos oscuros
- Componentes modulares para fácil personalización

### Agregar Nuevos Modelos
1. Actualizar el tipo en `types/index.ts`
2. Agregar el modelo en `ModelSelector.tsx`
3. Configurar el endpoint en el BFF

## 🔄 Flujo de Conversación

1. **Inicio**: Pantalla de bienvenida
2. **Nuevo Chat**: Selección de modelo → Inicialización
3. **Conversación**: Mensajes contextuales con IA
4. **Información**: Estadísticas y contexto disponibles
5. **Configuración**: Cambio de modelo y URL en cualquier momento

## 📊 Funcionalidades Técnicas

### Estado de la Aplicación
- **Conversaciones en memoria**: No hay persistencia local
- **Gestión de estado**: React hooks personalizados
- **Manejo de errores**: Mensajes informativos al usuario

### Comunicación con el BFF
- **Llamadas asíncronas** con manejo de errores
- **Timeout configurable** para requests
- **Estado de carga** visible al usuario

## 🚧 Desarrollo Futuro

### Funcionalidades Planificadas
- [ ] **Historial persistente** cuando el BFF lo soporte
- [ ] **Integración con Spotify API** para reproducción
- [ ] **Exportar conversaciones** a diferentes formatos
- [ ] **Personalización de temas** visuales
- [ ] **Comandos rápidos** para funciones comunes

### Mejoras Técnicas
- [ ] **Pruebas unitarias** con Jest/React Testing Library
- [ ] **Optimización de rendimiento** con React.memo
- [ ] **PWA** para uso offline limitado
- [ ] **Internacionalización** (i18n)

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o encuentras problemas:
- Abre un **Issue** en GitHub
- Revisa la documentación del BFF
- Verifica la configuración de variables de entorno

---

**Desarrollado con ❤️ usando React, TypeScript y Tailwind CSS**
