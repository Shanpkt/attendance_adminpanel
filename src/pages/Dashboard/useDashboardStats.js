import {
  isPunchAfterTime,
  isPunchBeforeTime,
} from "../../utils/attendanceSettings";
import { formatShortTime } from "./useDashboardData";

const normalizeLeaveDate = (value) => {
  if (!value) {
    return "";
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const slashParts = text.split("/");

  if (slashParts.length === 3) {
    const day = String(
      slashParts[0]
    ).padStart(2, "0");
    const month = String(
      slashParts[1]
    ).padStart(2, "0");
    const year = String(
      slashParts[2]
    ).slice(0, 4);

    if (day && month && year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }

  const parsed = new Date(value);

  if (isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(
    parsed.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    parsed.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

const isLeaveOnToday = (leave) => {
  const today = getTodayLeaveDate();
  const startDate = normalizeLeaveDate(
    leave.startDate
  );
  const endDate = normalizeLeaveDate(
    leave.endDate
  );
  const leaveDate = normalizeLeaveDate(
    leave.date
  );

  if (startDate && endDate) {
    return today >= startDate && today <= endDate;
  }

  if (leaveDate) {
    return leaveDate === today;
  }

  if (startDate) {
    return startDate === today;
  }

  if (endDate) {
    return endDate === today;
  }

  return false;
};

const getLeaveEmployeeKey = (leave) => {
  const value =
    leave.mobileNumber || leave.employeeId;

  if (!value) {
    return "";
  }

  return String(value);
};

const isHalfDayLeave = (leave) => {
  const leaveType = String(
    leave.leaveType || ""
  ).toLowerCase();

  return leaveType.includes("half");
};

const getEmployeeName = (
  employees,
  mobileNumber
) => {
  const employee = employees.find(
    (emp) =>
      String(emp.mobileNumber) ===
      String(mobileNumber)
  );

  if (employee) {
    return (
      employee.name ||
      employee.fullName ||
      employee.employeeName ||
      employee.firstName ||
      mobileNumber
    );
  }

  return mobileNumber;
};

const findEmployeeByKey = (employees, key) => {
  return employees.find(
    (employee) =>
      String(employee.mobileNumber || "") ===
        String(key) ||
      String(employee._id || "") ===
        String(key) ||
      String(employee.id || "") === String(key)
  );
};

const getPunchInDate = (attendance) => {
  const timestamp =
    attendance?.punchIn?.timestamp ||
    attendance.timestamp ||
    attendance.createdAt;

  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
};

function useDashboardStats({
  attendanceList,
  employees,
  todayLeaves,
  lateComingTime,
  halfDayTime,
  isHoliday = false,
}) {
  const totalEmployees = employees.length;

  const uniqueEmployees = new Set(
    attendanceList
      .map((attendance) =>
        String(attendance.mobileNumber)
      )
      .filter(Boolean)
  );

  const presentCount = uniqueEmployees.size;

  const currentDayLeaves = todayLeaves.filter(
    isLeaveOnToday
  );

  const uniqueLeaveEmployees = new Set(
    currentDayLeaves
      .filter((leave) => !isHalfDayLeave(leave))
      .map(getLeaveEmployeeKey)
      .filter(Boolean)
  );

  const leaveCount = uniqueLeaveEmployees.size;

  const getLeaveDisplayName = (leave) => {
    if (
      leave.employeeName ||
      leave.name ||
      leave.fullName
    ) {
      return (
        leave.employeeName ||
        leave.name ||
        leave.fullName
      );
    }

    const key = getLeaveEmployeeKey(leave);

    const employee = employees.find(
      (emp) =>
        String(emp.mobileNumber || "") ===
          key ||
        String(emp._id || "") ===
          String(leave.employeeId || "")
    );

    if (employee) {
      return (
        employee.name ||
        employee.fullName ||
        employee.employeeName ||
        employee.firstName ||
        key ||
        "Unknown Employee"
      );
    }

    return key || "Unknown Employee";
  };

  const onLeaveEmployees = [];
  const seenLeaveKeys = new Set();

  currentDayLeaves
    .filter((leave) => !isHalfDayLeave(leave))
    .forEach((leave) => {
      const uniqueKey =
        getLeaveEmployeeKey(leave) ||
        String(leave._id || leave.id || "");

      if (
        !uniqueKey ||
        seenLeaveKeys.has(uniqueKey)
      ) {
        return;
      }

      seenLeaveKeys.add(uniqueKey);

      const matchedEmployee = employees.find(
        (emp) =>
          String(emp.mobileNumber || "") ===
            uniqueKey ||
          String(emp._id || "") ===
            String(leave.employeeId || "")
      );

      onLeaveEmployees.push({
        id: leave._id || uniqueKey,
        name: getLeaveDisplayName(leave),
        mobileNumber:
          leave.mobileNumber || uniqueKey,
        profilePic:
          matchedEmployee?.profilePic || "",
        leaveType: leave.leaveType || "Full Day",
        reason: leave.reason || "",
      });
    });

  const uniqueHalfDayEmployees = new Set(
    currentDayLeaves
      .filter(isHalfDayLeave)
      .map(getLeaveEmployeeKey)
      .filter(Boolean)
  );

  const absentEmployees = isHoliday
    ? []
    : employees.filter((employee) => {
        const mobileNumber = String(
          employee.mobileNumber || ""
        );

        if (!mobileNumber) {
          return false;
        }

        const isPresent =
          uniqueEmployees.has(mobileNumber);
        const isOnFullDayLeave =
          uniqueLeaveEmployees.has(
            mobileNumber
          );
        const isOnHalfDayLeave =
          uniqueHalfDayEmployees.has(
            mobileNumber
          );

        return (
          !isPresent &&
          !isOnFullDayLeave &&
          !isOnHalfDayLeave
        );
      });

  const absentCount = absentEmployees.length;

  const earliestPunchByEmployee = new Map();

  attendanceList.forEach((attendance) => {
    const mobileNumber =
      attendance.mobileNumber;

    if (!mobileNumber) {
      return;
    }

    const punchInDate =
      getPunchInDate(attendance);

    if (!punchInDate) {
      return;
    }

    const employeeKey = String(mobileNumber);
    const existingPunch =
      earliestPunchByEmployee.get(employeeKey);

    if (
      !existingPunch ||
      punchInDate < existingPunch
    ) {
      earliestPunchByEmployee.set(
        employeeKey,
        punchInDate
      );
    }
  });

  const halfDayByPunchKeys = new Set();
  const halfDayLateInKeys = new Set();
  const halfDayEarlyOutKeys = new Set();

  attendanceList.forEach((attendance) => {
    const mobileNumber =
      attendance.mobileNumber;

    if (!mobileNumber) {
      return;
    }

    const employeeKey = String(mobileNumber);
    const punchInTimestamp =
      attendance?.punchIn?.timestamp ||
      attendance.timestamp ||
      attendance.createdAt;
    const punchOutTimestamp =
      attendance?.punchOut?.timestamp;

    const latePunchIn = isPunchAfterTime(
      punchInTimestamp,
      halfDayTime
    );
    const earlyPunchOut = isPunchBeforeTime(
      punchOutTimestamp,
      halfDayTime
    );

    if (latePunchIn || earlyPunchOut) {
      halfDayByPunchKeys.add(employeeKey);
    }

    if (latePunchIn) {
      halfDayLateInKeys.add(employeeKey);
    }

    if (earlyPunchOut) {
      halfDayEarlyOutKeys.add(employeeKey);
    }
  });

  const lateEmployeeKeys = new Set();
  const latePunchByEmployee = new Map();

  earliestPunchByEmployee.forEach(
    (punchInDate, employeeKey) => {
      const isLate = isPunchAfterTime(
        punchInDate,
        lateComingTime
      );

      if (
        isLate &&
        !halfDayByPunchKeys.has(employeeKey)
      ) {
        lateEmployeeKeys.add(employeeKey);
        latePunchByEmployee.set(
          employeeKey,
          punchInDate
        );
      }
    }
  );

  const lateCount = lateEmployeeKeys.size;

  const halfDayEmployeeKeys = new Set([
    ...uniqueHalfDayEmployees,
    ...halfDayByPunchKeys,
  ]);

  const halfDayCount = halfDayEmployeeKeys.size;

  const halfDayEmployees = [];
  const seenHalfDayKeys = new Set();

  halfDayEmployeeKeys.forEach((key) => {
    if (!key || seenHalfDayKeys.has(key)) {
      return;
    }

    seenHalfDayKeys.add(key);

    const employee = findEmployeeByKey(
      employees,
      key
    );

    const reasons = [];

    if (uniqueHalfDayEmployees.has(key)) {
      reasons.push("Half Day Leave");
    }

    if (halfDayLateInKeys.has(key)) {
      reasons.push("Late Punch In");
    }

    if (halfDayEarlyOutKeys.has(key)) {
      reasons.push("Early Punch Out");
    }

    halfDayEmployees.push({
      id: employee?._id || key,
      name:
        employee?.name ||
        employee?.fullName ||
        employee?.employeeName ||
        employee?.firstName ||
        getEmployeeName(employees, key),
      mobileNumber:
        employee?.mobileNumber || key,
      profilePic: employee?.profilePic || "",
      reason: reasons.join(" · "),
    });
  });

  const lateEmployees = [];

  lateEmployeeKeys.forEach((key) => {
    const employee = findEmployeeByKey(
      employees,
      key
    );

    lateEmployees.push({
      id: employee?._id || key,
      name:
        employee?.name ||
        employee?.fullName ||
        employee?.employeeName ||
        employee?.firstName ||
        getEmployeeName(employees, key),
      mobileNumber:
        employee?.mobileNumber || key,
      profilePic: employee?.profilePic || "",
      punchInTime: formatShortTime(
        latePunchByEmployee.get(key)
      ),
    });
  });

  const stats = [
    {
      title: "Total Employees",
      value: totalEmployees,
      type: "employees",
      icon: "♙",
    },
    {
      title: "Present",
      value: presentCount,
      type: "present",
      icon: "✓",
    },
    {
      title: "Absent",
      value: absentCount,
      type: "absent",
      icon: "×",
    },
    {
      title: "On Leave",
      value: String(leaveCount).padStart(2, "0"),
      type: "leave",
      icon: "◷",
    },
    {
      title: "Half Day",
      value: String(halfDayCount).padStart(
        2,
        "0"
      ),
      type: "halfday",
      icon: "halfday",
    },
    {
      title: "Late Comer",
      value: lateCount,
      type: "late",
      icon: "late",
    },
  ];

  return {
    totalEmployees,
    presentCount,
    absentCount,
    leaveCount,
    halfDayCount,
    lateCount,
    stats,
    absentEmployees,
    onLeaveEmployees,
    halfDayEmployees,
    lateEmployees,
    getEmployeeName: (mobileNumber) =>
      getEmployeeName(employees, mobileNumber),
  };
}

export default useDashboardStats;
