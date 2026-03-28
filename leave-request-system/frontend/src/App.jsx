import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { me } from "./api/auth.js";

// Pages will be added in Task 10
function PlaceholderPage({ name }) {
  return <div style={{ padding: 24 }}>{name} page — coming soon</div>;
}

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
              <PlaceholderPage name="Login" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <PlaceholderPage name="Dashboard" />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manager"
          element={
            user?.role === "manager" ? (
              <PlaceholderPage name="Manager" />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
