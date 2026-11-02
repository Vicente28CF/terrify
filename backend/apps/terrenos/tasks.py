import logging

from celery import shared_task
from django.core.cache import cache
from django.db.models import F

logger = logging.getLogger(__name__)


@shared_task
def flush_views_count(keys=None):
    """Flush pending views-count increments from cache to database.

    En producción `keys` es None y se escanean las claves con ``cache.keys``
    (django-redis). Los tests pueden inyectar las claves explícitas porque
    LocMemCache no implementa ``keys()``.
    """
    from apps.terrenos.models import Terreno

    if keys is None:
        keys = cache.keys("terreno_views:*") if hasattr(cache, "keys") else []
    if not keys:
        return

    flushed = 0
    for key in keys:
        pk = key.split(":")[-1]
        pending_views = cache.get(key)
        cache.delete(key)
        if not pending_views:
            continue
        Terreno.objects.filter(pk=pk).update(views_count=F("views_count") + pending_views)
        flushed += 1

    if flushed:
        logger.info("Flushed views count for %d terrenos.", flushed)
