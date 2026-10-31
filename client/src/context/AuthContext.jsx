import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

async function postWithRetry(path, body, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await api.post(path, body);
    } catch (err) {
      lastError = err;
      const msg = err.response?.data?.message;
      const unreachable = !err.response || (err.response.status >= 500 && !msg);
      if (!unreachable || i === attempts - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 600 * (i + 1)));
    }
  }
  throw lastError;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("certichain_token");
    if (!token) {
      setReady(true);
      return;
    }
    api
      .get("/api/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("certichain_token"))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      async login(email, password) {
        const { data } = await postWithRetry("/api/auth/login", { email, password });
        localStorage.setItem("certichain_token", data.token);
        setUser(data.user);
        return data.user;
      },
      async register(payload) {
        const { data } = await api.post("/api/auth/register", payload);
        localStorage.setItem("certichain_token", data.token);
        setUser(data.user);
        return data.user;
      },
      logout() {
        localStorage.removeItem("certichain_token");
        setUser(null);
      },
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
