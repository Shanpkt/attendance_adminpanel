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
    label: "Settings",
    icon: "⚙",
    path: "/settings",
  },
];

function Sidebar({ isOpen, onClose }) {
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
              Shop Attendance
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
            NAVIGATION
        ================================= */}

        <nav className="sidebar__nav">

          <p className="sidebar__section-title">
            MAIN MENU
          </p>

          {menuItems.map((item) => (
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

        </nav>

        {/* ================================
            LOGOUT
        ================================= */}

        <div className="sidebar__bottom">

          <button
            className="sidebar__logout"
            type="button"
          >
            <span className="sidebar__item-icon">
              ⇥
            </span>

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;