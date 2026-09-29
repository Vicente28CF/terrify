# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Terrify** is a land marketplace web application with a mobile-first design. It's a monorepo with Django REST API backend and Next.js frontend.

- **Philosophy**: Public exploration without barriers. Users only register when performing value-add actions (publishing land or contacting sellers).
- **Location**: Initially focused on Zacoalco de Torres, Jalisco, Mexico with scalable architecture for regional/global expansion.

---

## Development Commands

### Backend (Dockerized - Recommended)

```bash
# Start backend services (PostgreSQL, Redis, Django)
docker compose up -d db redis backend

# Run Django management commands
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test
docker compose exec backend python manage.py makemigrations

# REQUIRED after editing backend Python code:
docker compose restart backend

# View backend logs
docker compose logs -f backend
```

> **Gunicorn sin `--reload`**: el backend corre con `--workers 4`. Sin el restart, algunos workers
> responden con código viejo (p. ej. 500 `column terrenos.<campo_viejo> does not exist`).

Backend API is available at `http://localhost:8000/api`

### Frontend (Local)

```bash
cd frontend
pnpm install
pnpm run dev      # Development server on http://localhost:3000
pnpm run build    # Production build
pnpm exec tsc --noEmit # TypeScript type checking (USAR ESTE)
pnpm run lint     # ESLint (flat config en eslint.config.mjs; usa eslint@9, no eslint@10 — eslint-plugin-react aun no lo soporta)
```

### Full Stack (Docker)

```bash
# Start everything including frontend
docker compose --profile frontend up -d

# Stop all services
docker compose down
```

---

## Architecture Overview

### Backend (Django + DRF)

**Apps Structure** (`backend/apps/`):

- `users/` - Custom user model with email-based auth, role system (normal/agent/admin), JWT token management
- `terrenos/` - Land listings (Terreno), images (TerrenoImage), favorites (Favorite)
- `contacts/` - Contact requests between buyers and sellers with notification tracking

**Key Configuration**:

- Settings split: `config/settings/base.py`, `development.py`, `production.py`
- Custom permissions in `core/permissions.py`: `IsOwnerOrReadOnly`, `IsAgentOrAdmin`
- Rate limiting via `core/throttling.py` and DRF throttle config
- JWT auth with SimpleJWT: 15min access token, 7-day refresh with rotation & blacklist
- `terrenos/filters.py` - `TerrenoFilterSet` (django-filter): `min_price/max_price`,
  `min_area/max_area` + `area_unit` (m2|hectare, convierte ×10000), `land_use`, `property_type`,
  `has_water/electricity/drainage/paved_road`, `accepts_financing` (renombrado desde
  `acepta_financiamiento`), `terrain_type`, `servicio`, `accesible_para_empezar`.
  Orden: `price`, `area_m2`, `created_at`, `views_count`, `price_per_m2` (annotate).
  **Ojo**: un `ChoiceFilter` declarado a mano debe llevar `choices=` explícito, y todo filtro
  nuevo debe agregarse a la lista `cache_params` de `TerrenoViewSet.list()` (cache 60s).

**External Integrations**:

- **Cloudinary**: Image storage for land photos (max 10 images, 5MB each)
- **Resend**: Transactional email notifications for contact requests
- **PostgreSQL**: Primary database with custom indexes on municipio, status, price
- **Redis**: Cache and rate limiting backend

### Frontend (Next.js 16.2.6 + React 19.2.4)

**Package Manager**: pnpm (use `pnpm` instead of `npm`)

**App Router Structure** (`frontend/app/`):

- `/` - Home with featured listings and terrain browser
- `/login` - Authentication page
- `/registro-exitoso` - Registration success page
- `/reenviar-verificacion` - Resend email verification
- `/verificar-email` - Email verification handler
- `/terrenos/[slug]` - Land detail page
- `/publicar` - Publish new land listing
- `/favoritos/` - User's favorite listings
- `/mensajes/` - Messaging/conversations with sellers
- `/guia-legal/` - Legal guide

**Key Directories**:

- `components/` - React components
- `lib/` - API layer (`api.ts`), TypeScript types (`types.ts`), municipios data

**Components**:
- `site-header.tsx` - Main navigation with auth state
- `terrain/TerrainCard.tsx` - Land listing card (badge verde `paymentFacilityLabel` si `acceptsFinancing`)
- `search/FilterBar.tsx` - Always-visible filters (búsqueda/ubicación, precio, superficie con toggle m²/ha, uso de suelo) + chips + estado en URL
- `search/MoreFiltersDrawer.tsx` - "Mas filtros" (orden incl. precio por m², servicios, tipo de propiedad, facilidades de pago, tipo de terreno, servicios cercanos)
- `terrain-browser.tsx` - Land listings grid; sincroniza filtros ↔ query params (`buildApiFilters`, `readFiltersFromParams`, `filtersToQueryString`)
- `terreno-drawer.tsx` - Detailed land view drawer (43KB); formulario de publicación (aún no expone land_use/servicios/financiamiento)
- `seller-dashboard.tsx` - Agent/seller dashboard (22KB)
- `contact-form-panel.tsx` - Contact seller form
- `conversations-list.tsx` - Messages list
- `conversation-thread.tsx` - Message thread view
- `mobile-bottom-nav.tsx` - Mobile navigation
- `google-auth-button.tsx` - Google OAuth login
- `auth-provider.tsx` - Auth context provider
- `protected-action.tsx` - Protected action wrapper

