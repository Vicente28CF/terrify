# ESCANEO MVP — Terrify

> Generado: 28 de mayo de 2026
> Propósito: Documentar el estado actual del proyecto, bugs conocidos, páginas faltantes y tareas priorizadas para llegar a MVP lanzable.

---

## 📊 Estado general

| Métrica | Valor |
|---------|-------|
| Listo para producción | ~75% |
| Bloqueadores críticos | 2 |
| Semana estimada para lanzar | Sí — 2 a 3 días de trabajo focalizado |

---

## ✅ Flujos completos y funcionales

### Flujo 1 — Comprador busca terreno
- [x] Llega al home y ve terrenos sin registrarse (`fetchTerrenos()` público)
- [x] Filtra por zona, precio, superficie (componente `TerrainFilterSort`)
- [x] Ve detalle del terreno con fotos y mapa (`/terrenos/[slug]`)
- [x] Contacta al vendedor (requiere autenticación — por diseño)
- [x] Recibe respuesta del vendedor en la app (`/mensajes/[contactId]`)
- [x] Puede guardar favoritos (toggle heart + `/favoritos`)

### Flujo 2 — Vendedor publica terreno
- [x] Se registra y verifica su email (flujo completo con token + resend)
- [x] Publica terreno con wizard de 4 pasos (componente `TerrenoDrawer` modo create)
- [x] El terreno aparece en el home (status = active, filtrado por API)
- [x] Recibe notificación por email cuando alguien contacta (vía Resend)
- [x] Puede responder desde la app (dashboard + chat)
- [x] Puede editar o pausar su terreno (drawer modo edit + `set_status`)

### Flujo 3 — Autenticación
- [x] Registro con email funciona completo (validación + rate limiting)
- [x] Verificación de email funciona (token 24h de expiración)
- [x] Login con email funciona (JWT, 15min access + 7d refresh)
- [x] Login con Google funciona (Google One Tap + creación automática)
- [x] Logout redirige al login (blacklist de refresh token)
- [x] Token refresh automático funciona (vía `requestAuthenticatedJson`)

### Flujo 4 — Mensajería
- [x] Comprador manda primer mensaje (crea `ContactRequest`)
- [x] Vendedor ve el mensaje en su dashboard (sección "Contactos")
- [x] Vendedor puede responder (chat en `/mensajes/[contactId]`)
- [x] Comprador ve la respuesta (polling cada 5 segundos)
- [x] Ambos tienen acceso a `/mensajes` (endpoint `/contact-requests/mine/`)
- [x] Badge de no leídos en navbar (polling cada 10s + evento custom)

### Backend — Infraestructura
- [x] Rate limiting configurado (login, register, contact, message, refresh, global)
- [x] Endpoint `/contact-requests/mine/` para conversaciones del usuario
- [x] Endpoint `/contact-requests/unread-count/` para conteo de no leídos
- [x] Gunicorn configurado (4 workers, 2 threads) en docker-compose
- [x] Settings de producción completos (DEBUG=False, HTTPS, HSTS, CORS, CSP)
- [x] Variables de entorno documentadas en `.env.example`

---

## ❌ Flujos rotos o incompletos

| Flujo | Severidad | Problema |
|-------|-----------|----------|
| Subir imágenes | **RESUELTO** | `terrenos/views.py` y `base.py` usan los settings internos `LOTEX_MAX_TERRAIN_IMAGES` y `LOTEX_MAX_IMAGE_FILE_SIZE`. |
| Contactar vendedor sin cuenta | ⚠️ PARCIAL | El formulario de contacto requiere autenticación. Diseño intencional, pero limita leads. Si se requiere contacto anónimo, hay que crear endpoint público + captcha. |
| Estados vacíos | ⚠️ PARCIAL | Algunas páginas tienen empty state genérico sin botón de acción claro. |
| Notificaciones email | ⚠️ PARCIAL | Depende de Resend. Si no está configurado, falla silenciosamente (solo log warning). |

---

## 🔲 Páginas que no existen

| Página | Archivo | Estado |
|--------|---------|--------|
| **404 — No encontrada** | `frontend/app/not-found.tsx` | ✅ Creado |
| **Error boundary** | `frontend/app/error.tsx` | ✅ Creado |
| **Global error boundary** | `frontend/app/global-error.tsx` | ✅ Creado |
| **Loading route-level** | `frontend/app/loading.tsx` | ✅ Creado |
| **robots.txt** | `frontend/app/robots.ts` | ✅ Creado |
| **sitemap.xml** | `frontend/app/sitemap.ts` | ✅ Creado |

