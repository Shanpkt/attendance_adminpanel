export const ADMIN_MODE_KEY = "admin_panel_mode";

export function normalizeAdminMode(value) {
  return value === "company" ? "company" : "shop";
}

export function getStoredAdminMode() {
  try {
    return normalizeAdminMode(
      localStorage.getItem(ADMIN_MODE_KEY)
    );
  } catch {
    return "shop";
  }
}

export function setStoredAdminMode(mode) {
  const safeMode = normalizeAdminMode(mode);

  try {
    localStorage.setItem(ADMIN_MODE_KEY, safeMode);
  } catch {
    // ignore storage errors
  }

  return safeMode;
}

export function getEmployeeWorkspace(employee) {
  return normalizeAdminMode(employee?.workspace);
}

export function filterEmployeesByWorkspace(employees, mode) {
  const safeMode = normalizeAdminMode(mode);
  const list = Array.isArray(employees) ? employees : [];

  return list.filter(
    (employee) => getEmployeeWorkspace(employee) === safeMode
  );
}
