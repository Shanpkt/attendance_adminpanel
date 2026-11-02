import { NavLink } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import "./sidebar.scss";

const menuItems = [
  {
    label: "Dashboard",
    icon: "⌂",
    path: "/",
  },
  {
    label: "Attendance",
    icon: "▣",
    path: "/attendance",
  },
  {
    label: "Employees",
    icon: "♙",
    path: "/employees",
  },
  {
    label: "Profile",
    icon: "◎",
    path: "/profile",
  },
  {
    label: "Holidays",
    icon: "★",
    path: "/holidays",
  },
  {
    label: "Punch Edit",
    icon: "✎",
    path: "/punch-edit",
  },
  {
    label: "Settings",
    icon: "⚙",
    path: "/settings",
  },
  {
    label: "Company Settings",
    icon: "⚒",
    path: "/company-settings",
  },
];

const storageItems = [
  {
    label: "Cleanup Drive",
    icon: "♻",
    path: "/cleanup-drive",
  },
  {
    label: "Company Cleanup Drive",
    icon: "♻",
    path: "/company-cleanup-drive",
  },
];

function Sidebar({ isOpen, onClose, onLogout, mode = "shop", onModeChange }) {
  const brandName = mode === "company" ? "Company Attendance" : "Shop Attendance";

  const visibleMenuItems = menuItems.filter((item) => {
    if (item.path === "/settings") {
      return mode !== "company";
    }

    if (item.path === "/company-settings") {
      return mode === "company";
    }

    return true;
  });

  const visibleStorageItems = storageItems.filter((item) => {
    if (item.path === "/cleanup-drive") {
      return mode !== "company";
    }

    if (item.path === "/company-cleanup-drive") {
      return mode === "company";
    }

    return true;
  });

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${
          isOpen ? "show" : ""
        }`}
        onClick={onClose}
      />

      <aside
        className={`sidebar ${
          isOpen ? "open" : ""
        }`}
      >
        {/* ================================
            LOGO
        ================================= */}

        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            ♧
          </div>

          <div className="sidebar__logo-text">
            <strong>
              {brandName}
            </strong>

            <span>
              System
            </span>
          </div>

          <button
            type="button"
            className="sidebar__close"
            aria-label="Close menu"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        {/* ================================
            MODE SWITCH
        ================================= */}

        <div className="sidebar__mode" role="radiogroup" aria-label="Admin mode">
          <p className="sidebar__mode-label">MODE</p>
          <div className="sidebar__mode-switch">
            <label className="sidebar__mode-option">
              <input
                type="radio"
                name="admin-mode"
                value="shop"
                checked={mode === "shop"}
                onChange={() => onModeChange?.("shop")}
              />
              <span>Shop</span>
            </label>
            <label className="sidebar__mode-option">
              <input
                type="radio"
                name="admin-mode"
                value="company"
                checked={mode === "company"}
                onChange={() => onModeChange?.("company")}
              />
              <span>Company</span>
            </label>
          </div>
        </div>

        {/* ================================
            LOGOUT
        ================================= */}

        <div className="sidebar__top">
          <button
            className="sidebar__logout"
            type="button"
            onClick={onLogout}
          >
            <span className="sidebar__item-icon">
              ⇥
            </span>

            <span>
              Logout
            </span>
          </button>
        </div>

        {/* ================================
            NAVIGATION
        ================================= */}

        <nav className="sidebar__nav">

          <p className="sidebar__section-title">
            MAIN MENU
          </p>

          {visibleMenuItems.map((item) => (
            <NavLink
              to={item.path}
              key={item.label}
              end={item.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar__item ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span className="sidebar__item-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </NavLink>
          ))}

          <p className="sidebar__section-title sidebar__section-title--spaced">
            STORAGE
          </p>

          {visibleStorageItems.map((item) => (
            <NavLink
              to={item.path}
              key={item.label}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar__item ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span className="sidebar__item-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </NavLink>
          ))}

        </nav>

      </aside>
    </>
  );
}

export default Sidebar;
