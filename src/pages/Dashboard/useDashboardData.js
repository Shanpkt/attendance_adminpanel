import {
  useCallback,
  useEffect,
  useState,
} from "react";

import axios from "axios";
import {
  ATTENDANCE_API,
  EMPLOYEES_API,
  HOLIDAYS_API,
  LEAVE_API,
} from "../../api";
import { useAdminMode } from "../../context/AdminModeContext";
import { filterEmployeesByWorkspace } from "../../utils/adminMode";

export const formatShortTime = (timestamp) => {
  if (!timestamp) {
    return "—";
  }

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTodayDate = () => {
  const today = new Date();

  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  return `${day}/${month}/${year}`;
};

const getTodayLeaveDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const matchesWorkspaceEmployee = (employees, item) => {
  const mobile = String(item?.mobileNumber || "");
  const employeeId = String(
    item?.employeeId || item?.employee_id || ""
  );

  return employees.some((employee) => {
    const employeeMobile = String(
      employee.mobileNumber || ""
    );
    const id = String(employee._id || employee.id || "");

    return (
      (mobile && employeeMobile === mobile) ||
      (employeeId && id === employeeId)
    );
  });
};

function useDashboardData() {
  const { mode } = useAdminMode();
  const [attendanceList, setAttendanceList] =
    useState([]);
  const [employees, setEmployees] =
    useState([]);
  const [todayLeaves, setTodayLeaves] =
    useState([]);
  const [todayHoliday, setTodayHoliday] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const todayAttendanceDate =
          getTodayDate();
        const todayLeaveDate =
          getTodayLeaveDate();

        const attendanceResponse =
          await axios.get(ATTENDANCE_API);

        const allAttendance =
          attendanceResponse.data.data || [];

        const todayAttendance =
          allAttendance.filter(
            (attendance) => {
              const attendanceDate =
                String(
                  attendance.date || ""
                ).trim();

              return (
                attendanceDate ===
                todayAttendanceDate
              );
            }
          );

        const employeeResponse =
          await axios.get(EMPLOYEES_API, {
            params: { workspace: mode },
          });

        const workspaceEmployees =
          filterEmployeesByWorkspace(
            employeeResponse.data.data || [],
            mode
          );

        setEmployees(workspaceEmployees);

        setAttendanceList(
          todayAttendance.filter((attendance) =>
            matchesWorkspaceEmployee(
              workspaceEmployees,
              attendance
            )
          )
        );

        const leaveResponse =
          await axios.get(LEAVE_API, {
            params: {
              date: todayLeaveDate,
              status: "Scheduled",
            },
          });

        const allLeaves =
          leaveResponse.data.data || [];

        setTodayLeaves(
          allLeaves.filter((leave) =>
            matchesWorkspaceEmployee(
              workspaceEmployees,
              leave
            )
          )
        );

        const holidayResponse =
          await axios.get(HOLIDAYS_API, {
            params: {
              date: todayLeaveDate,
            },
          });

        const holidays =
          holidayResponse.data?.data || [];

        setTodayHoliday(holidays[0] || null);
      } catch (err) {
        console.error(
          "Error fetching dashboard data:",
          err
        );

        setError(
          "Unable to fetch dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mode]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    attendanceList,
    employees,
    todayLeaves,
    todayHoliday,
    loading,
    refreshing,
    error,
    fetchData,
  };
}

export default useDashboardData;
