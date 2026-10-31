import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Verify from "./pages/Verify";
import Demo from "./pages/Demo";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AppShell from "./pages/AppShell";
import Overview from "./pages/Overview";
import Issue from "./pages/Issue";
import Certificates from "./pages/Certificates";
import Analytics from "./pages/Analytics";
import Chain from "./pages/Chain";
import Users from "./pages/Users";
import Portal from "./pages/Portal";
import RouteScan from "./components/RouteScan";
import CursorGlow from "./components/CursorGlow";

function Guard({ roles, children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#141414] text-sm font-medium text-neutral-400">
        Opening session…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <RouteScan />
      <CursorGlow />
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/app"
        element={
          <Guard roles={["superadmin", "issuer"]}>
            <AppShell />
          </Guard>
        }
      >
        <Route index element={<Overview />} />
        <Route path="issue" element={<Issue />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="chain" element={<Chain />} />
        <Route path="users" element={<Users />} />
      </Route>
      <Route
        path="/portal"
        element={
          <Guard roles={["student"]}>
            <Portal />
          </Guard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
