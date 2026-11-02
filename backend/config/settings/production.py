from .base import *
from decouple import config

DEBUG = False

ALLOWED_HOSTS = [h.strip() for h in config("ALLOWED_HOSTS", default="localhost").split(",") if h.strip()]

# CORS solo acepta el dominio del frontend en producción
CORS_ALLOWED_ORIGINS = [o.strip() for o in config("CORS_ALLOWED_ORIGINS", default="http://localhost:3000").split(",") if o.strip()]
CORS_ALLOW_CREDENTIALS = True

# ─── Seguridad HTTPS ──────────────────────────────────────────────────────────
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default="False", cast=bool)
SECURE_HSTS_SECONDS = 31536000          # 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
X_FRAME_OPTIONS = "DENY"

# ─── Logs estructurados en producción ────────────────────────────────────────
LOGGING = {
    **LOGGING,
    "formatters": {
        "json": {
            "format": '{"time": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        **LOGGING["loggers"],
        "apps.contacts": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "apps.terrenos": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "django.security": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}
