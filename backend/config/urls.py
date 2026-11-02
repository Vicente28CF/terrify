from django.contrib import admin
from django.urls import include, path

from apps.users.views import RefreshView
from core.views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.terrenos.urls")),
    path("api/", include("apps.contacts.urls")),
    path("api/auth/token/refresh/", RefreshView.as_view(), name="auth-token-refresh"),
    path("api/health/", health_check, name="health-check"),
]
