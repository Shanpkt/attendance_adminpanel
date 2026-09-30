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

function useDashboardData() {
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

        setAttendanceList(todayAttendance);

        const employeeResponse =
          await axios.get(EMPLOYEES_API);

        setEmployees(
          employeeResponse.data.data || []
        );

        const leaveResponse =
          await axios.get(LEAVE_API, {
            params: {
              date: todayLeaveDate,
              status: "Scheduled",
            },
          });

        setTodayLeaves(
          leaveResponse.data.data || []
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
    []
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
