import hashlib
import json
from django.core.cache import cache


def make_cache_key(prefix: str, params: dict) -> str:
    """Genera una key única basada en prefix y params."""
    if not params:
        return f"{prefix}:all"
    param_str = json.dumps(params, sort_keys=True)
    param_hash = hashlib.md5(param_str.encode()).hexdigest()[:12]
    return f"{prefix}:{param_hash}"


def get_cached_list(prefix: str, params: dict, timeout: int = 60):
    """Obtiene datos del cache."""
    key = make_cache_key(prefix, params)
    return cache.get(key)


def set_cached_list(prefix: str, params: dict, data, timeout: int = 60):
    """Guarda datos en el cache."""
    key = make_cache_key(prefix, params)
    cache.set(key, data, timeout)


def invalidate_terreno_cache():
    """Invalida todo el cache de terrenos."""
    try:
        cache.delete_pattern("terrenos:*")
    except AttributeError:
        pass


def invalidate_terreno_detail(slug: str):
    """Invalida el cache de un terreno específico."""
    try:
        cache.delete(f"terreno:detail:{slug}")
    except AttributeError:
        pass