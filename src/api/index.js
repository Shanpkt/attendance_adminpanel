const API_BASE_URL =
  "https://attendance-backend-hs75.onrender.com/api";

export const ATTENDANCE_API = `${API_BASE_URL}/attendance`;
export const EMPLOYEES_API = `${API_BASE_URL}/employees`;
export const LEAVES_API = `${API_BASE_URL}/leaves`;
export const SETTINGS_API = `${API_BASE_URL}/settings`;
export const HOLIDAYS_API = `${API_BASE_URL}/holidays`;

// Aliases used across pages
export const EMPLOYEE_API = EMPLOYEES_API;
export const LEAVE_API = LEAVES_API;

export const employeeByIdApi = (employeeId) =>
  `${EMPLOYEES_API}/${employeeId}`;

export const leaveByIdApi = (leaveId) =>
  `${LEAVES_API}/${leaveId}`;

export const leavesByEmployeeApi = (mobileNumber) =>
  `${LEAVES_API}/employee/${mobileNumber}`;

export const holidayByIdApi = (holidayId) =>
  `${HOLIDAYS_API}/${holidayId}`;

export default {
  API_BASE_URL,
  ATTENDANCE_API,
  EMPLOYEES_API,
  EMPLOYEE_API,
  LEAVES_API,
  LEAVE_API,
  SETTINGS_API,
  HOLIDAYS_API,
  employeeByIdApi,
  leaveByIdApi,
  leavesByEmployeeApi,
  holidayByIdApi,
};
