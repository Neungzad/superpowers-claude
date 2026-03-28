import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { me } from "./api/auth.js";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ManagerPage from "./pages/ManagerPage.jsx";

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLogin={setUser} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardPage user={user} onLogout={() => setUser(null)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manager"
          element={
            user?.role === "manager" ? (
              <ManagerPage user={user} onLogout={() => setUser(null)} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
