from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


class RegisterRateThrottle(AnonRateThrottle):
    scope = "register"


class ContactRateThrottle(AnonRateThrottle):
    scope = "contact"


class MessageRateThrottle(UserRateThrottle):
    scope = "message"


class RefreshRateThrottle(AnonRateThrottle):
    scope = "refresh"


class TerrenoMineRateThrottle(UserRateThrottle):
    scope = "terreno_mine"
