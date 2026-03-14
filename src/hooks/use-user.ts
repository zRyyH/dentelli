"use client";

import { createContext, useContext, useState, useEffect, createElement, type ReactNode } from "react";
import { getUserData, setUserData, isAuthenticated } from "@/lib/pb";

interface UserCtx {
  isLoading: boolean;
  isDono: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserCtx>({ isLoading: true, isDono: false, isAdmin: false });

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserCtx>(() => {
    // Inicializa com dados do localStorage (pode estar desatualizado)
    const u = getUserData();
    return {
      isLoading: true,
      isDono: !!(u?.dono),
      isAdmin: !!(u?.administrador) || !!(u?.superuser),
    };
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    fetch("/api/perfil")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setUserData(data);
          setState({
            isLoading: false,
            isDono: !!(data.dono),
            isAdmin: !!(data.administrador) || !!(data.superuser),
          });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      })
      .catch(() => setState((s) => ({ ...s, isLoading: false })));
  }, []);

  return createElement(UserContext.Provider, { value: state }, children);
}

export function useUser() {
  return useContext(UserContext);
}