---

## ⚠️ Bugs conocidos

| # | Severidad | Descripción | Archivo | Solución |
|---|-----------|-------------|---------|----------|
| 1 | **RESUELTO** | Settings internos de imágenes unificados como `LOTEX_MAX_TERRAIN_IMAGES` y `LOTEX_MAX_IMAGE_FILE_SIZE`. | `terrenos/views.py`, `backend/config/settings/base.py` | Sin acción pendiente |
| 2 | **MEDIO** | Uso de `<img>` nativo en lugar de Next.js `<Image>` | `terrain-card.tsx:52`, `terreno-drawer.tsx:579,653`, `seller-dashboard.tsx:368` | Reemplazar con `import Image from "next/image"` y ajustar props |
| 3 | **BAJO** | `console.error` y `console.log` en producción | `conversation-thread.tsx:30,33,38`, `favoritos/page.tsx:38` | Eliminar o reemplazar con logger condicional |
| 4 | **BAJO** | CSP bloquea estilos inline de Next.js | `base.py:226` — `CSP_STYLE_SRC` | Agregar `"'unsafe-inline'"` y `"https://fonts.googleapis.com"` |
| 5 | **BAJO** | Footer tenía marca anterior en el copyright | ✅ RESUELTO | Ya dice `"© ${currentYear} Terrify"` dinámicamente |

---

## 📋 Checklist de frontend

| Item | Estado |
|------|--------|
| `<title>` y metadata correcta en todas las páginas | ✅ Sí |
| Bottom nav funciona en todas las páginas | ✅ Sí |
| Responsive mobile (375px) | ⚠️ No probado pero parece funcional |
| Estados de carga (loading) en todas las acciones | ✅ Sí |
| Errores del backend se muestran al usuario | ✅ Sí |
| Estados vacíos con mensaje orientador | ⚠️ Parcial — algunos genéricos |
| Sin `console.error` con errores reales en producción | ❌ Tiene en conversation-thread y favoritos |
| Imágenes usan `<Image>` de Next.js | ❌ 3 componentes usan `<img>` |
| Sin imports sin usar o código muerto obvio | ✅ Ok |

---

## 🔧 Tareas priorizadas para MVP

### 🔴 DEBE tener antes de lanzar

1. **Bug crítico: prefijo de settings incorrecto**
   - Archivos: `backend/config/settings/base.py:171-172` y `terrenos/views.py:293-296`
   - Fix: Unificar nombres a `LOTEX_MAX_TERRAIN_IMAGES` y `LOTEX_MAX_IMAGE_FILE_SIZE`
   - Sin esto: ninguna imagen se puede subir → el MVP no puede publicar terrenos con fotos

2. **Página 404 personalizada**
   - Crear `frontend/app/not-found.tsx`
   - Diseño acorde a la marca (fondo sand, logo LX, enlace a home)
   - Evita que usuarios vean el error genérico de Next.js

3. **Error boundary**
   - Crear `frontend/app/error.tsx` (y `global-error.tsx` para el layout raíz)
   - Botón de "Reintentar" y enlace al home
   - Evita que errores inesperados rompan toda la app

4. **Reemplazar `<img>` por `<Image>` de Next.js**
   - Archivos: `terrain-card.tsx`, `terreno-drawer.tsx`, `seller-dashboard.tsx`
   - Beneficio: optimización automática, lazy loading, evitar warnings en build

5. **CSP: agregar `'unsafe-inline'` para estilos**
   - Archivo: `backend/config/settings/base.py`
   - Línea: `CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com")`
   - También en `CSP_FONT_SRC` agregar `"https://fonts.gstatic.com"`
   - Sin esto: Next.js no renderiza estilos en producción

6. **Eliminar `console.log`/`console.error` de producción**
   - Archivos: `conversation-thread.tsx`, `favoritos/page.tsx`
   - Silenciar o reemplazar con logger que solo corra en desarrollo

### 🟡 IMPORTANTE — Puede esperar una semana

1. **`robots.txt` y `sitemap.xml`** — SEO. Sin robots.txt, Google no indexa bien. Crear en `frontend/app/` o `public/`.
2. **Loading states a nivel de ruta** — Crear `frontend/app/loading.tsx` para transiciones suaves entre páginas.
3. **Contacto sin login** — Evaluar si el MVP necesita contacto anónimo. Si sí, crear endpoint público con captcha + rate limiting distinto.
4. **Verificar Resend configurado** — Probar que las notificaciones de contacto llegan al vendedor.
5. **Prueba en mobile 375px** — Verificar que todas las páginas se ven bien en iPhone SE / pantallas pequeñas.

