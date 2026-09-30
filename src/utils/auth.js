const AUTH_TOKEN_KEY = "admin_auth_token";
const AUTH_USER_KEY = "admin_auth_username";

export const getAuthToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
};

export const getAuthUsername = () => {
  return localStorage.getItem(AUTH_USER_KEY) || "";
};

export const setAuthSession = ({
  token,
  username,
}) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token || "");
  localStorage.setItem(
    AUTH_USER_KEY,
    username || ""
  );
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const isLoggedIn = () => {
  return Boolean(getAuthToken());
};
