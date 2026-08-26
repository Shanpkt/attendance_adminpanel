import { useState } from "react";

import Sidebar from "../components/sidebar/sidebar";
import "./AdminLayout.scss";

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="admin-layout__main">
        <header className="admin-header">
          <button
            className="admin-header__menu"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="admin-header__right">
            <div className="admin-user">
              <div className="admin-user__avatar">
                A
              </div>

              <div className="admin-user__info">
                <strong>Admin</strong>
                <span>Administrator</span>
              </div>

              <span className="admin-user__arrow">
               ⌄
              </span>
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