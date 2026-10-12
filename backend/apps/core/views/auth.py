from rest_framework import permissions
from rest_framework.generics import RetrieveAPIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.core.serializers.auth import MeSerializer


class TokenLoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]


class TokenRefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class MeView(RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MeSerializer

    def get_object(self):
        return self.request.user
