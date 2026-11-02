# AGENTS.md

## Quick Start

```bash
# Backend (Docker - recommended)
docker compose up -d db redis backend

# Frontend
cd frontend && pnpm install && pnpm run dev
```

**API**: http://localhost:8000/api | **Frontend**: http://localhost:3000

---

## Essential Commands

### Backend
```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test
docker compose exec backend python manage.py makemigrations
docker compose restart backend    # DESPUÉS de editar código backend (ver Critical Quirks)
```

### Frontend
```bash
cd frontend && pnpm install && pnpm run dev    # Dev server
cd frontend && pnpm exec tsc --noEmit         # TypeScript (usa este)
cd frontend && pnpm run build                 # Production build
# pnpm run lint = `eslint .` (ESLint 9 con eslint.config.mjs)
```

Tests backend por app (los tests de terrenos están en un paquete, no en un archivo):
```bash
docker compose exec backend python manage.py test apps.terrenos   # tests/ (test_api.py, test_filters.py)
docker compose exec backend python manage.py test apps.users
docker compose exec backend python manage.py test apps.contacts
```

---

## Critical Quirks

- **Root URL returns 404**: The backend exposes REST API only, not HTML pages.
- **URLs use slugs, not UUIDs**: Endpoints like `/api/terrenos/{slug}/`
- **Tokens in memory**: Auth tokens stored client-side (not httpOnly). Token refresh handled automatically via `requestAuthenticatedJson()` in `lib/api.ts`.
- **Database host**: In Docker use `db`, outside Docker use `localhost`.
- **Action-based permissions**: ViewSets check `self.action` to determine permissions (e.g., `list`/`retrieve` = AllowAny, others = authenticated).
- **Docker env_file caching**: Changing `.env` is NOT enough — `docker compose up -d` caches env vars at container creation. Use `docker compose up -d --force-recreate backend` to pick up `.env` changes.
- **Healthcheck throttle**: The health endpoint (`/api/health/`) has `@throttle_classes([])` to avoid 429 from `AnonRateThrottle`. Do not remove this.
- **Gunicorn sin `--reload`**: el backend corre con `--workers 4` y NO recarga código. Tras editar Python: `docker compose restart backend`. Si no, algunos workers responden con código viejo (p. ej. 500 `column terrenos.<campo_viejo> does not exist`).
- **ChoiceFilter declarado a mano**: en django-filter, un `ChoiceFilter` que declares tú NO hereda los choices del modelo — pasa `choices=Terreno.X.choices`. Sin choices, cualquier valor invalida el filterset: `.qs()` devuelve todo sin filtrar y la API responde 400.
- **Filtros nuevos → cache_params**: `TerrenoViewSet.list()` (`views.py`) construye `cache_params` con una lista explícita de query params. Todo filtro nuevo debe agregarse ahí o la respuesta cacheada (60s) ignorará ese filtro.
- **Rename `acepta_financiamiento` → `accepts_financing`**: el parámetro de query viejo ya NO filtra (la API lo ignora). Frontend y API ya usan el nombre nuevo.
- **`area_unit` no cambia el almacenamiento**: `area_m2` siempre guarda m². El query param `area_unit=hectare` solo indica en qué unidad están escritos `min_area`/`max_area` (se convierten ×10000 en `filters.py`). El campo del modelo `area_unit` es la unidad de display del listado.

---

## Data Mapping

- **API responses**: snake_case (e.g., `created_at`)
- **Frontend types**: camelCase (e.g., `createdAt`)
- Mapper functions: `mapTerrenoList()`, `mapTerrenoDetail()`, `mapAuthUser()`, `mapContactRequest()`

---

## External Integrations

- **Cloudinary**: Image storage (max 10 images, 5MB each, JPEG/PNG/WEBP)
- **Resend**: Email notifications
- **PostgreSQL**: Primary database
- **Redis**: Cache + rate limiting
- **SimpleJWT**: 15min access token, 7-day refresh with rotation & blacklist

---

## Directory Ownership

- `backend/apps/users/` - User model, auth, roles (normal/agent/admin)
- `backend/apps/terrenos/` - Land listings, images, favorites
  - `filters.py` - `TerrenoFilterSet` (django-filter). `views.py` solo lo importa.
  - `tests/` - Paquete de tests (`test_api.py`, `test_filters.py`)
- `backend/apps/contacts/` - Contact requests between buyers/sellers
- `frontend/components/` - React components (planos + carpetas)
  - `components/search/` - `FilterBar.tsx` (barra principal), `MoreFiltersDrawer.tsx` ("Mas filtros")
  - `components/terrain/` - `TerrainCard.tsx` (tarjeta de resultado con badge de financiamiento)
- `frontend/lib/` - API layer (`api.ts`), types (`types.ts`)

---

## Search Filters (TerrenoFilterSet — `backend/apps/terrenos/filters.py`)

Query params disponibles en `GET /api/terrenos/` (se combinan en AND):

| Param | Tipo | Notas |
|-------|------|-------|
| `municipio`, `estado`, `search`, `is_featured` | existentes | sin cambios |
| `min_price`, `max_price` | number | (los nombres de la spec `price_min`/`price_max` NO existen) |
| `min_area`, `max_area` | number | interpretados según `area_unit` |
| `area_unit` | `m2`\|`hectare` | solo define la unidad de lectura de min/max_area (×10000) |
| `land_use` | choice | `residential`, `commercial`, `agricultural`, `industrial` |
| `property_type` | choice | `titled`, `deed_pending`, `ejido`, `other` |
| `has_water`, `has_electricity`, `has_drainage`, `has_paved_road` | bool | servicios del terreno |
| `accepts_financing` | bool | renombrado desde `acepta_financiamiento` |
| `terrain_type`, `servicio`, `accesible_para_empezar` | existentes | sin cambios |