### 🔵 NICE TO HAVE — Después del lanzamiento

1. Página de precios / planes para agents
2. Panel de administración Django
3. WebSockets en vez de polling cada 5s para mensajería
4. Analytics (vistas, contactos, conversiones)
5. Modo oscuro
6. Internacionalización (inglés)
7. PWA / instalable
8. Tests automatizados (backend + frontend)

---

## 📋 Variables de entorno

### Backend (`backend/.env`)

```
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=<generada>
DB_NAME=terrify_db
DB_USER=terrify_user
DB_PASSWORD=<password>
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
CLOUDINARY_CLOUD_NAME=<valor>
CLOUDINARY_API_KEY=<valor>
CLOUDINARY_API_SECRET=<valor>
RESEND_API_KEY=<valor>
DEFAULT_FROM_EMAIL=noreply@terrify.mx
FRONTEND_URL=https://terrify.mx
GOOGLE_CLIENT_ID=<valor>
ALLOWED_HOSTS=terrify.mx,api.terrify.mx
CORS_ALLOWED_ORIGINS=https://terrify.mx
LOTEX_MAX_TERRAIN_IMAGES=10
LOTEX_MAX_IMAGE_FILE_SIZE=5242880
```

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=https://api.terrify.mx/api
NEXT_PUBLIC_BASE_URL=https://terrify.mx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<mismo que backend>
```

---

## 🚀 Pasos exactos para hacer deploy

### Fase 1 — Correcciones pre-deploy (día 1)

```bash
# 1. Fix bug crítico de settings
# Editar backend/config/settings/base.py:
#   LOTEX_MAX_TERRAIN_IMAGES y LOTEX_MAX_IMAGE_FILE_SIZE se mantienen como settings internos

# 2. Crear páginas faltantes
#   frontend/app/not-found.tsx
#   frontend/app/error.tsx
#   frontend/app/global-error.tsx

# 3. Reemplazar <img> por <Image> en:
#   terrain-card.tsx, terreno-drawer.tsx, seller-dashboard.tsx

# 4. Corregir CSP en base.py

# 5. Eliminar console.log/error de producción
```

### Fase 2 — Build y verificación (día 1-2)

```bash
# Backend — migraciones y static files
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py collectstatic --noinput
docker compose exec backend python manage.py check --deploy

# Frontend — build
cd frontend && npm run lint
cd frontend && npx tsc --noEmit
cd frontend && npm run build
```

### Fase 3 — Deploy (día 2)

```bash
# 1. Copiar .env al servidor
scp backend/.env user@server:/app/backend/.env
scp frontend/.env.local user@server:/app/frontend/.env.local

# 2. Levantar servicios
docker compose up -d db redis backend

# 3. Frontend (perfil separado)
docker compose --profile frontend up -d

# 4. Verificar health
curl https://api.terrify.mx/api/health/

# 5. Configurar Nginx/Caddy con SSL (certbot / Caddy automático)
#    - terrify.mx → frontend (puerto 3000)
#    - api.terrify.mx → backend (puerto 8000)

