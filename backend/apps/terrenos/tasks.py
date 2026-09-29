import logging

from celery import shared_task
from django.core.cache import cache
from django.db.models import F

logger = logging.getLogger(__name__)


@shared_task
def flush_views_count():
    """Flush pending views-count increments from cache to database."""
    from apps.terrenos.models import Terreno

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