Orden (`ordering`): `price`, `-price`, `area_m2`, `-area_m2`, `created_at`, `-created_at`, `views_count`, **`price_per_m2`**, `-price_per_m2` (se anota con `annotate(F price/F area_m2)` en `get_queryset` cuando el param lo pide).

Labels calculados en serializer: `payment_facility_label` = `"Enganche desde $X"` si `accepts_financing=True` y `down_payment_amount` existe; `null` en caso contrario.

---

## Custom Actions (Backend)

- `@action(detail=True, url_path="favorite")` - Toggle favorite
- `@action(detail=True, url_path="upload-images")` - Upload images to Cloudinary
- `@action(detail=False, url_path="mine")` - Current user's listings
- `@action(detail=False, url_path="unread-count")` - Unread contact requests count
- `@action(detail=True, url_path="mark-read")` - Mark contact as read
- `@action(detail=True, url_path="messages")` - List/send messages for a contact

---

## Known Issues & Improvement Roadmap

### 🔴 CRITICAL — Fix Before Production

| # | Area | File | Issue |
|---|------|------|-------|
| 1 | Backend Security | `backend/.env` | Real secrets committed (Cloudinary, Resend, Google OAuth, Django SECRET_KEY). If repo is public, all are compromised. |
| 2 | Backend Security | `backend/.env:3` | Weak/guessable Django SECRET_KEY allows JWT forgery. Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`. |
| 3 | Backend Security | `backend/apps/contacts/services.py:145` | XSS in reply email — `message.body` inserted into HTML without `escape()`. |
| 4 | Frontend Security | `frontend/next.config.mjs` | Missing Content-Security-Policy header. |
| 5 | Frontend Security | `frontend/components/auth-provider.tsx:115` | Tokens stored in sessionStorage (accessible to XSS). Consider httpOnly cookies. |

### 🟠 HIGH — Fix Soon

| # | Area | File | Issue |
|---|------|------|-------|
| 9 | Backend Security | `backend/apps/users/google_auth.py:22` | No throttle on Google auth endpoint. |
| 10 | Backend Security | `backend/config/settings/production.py:13` | `SECURE_SSL_REDIRECT` defaults to False. |
| 15 | Frontend Perf | `frontend/components/site-footer.tsx` | Unnecessary `"use client"` — should be Server Component. |

### 🟡 MEDIUM — Plan to Fix

| # | Area | File | Issue |
|---|------|------|-------|
| 16 | Backend | `backend/config/urls.py` | No Swagger/OpenAPI documentation. |
| 20 | Backend | `backend/apps/users/views.py` | Inconsistent error response format (`message` vs `detail`). |
| 21 | Frontend SEO | `frontend/app/terrenos/[slug]/page.tsx:16-32` | Missing `twitter.images` and `openGraph.url` in metadata. |
| 22 | Frontend UX | All `<Image>` components | No blur placeholder on any image. |
| 23 | Frontend SEO | `frontend/app/terrenos/[slug]/page.tsx` | No JSON-LD structured data (`RealEstateListing` schema). |
| 24 | Frontend A11y | `frontend/components/image-gallery.tsx:114` | Lightbox has no focus trap. |
| 25 | Frontend UX | `frontend/components/conversations-list.tsx:21` | Never refreshes — new messages don't appear without nav. |
| 26 | Frontend Code | `frontend/lib/api.ts` | `getApiBaseUrl` is needlessly async. |
| 27 | Frontend Code | `frontend/lib/api.ts` | Redundant ternary producing identical paths. |

> IDs eliminados del roadmap porque ya están resueltos o la premisa ya no aplica:
> **6** (el sitemap ahora incluye fichas `/terrenos/[slug]` con revalidate 1h),
> **7** (`is_favorited` se anota con `Exists` en `get_queryset`, sin N+1),
> **8** (el listado de contactos ya no serializa `messages`; `last_message` usa `Subquery`),
> **11** (índice `area_m2` existe),
> **12** (el script GSI de Google se carga dinámicamente solo en el botón de login),
> **13** (debounce de 500ms en `FilterBar`), **14** (el botón de favorito no está anidado en `<Link>`),
> **17** (`terrain_type` sí es filtro), **18** (`CheckConstraint` price/area existen desde la migración 0007),
> **19** (no existe `import struct` en el código).

### 🟢 LOW — Future Improvements

| # | Area | Issue |
|---|------|-------|
| 28 | Backend | No geo-spatial search (lat/lng stored but never queried). |
| 29 | Backend | No password reset flow. |
| 30 | Backend | No account deletion (GDPR). |
| 31 | Backend | No image optimization/thumbnails on Cloudinary upload. |
| 32 | Backend | Test coverage mejoró: `terrenos/tests/` cubre filtros/orden/paginación; faltan tests de favoritos, mensajes y auth. |
| 33 | Frontend | No interactive map for browsing terrenos. |
| 34 | Frontend | No dark mode. |
| 35 | Frontend | No "similar terrenos" section on detail page. |
| 36 | Frontend | `viewsCount` exists in types but never displayed. |
| 37 | Frontend | El formulario de publicación (`terreno-drawer.tsx`) no expone aún `land_use`, servicios, `accepts_financing` ni `down_payment_amount` (solo API/admin). |

---

## Priority Roadmap

| Week | Focus |
|------|-------|
| **1** | Secrets/seguridad, CSP header, sitemap fix, N+1 queries |
| **2** | Throttling, accesibilidad, formulario de publicación (land_use / servicios / financiamiento) |
| **3** | Documentación API (Swagger), test coverage, thumbnails Cloudinary |
| **4** | Búsqueda geo-espacial, mapa interactivo, structured data, dark mode |