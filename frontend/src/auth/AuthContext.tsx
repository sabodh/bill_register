import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import axios from 'axios';

import {
  apiClient,
  clearAuthTokens,
  getApiBaseUrl,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../api/client';
import type { LoginResponse, MeUser } from '../api/types/models';

type AuthContextValue = {
  user: MeUser | null;
  permissions: Set<string>;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchMe(): Promise<MeUser> {
  const { data } = await apiClient.get<MeUser>('/auth/me/');
  return data;
}

async function bootstrapAccessToken(): Promise<void> {
  const refresh = getRefreshToken();
  if (!refresh) {
    return;
  }
  const base = getApiBaseUrl().replace(/\/$/, '');
  const { data } = await axios.post<{ access: string }>(`${base}/auth/refresh/`, { refresh });
  setAccessToken(data.access);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasSession, setHasSession] = useState(() => Boolean(getRefreshToken()));
  const [bootstrapped, setBootstrapped] = useState(!getRefreshToken());

  useEffect(() => {
    if (!hasSession) {
      setBootstrapped(true);
      return;
    }
    let cancelled = false;
    bootstrapAccessToken()
      .catch(() => {
        if (!cancelled) {
          clearAuthTokens();
          setHasSession(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBootstrapped(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hasSession]);

  const { data: user, isPending, isError } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    retry: false,
    enabled: hasSession && bootstrapped,
  });

  useEffect(() => {
    if (isError) {
      clearAuthTokens();
      setHasSession(false);
      queryClient.removeQueries({ queryKey: ['me'] });
    }
  }, [isError, queryClient]);

  const permissions = useMemo(
    () => new Set(user?.permissions ?? []),
    [user?.permissions],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const { data } = await apiClient.post<LoginResponse>('/auth/login/', {
        username,
        password,
      });
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      setHasSession(true);
      setBootstrapped(true);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await queryClient.fetchQuery({ queryKey: ['me'], queryFn: fetchMe });
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    clearAuthTokens();
    setHasSession(false);
    queryClient.removeQueries({ queryKey: ['me'] });
  }, [queryClient]);

  const isLoading = hasSession && (!bootstrapped || isPending);

  const value: AuthContextValue = {
    user: user ?? null,
    permissions,
    isLoading,
    isAuthenticated: Boolean(user) && !isError,
    login,
    logout,
    hasPermission: (perm) => permissions.has(perm),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
