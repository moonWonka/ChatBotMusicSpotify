# 🎵 Chatbot de Música S│   └── chat/            # Componentes del chat
│       ├── ChatHistory.tsx
│       ├── ChatInput.tsx
│       └── ChatMessageItem.tsx
├── services/            # Servicios de API
Un chatbot inteligente especializado en música que utiliza un backend para procesar las consultas de IA y proporcionar recomendaciones musicales, información sobre artistas, géneros y crear ideas para listas de reproducción.

## ✨ Características Principales

- **🤖 IA Conversacional**: Integración directa con BFF (.NET) para llamadas a modelos de IA
- **📱 Interfaz Moderna**: Diseño responsive con tema oscuro y componentes reutilizables  
- **� Conversaciones en Memoria**: Sesiones temporales durante el uso de la aplicación
- **🎨 Componentes Shared**: Arquitectura modular con componentes reutilizables
- **⚡ Streaming Simulado**: Respuestas de la IA en tiempo real (simulado)
- **🎯 Especialización Musical**: Enfocado en música, artistas, géneros y Spotify
- **🔄 Arquitectura Simplificada**: Frontend comunica directamente con BFF (.NET)

## 🏗️ Arquitectura

```
src/
├── components/
│   ├── shared/          # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Icons.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorMessage.tsx
│   ├── chat/            # Componentes del chat
│   │   ├── ChatHistory.tsx
│   │   ├── ChatInput.tsx
│   │   └── ChatMessageItem.tsx
│   └── history/         # Componentes del historial
│       └── HistorySidebar.tsx
├── services/            # Servicios de API
│   └── chatService.ts   # Servicio BFF para comunicación con IA (.NET)
├── hooks/               # Custom hooks
│   └── useChatSession.ts
├── types/               # Definiciones TypeScript
│   └── index.ts
└── styles/              # Estilos globales
    └── globals.css

server/                  # ELIMINADO - Sin backend local
                        # Solo se usa BFF (.NET) externo
```

## 🚀 Instalación y Configuración

### Prerequisitos
- Node.js 18+

### 1. Instalar dependencias del frontend

```bash
# Solo se necesita instalar el frontend
npm install
```

### 2. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env


```

### 3. Ejecutar la aplicación

```bash
# Solo ejecutar el frontend
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5173
- **BFF (.NET)**: Configurado en VITE_BFF_URL

## 🎯 Funcionalidades

### Chat Inteligente
- Conversaciones fluidas sobre música
- Recomendaciones personalizadas
- Información sobre artistas y géneros
- Ideas para listas de reproducción

### Gestión de Historial
- Guarda automáticamente las conversaciones
- Sidebar con lista de sesiones anteriores
- Búsqueda y eliminación de conversaciones
- Títulos automáticos basados en el contenido

### Componentes Reutilizables
- **Button**: Botón con múltiples variantes y tamaños
- **Icons**: Conjunto de iconos SVG optimizados
- **LoadingSpinner**: Indicador de carga animado
- **ErrorMessage**: Mensajes de error estilizados

## 🔧 API Endpoints

### BFF (Backend for Frontend) - IA y Chat
```bash
# Enviar mensaje al chatbot (BFF maneja la IA)
POST /chat
```

### Backend Local - Gestión de Historial

```bash
# Enviar mensaje al chatbot (BFF maneja la IA)
POST /chat

# Obtener historial de conversaciones (Backend local)
GET /api/history

# Obtener sesión específica  
GET /api/history/:sessionId

# Crear/actualizar sesión
POST /api/history

# Actualizar sesión existente
PUT /api/history/:sessionId

# Eliminar sesión
DELETE /api/history/:sessionId

# Health check
GET /api/health
```

## 🎨 Personalización

### Temas y Estilos
Los estilos están construidos con **Tailwind CSS** y pueden personalizarse en:
- `src/styles/globals.css` - Estilos globales
- `tailwind.config.js` - Configuración de Tailwind

### Componentes Shared
Los componentes en `src/components/shared/` están diseñados para ser reutilizables:

```tsx
// Ejemplo de uso del Button
<Button 
  variant="primary" 
  size="lg" 
  onClick={handleClick}
>
  Texto del botón
</Button>
```

## 🔒 Configuración de Seguridad

- **BFF maneja todas las llamadas a servicios de IA** (separación de responsabilidades)
- **Backend local** solo maneja historial y gestión de sesiones
- Las API keys de IA se configuran en el BFF (no en el frontend ni backend local)
- El backend local incluye validación de datos
- CORS configurado para desarrollo local

## 🛠️ Desarrollo

### Scripts Disponibles

```bash
npm run dev          # Ejecutar frontend en desarrollo
npm run build        # Construir para producción  
npm run preview      # Vista previa de la build
npm run server       # Ejecutar backend en desarrollo
npm run start:full   # Ejecutar frontend + backend
```

### Estructura de Datos

```typescript
interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessageContent[];
}

interface ChatMessageContent {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: number;
}
```

## 📚 Tecnologías Utilizadas

### Frontend
- **React 19** + **TypeScript**
- **Vite** para desarrollo rápido
- **Tailwind CSS** para estilos
- **Arquitectura basada en servicios** con separación BFF/Backend local

### Backend Local
- **Express.js** servidor REST (solo historial)
- **fs-extra** para manejo de archivos
- **CORS** para cross-origin requests

### BFF (Backend for Frontend)
- **Maneja todas las llamadas a IA**
- **API genérica configurable** via VITE_BFF_URL
- **Separación de responsabilidades** entre IA y persistencia

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.
