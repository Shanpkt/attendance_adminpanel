import { useEffect, useState } from "react";

import MenuIcon from "@mui/icons-material/Menu";

import Sidebar from "../components/sidebar/sidebar";
import "./AdminLayout.scss";

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    document.body.style.overflow =
      sidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

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
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="admin-layout__main">

        <header className="admin-header">

          <button
            type="button"
            className="admin-header__menu"
            aria-label="Open menu"
            onClick={() =>
              setSidebarOpen(true)
            }
          >
            <MenuIcon />
          </button>

          <div className="admin-header__brand">
            <span className="admin-header__brand-icon">
              ♧
            </span>
            <div>
              <strong>
                Shop Attendance
              </strong>
              <span>
                Admin Panel
              </span>
            </div>
          </div>

          <div className="admin-header__right">

            <div className="admin-user">

              <div className="admin-user__avatar">
                A
              </div>

              <div className="admin-user__info">
                <strong>Admin</strong>
                <span>
                  Administrator
                </span>
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
