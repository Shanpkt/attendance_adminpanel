import { useEffect, useState } from "react";
import axios from "axios";

import MenuIcon from "@mui/icons-material/Menu";

import Sidebar from "../components/sidebar/sidebar";
import LoginPopup from "../components/LoginPopup/LoginPopup";
import { ADMIN_VERIFY_API } from "../api";
import {
  clearAuthSession,
  getAuthToken,
  getAuthUsername,
  isLoggedIn,
} from "../utils/auth";

import "./AdminLayout.scss";

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);
  const [checkingAuth, setCheckingAuth] =
    useState(true);
  const [authenticated, setAuthenticated] =
    useState(false);
  const [username, setUsername] = useState(
    getAuthUsername()
  );

  useEffect(() => {
    document.body.style.overflow =
      sidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const verifySession = async () => {
      if (!isLoggedIn()) {
        setAuthenticated(false);
        setCheckingAuth(false);
        return;
      }

      try {
        const response = await axios.get(
          ADMIN_VERIFY_API,
          {
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
            },
          }
        );

        setUsername(
          response.data?.data?.username ||
            getAuthUsername()
        );
        setAuthenticated(true);
      } catch (error) {
        clearAuthSession();
        setAuthenticated(false);
        setUsername("");
      } finally {
        setCheckingAuth(false);
      }
    };

    verifySession();
  }, []);

  const handleLoginSuccess = ({ username: name }) => {
    setUsername(name || "");
    setAuthenticated(true);
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuthenticated(false);
    setUsername("");
    setSidebarOpen(false);
  };

  if (checkingAuth) {
    return (
      <div className="admin-auth-loading">
        Checking session...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <LoginPopup
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div
      className={`admin-layout${
        sidebarOpen
          ? " admin-layout--menu-open"
          : ""
      }`}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="admin-layout__main">
        <header className="admin-header">
          <button
            type="button"
            className="admin-header__menu"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon />
          </button>

          <div className="admin-header__brand">
            <span className="admin-header__brand-icon">
              ♧
            </span>
            <div>
              <strong>Shop Attendance</strong>
              <span>Admin Panel</span>
            </div>
          </div>

          <div className="admin-header__right">
            <div className="admin-user">
              <div className="admin-user__avatar">
                {(username || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="admin-user__info">
                <strong>
                  {username || "Admin"}
                </strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