# 6. DNS
#    terrify.mx → A <IP del servidor>
#    api.terrify.mx → A <IP del servidor>
```

---

## 📁 Endpoints API

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register/` | Registro con email | No |
| POST | `/api/auth/login/` | Login con email | No |
| POST | `/api/auth/google/` | Login con Google | No |
| POST | `/api/auth/logout/` | Logout con blacklist | Sí |
| GET | `/api/auth/verify-email/` | Verificar email (token) | No |
| POST | `/api/auth/resend-verification/` | Reenviar verificación | No |
| POST | `/api/auth/token/refresh/` | Refresh JWT | No |
| GET | `/api/users/me/` | Perfil del usuario | Sí |
| PATCH | `/api/users/me/` | Actualizar perfil | Sí |
| GET | `/api/terrenos/` | Listar terrenos (activos) | No |
| GET | `/api/terrenos/{slug}/` | Detalle del terreno | No |
| POST | `/api/terrenos/` | Crear terreno | Sí |
| PATCH | `/api/terrenos/{slug}/` | Editar terreno | Sí (dueño) |
| DELETE | `/api/terrenos/{slug}/` | Eliminar terreno | Sí (dueño) |
| GET | `/api/terrenos/mine/` | Mis terrenos | Sí |
| POST | `/api/terrenos/{slug}/favorite/` | Agregar favorito | Sí |
| DELETE | `/api/terrenos/{slug}/favorite/` | Quitar favorito | Sí |
| GET | `/api/terrenos/favorites/` | Listar favoritos | Sí |
| POST | `/api/terrenos/{slug}/set_status/` | Cambiar status | Sí (dueño) |
| POST | `/api/terrenos/{slug}/upload-images/` | Subir imágenes | Sí (dueño) |
| PUT | `/api/terrenos/{slug}/images/` | Reemplazar imágenes | Sí (dueño) |
| PATCH | `/api/terrenos/{slug}/images/manage/` | Reordenar imágenes | Sí (dueño) |
| DELETE | `/api/terrenos/{slug}/images/manage/` | Eliminar imagen | Sí (dueño) |
| GET | `/api/contact-requests/` | Contactos recibidos | Sí (vendedor) |
| GET | `/api/contact-requests/mine/` | Mis conversaciones | Sí |
| POST | `/api/contact-requests/` | Crear solicitud | Sí |
| PATCH | `/api/contact-requests/{id}/` | Actualizar status | Sí |
| POST | `/api/contact-requests/{id}/mark-read/` | Marcar leído | Sí |
| POST | `/api/contact-requests/{id}/resend-email/` | Reenviar notificación | Sí |
| GET | `/api/contact-requests/unread-count/` | Contar no leídos | Sí |
| GET | `/api/contact-requests/{id}/messages/` | Listar mensajes | Sí |
| POST | `/api/contact-requests/{id}/messages/` | Enviar mensaje | Sí |
| GET | `/api/health/` | Health check | No |

---

## 📁 Estructura del proyecto

```
terrify/
├── backend/
│   ├── apps/
│   │   ├── users/           # Auth, usuarios, roles
│   │   ├── terrenos/        # CRUD terrenos, imágenes, favoritos
│   │   └── contacts/        # Contact requests, mensajería
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py      # Settings compartidos
│   │   │   ├── production.py # Settings producción
│   │   │   └── development.py # Settings desarrollo
│   │   └── urls.py          # Rutas raíz
│   ├── core/
│   │   ├── throttling.py    # Rate limiting personalizado
│   │   ├── permissions.py   # Permisos personalizados
│   │   ├── cache.py         # Caché con Redis
│   │   └── views.py         # Health check
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # Home (listado público)
│   │   ├── layout.tsx               # Layout raíz
│   │   ├── login/page.tsx           # Login + registro
│   │   ├── publicar/page.tsx        # Dashboard vendedor
│   │   ├── favoritos/page.tsx       # Favoritos
│   │   ├── mensajes/page.tsx        # Lista conversaciones
│   │   ├── mensajes/[contactId]/page.tsx  # Chat
│   │   ├── terrenos/[slug]/page.tsx # Detalle terreno
│   │   ├── verificar-email/page.tsx # Verificación email
│   │   ├── registro-exitoso/page.tsx # Confirmación registro
│   │   ├── reenviar-verificacion/page.tsx # Reenviar verificación
│   │   └── guia-legal/page.tsx      # Guía antifraude
│   ├── components/
│   │   ├── site-header.tsx           # Header con nav + unread badge
│   │   ├── mobile-bottom-nav.tsx     # Nav inferior móvil
│   │   ├── auth-form.tsx            # Login/register form
│   │   ├── auth-provider.tsx        # Context de autenticación
│   │   ├── google-auth-button.tsx   # Botón Google One Tap
│   │   ├── terrain-card.tsx         # Tarjeta de terreno
│   │   ├── terrain-browser.tsx      # Listado con filtros
│   │   ├── terrain-filter-sort.tsx  # Filtros y ordenamiento
│   │   ├── terreno-drawer.tsx       # Wizard publicar/editar
│   │   ├── seller-dashboard.tsx     # Panel del vendedor
│   │   ├── contact-form-panel.tsx   # Formulario de contacto
│   │   ├── conversation-thread.tsx  # Chat de mensajes
│   │   ├── conversations-list.tsx   # Lista de conversaciones
│   │   ├── protected-action.tsx     # Guard para auth
│   │   ├── image-gallery.tsx        # Galería de fotos
│   │   ├── mobile-contact-bar.tsx   # Barra inferior de contacto
│   │   ├── share-button.tsx         # Botón compartir
│   │   └── terreno-info-panel.tsx   # Info lateral del terreno
│   ├── lib/
│   │   ├── api.ts                  # Capa de API (fetch, refresh, etc.)
│   │   └── types.ts                # Tipos TypeScript
│   └── public/
│       └── terreno-placeholder.svg
└── docker-compose.yml
```
