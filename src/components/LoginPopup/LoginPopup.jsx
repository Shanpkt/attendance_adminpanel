import React, { useState } from "react";
import axios from "axios";

import { ADMIN_LOGIN_API } from "../../api";
import { setAuthSession } from "../../utils/auth";

import "./LoginPopup.scss";

function LoginPopup({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanUsername = username.trim();
    const cleanPassword = password;

    if (!cleanUsername || !cleanPassword) {
      setError(
        "Please enter username and password."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        ADMIN_LOGIN_API,
        {
          username: cleanUsername,
          password: cleanPassword,
        }
      );

      const token = response.data?.data?.token;
      const loggedUsername =
        response.data?.data?.username ||
        cleanUsername;

      if (!token) {
        setError("Login failed. Please try again.");
        return;
      }

      setAuthSession({
        token,
        username: loggedUsername,
      });

      onLoginSuccess({
        token,
        username: loggedUsername,
      });
    } catch (err) {
      console.error("Admin login error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to login. Check credentials or server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-popup">
      <div className="login-popup__card">
        <div className="login-popup__brand">
          <span className="login-popup__brand-icon">
            ♧
          </span>
          <div>
            <h1>Shop Attendance</h1>
            <p>Admin Panel Login</p>
          </div>
        </div>

        <form
          className="login-popup__form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="admin-username">
            Username
          </label>
          <input
            id="admin-username"
            type="text"
            autoComplete="username"
            value={username}
            disabled={loading}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            placeholder="Enter username"
          />

          <label htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            disabled={loading}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter password"
          />

          {error && (
            <p className="login-popup__error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-popup__submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPopup;