**Design System** (Tailwind):

- Custom colors: `sand` (#fbf7f2), `ink` (#1f1f1f), `coral` (#ff385c), `stone` (#6a6a6a)
- Fonts: DM Sans (body), Sora (display) via Google Fonts
- Glassmorphism effects with `backdrop-blur` and semi-transparent backgrounds

**Auth Flow**:

- Client-side auth via `AuthProvider` context
- Access/refresh tokens stored in memory (secure httpOnly not used - tokens rotate)
- Automatic token refresh on 401 responses via `requestAuthenticatedJson()` in `api.ts`

### API Communication

**Base URL Resolution** (`lib/api.ts:getApiBaseUrl()`):

- Uses `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_BASE_URL` env vars
- Defaults to `http://localhost:8000/api`

**Data Mapping Pattern**:

- API responses use snake_case, internal types use camelCase
- Mapping functions: `mapTerrenoList()`, `mapTerrenoDetail()`, `mapAuthUser()`, `mapContactRequest()`

### Database Schema

**Key Models**:

- `users.User` - Custom user with UUID PK, email auth, role field, `can_publish` property
- `terrenos.Terreno` - Land listing with slug, geolocation (lat/lng), status, view counter.
  Campos nuevos de segmentación: `land_use`, `property_type`, `has_water`, `has_electricity`,
  `has_drainage`, `has_paved_road`, `accepts_financing` (antes `acepta_financiamiento`),
  `down_payment_amount`, `area_unit` (display m2|hectare; el área SIEMPRE se guarda en m²)
- `terrenos.TerrenoImage` - Cloudinary-stored images with ordering and cover flag
- `terrenos.Favorite` - Many-to-many user-land favorites
- `contacts.ContactRequest` - Buyer inquiries with notification status tracking

---

## Environment Configuration

### Backend (`backend/.env`)

```bash
DJANGO_SETTINGS_MODULE=config.settings.development
SECRET_KEY=<generate-strong-key>
DB_NAME=terrify_db
DB_USER=terrify_user
DB_PASSWORD=terrify_pass
DB_HOST=db  # 'localhost' if running outside Docker
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
DEFAULT_FROM_EMAIL=noreply@terrify.mx
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci-cd.yml`):

1. **Backend CI**: Python 3.12, PostgreSQL service, Redis service - runs migrations, Django checks, tests
2. **Frontend CI**: Node 20 - installs deps, type checks, builds
3. **Deploy**: Render (backend) + Vercel (frontend) on pushes to main

---

## Security Considerations

- **CSP**: Configured in Django (`CSP_*` settings) and Next.js headers
- **Rate Limiting**: DRF throttling (anon: 50/hr, user: 200/hr, login: 5/min, contact: 10/hr)
- **CORS**: Open in development (`CORS_ALLOW_ALL_ORIGINS = True`), restrictive in production
- **JWT**: Short-lived access tokens with refresh rotation and blacklist on logout
- **Image Validation**: Server-side format check (JPEG/PNG/WEBP) and size limit (5MB)

---

## Key Implementation Patterns

### Backend

**ViewSets** with action-based permissions:

```python
class TerrenoViewSet(viewsets.ModelViewSet):
    lookup_field = "slug"  # URLs use slugs not UUIDs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny]
        return [IsAuthenticated, IsOwnerOrReadOnly]
```

**Custom Actions** for business logic:

- `@action(detail=True, url_path="favorite")` - Toggle favorite status
- `@action(detail=True, url_path="upload-images")` - Multipart image upload to Cloudinary
- `@action(detail=False, url_path="mine")` - Current user's listings

### Frontend

**Server Components** with ISR:

```typescript
export const revalidate = 60; // ISR cache duration

async function HomeContent() {
  const response = await fetchTerrenos(); // Uses Next.js fetch with revalidate
}
```

**Protected Actions** via `ProtectedAction` component - shows auth modal or redirects to login based on auth state.

**Image Optimization**: Next.js `Image` component with Cloudinary remote pattern configured.

---

## Testing

### Backend Tests

```bash
docker compose exec backend python manage.py test
```

Test files: `backend/apps/*/tests.py`, excepto terrenos que es un paquete:
`backend/apps/terrenos/tests/` → `test_api.py` (CRUD/imágenes) y `test_filters.py`
(FilterSet: choices, booleanos, conversión hectárea, orden `price_per_m2`, paginación,
`payment_facility_label`). Ejecución por app: `docker compose exec backend python manage.py test apps.terrenos`

### Frontend Type Checking

```bash
cd frontend
pnpm exec tsc --noEmit
```

---

## Deployment Notes

- **Production Backend**: Render (Docker-based), requires environment variables for DB, Redis, Cloudinary, Resend
- **Production Frontend**: Vercel, requires `NEXT_PUBLIC_API_URL` pointing to production backend
- **Database**: PostgreSQL 16 with migrations run on deploy
- **Static Files**: Django `collectstatic` for admin, Next.js static export for frontend assets

## Archivos a NO Subir a GitHub

- .env (contiene credenciales)
- .env.local (desarrollo local)
- _.pem, _.key (certificados)
