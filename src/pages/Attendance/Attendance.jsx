import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import axios from "axios";

import {
  Box,
  FormControl,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import {
  Groups,
  CheckCircle,
  EventAvailable,
  Cancel,
  PictureAsPdf,
} from "@mui/icons-material";

import "./Attendance.scss";

// ======================================================
// API URLS
// ======================================================

const ATTENDANCE_API =
  "https://attendance-backend-hs75.onrender.com/api/attendance";

const EMPLOYEES_API =
  "https://attendance-backend-hs75.onrender.com/api/employees";

const LEAVES_API =
  "https://attendance-backend-hs75.onrender.com/api/leaves";

// ======================================================
// FORMAT DATE
// ======================================================

const formatDate = (dateString) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ======================================================
// GET YYYY-MM-DD
// ======================================================

const getDateString = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ======================================================
// NORMALIZE API DATE
// ======================================================

const normalizeApiDate = (apiDate) => {
  if (!apiDate) {
    return "";
  }

  const value = String(apiDate).trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // DD/MM/YYYY
  const parts = value.split("/");

  if (parts.length === 3) {
    const day = String(parts[0]).padStart(2, "0");
    const month = String(parts[1]).padStart(2, "0");
    const year = parts[2];

    return `${year}-${month}-${day}`;
  }

  return value;
};

// ======================================================
// GET INITIALS
// ======================================================

const getInitials = (name) => {
  if (!name) {
    return "U";
  }

  return String(name)
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

// ======================================================
// FORMAT TIME
// ======================================================

const formatTime = (timestamp) => {
  if (!timestamp) {
    return "--";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

// ======================================================
// COMPONENT
// ======================================================

function Attendance() {
  // ====================================================
  // DATE
  // ====================================================

  const [selectedDate, setSelectedDate] = useState(
    getDateString(new Date())
  );

  // ====================================================
  // DATA
  // ====================================================

  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveData, setLeaveData] = useState([]);

  // ====================================================
  // LOADING
  // ====================================================

  const [loading, setLoading] = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(false);

  // ====================================================
  // ERROR
  // ====================================================

  const [error, setError] = useState("");

  // ====================================================
  // STATUS FILTER
  // ====================================================

  const [selectedStatus, setSelectedStatus] =
    useState("all");

  // ====================================================
  // DATE INPUT REF
  // ====================================================

  const dateInputRef = useRef(null);

  // ====================================================
  // FETCH ATTENDANCE
  // ====================================================

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          ATTENDANCE_API
        );

        console.log(
          "Attendance API:",
          response.data
        );

        setAttendanceData(
          response.data?.data || []
        );
      } catch (err) {
        console.error(
          "Attendance fetch error:",
          err
        );

        setError(
          "Unable to fetch attendance data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // ====================================================
  // FETCH EMPLOYEES
  // ====================================================

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          EMPLOYEES_API
        );

        console.log(
          "Employees API:",
          response.data
        );

        setEmployees(
          response.data?.data || []
        );
      } catch (err) {
        console.error(
          "Employee fetch error:",
          err
        );
      }
    };

    fetchEmployees();
  }, []);

  // ====================================================
  // FETCH LEAVES FOR SELECTED DATE
  // ====================================================

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLeaveLoading(true);

        const response = await axios.get(
          LEAVES_API,
          {
            params: {
              date: selectedDate,
              status: "Scheduled",
            },
          }
        );

        console.log(
          "Leave API:",
          response.data
        );

        setLeaveData(
          response.data?.data || []
        );
      } catch (err) {
        console.error(
          "Leave fetch error:",
          err
        );

        setLeaveData([]);
      } finally {
        setLeaveLoading(false);
      }
    };

    fetchLeaves();
  }, [selectedDate]);

  // ====================================================
  // GET EMPLOYEE BY MOBILE NUMBER
  // ====================================================

  const getEmployee = (mobileNumber) => {
    return employees.find(
      (employee) =>
        String(employee.mobileNumber) ===
        String(mobileNumber)
    );
  };

  // ====================================================
  // GET EMPLOYEE NAME
  // ====================================================

  const getEmployeeName = (mobileNumber) => {
    const employee =
      getEmployee(mobileNumber);

    if (!employee) {
      return String(mobileNumber || "Unknown");
    }

    return (
      employee.name ||
      employee.fullName ||
      employee.employeeName ||
      employee.firstName ||
      String(mobileNumber)
    );
  };

  // ====================================================
  // FILTER ATTENDANCE BY DATE
  // ====================================================

  const filteredAttendance =
    attendanceData.filter((attendance) => {
      return (
        normalizeApiDate(
          attendance.date
        ) === selectedDate
      );
    });

  // ====================================================
  // PRESENT MOBILE NUMBERS
  // ====================================================

  const presentMobileNumbers = new Set(
    filteredAttendance
      .map((attendance) =>
        String(attendance.mobileNumber)
      )
      .filter(Boolean)
  );

  // ====================================================
  // CHECK LEAVE
  // ====================================================

  const isEmployeeOnLeave = (
    mobileNumber
  ) => {
    return leaveData.some(
      (leave) =>
        String(leave.mobileNumber) ===
        String(mobileNumber)
    );
  };

  // ====================================================
  // PRESENT EMPLOYEES
  // ====================================================

  const presentEmployees =
    employees.filter((employee) =>
      presentMobileNumbers.has(
        String(employee.mobileNumber)
      )
    );

  // ====================================================
  // LEAVE EMPLOYEES
  // ====================================================

  const leaveEmployees =
    employees.filter((employee) =>
      isEmployeeOnLeave(
        employee.mobileNumber
      )
    );

  // ====================================================
  // ABSENT EMPLOYEES
  // ====================================================

  const absentEmployees =
    employees.filter((employee) => {
      const mobileNumber = String(
        employee.mobileNumber
      );

      const isPresent =
        presentMobileNumbers.has(
          mobileNumber
        );

      const isLeave =
        isEmployeeOnLeave(
          mobileNumber
        );

      return !isPresent && !isLeave;
    });

  // ====================================================
  // OPEN DATE PICKER
  // ====================================================

  const openDatePicker = () => {
    if (!dateInputRef.current) {
      return;
    }

    try {
      dateInputRef.current.showPicker();
    } catch (err) {
      dateInputRef.current.focus();
    }
  };

  // ====================================================
  // DATE CHANGE
  // ====================================================

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setSelectedStatus("all");
  };

  // ====================================================
  // PREVIOUS DAY
  // ====================================================

  const handlePreviousDay = () => {
    const currentDate = new Date(
      `${selectedDate}T00:00:00`
    );

    currentDate.setDate(
      currentDate.getDate() - 1
    );

    setSelectedDate(
      getDateString(currentDate)
    );

    setSelectedStatus("all");
  };

  // ====================================================
  // NEXT DAY
  // ====================================================

  const handleNextDay = () => {
    const currentDate = new Date(
      `${selectedDate}T00:00:00`
    );

    currentDate.setDate(
      currentDate.getDate() + 1
    );

    setSelectedDate(
      getDateString(currentDate)
    );

    setSelectedStatus("all");
  };

  // ====================================================
  // TODAY
  // ====================================================

  const handleToday = () => {
    setSelectedDate(
      getDateString(new Date())
    );

    setSelectedStatus("all");
  };

  // ====================================================
  // STATUS CHANGE
  // ====================================================

  const handleStatusSelect = (event) => {
    setSelectedStatus(
      event.target.value
    );
  };

  // ====================================================
  // PRINT / PDF
  // ====================================================

  const handlePrint = () => {
    window.print();
  };

  // ====================================================
  // DROPDOWN TITLE
  // ====================================================

  const getDropdownTitle = () => {
    switch (selectedStatus) {
      case "present":
        return "Present Employees";

      case "leave":
        return "Employees On Leave";

      case "absent":
        return "Absent Employees";

      default:
        return "All Employee Status";
    }
  };

  // ====================================================
  // DROPDOWN ICON
  // ====================================================

  const getStatusIcon = () => {
    switch (selectedStatus) {
      case "present":
        return (
          <CheckCircle
            sx={{
              color: "#16a34a",
              fontSize: 22,
            }}
          />
        );

      case "leave":
        return (
          <EventAvailable
            sx={{
              color: "#ca8a04",
              fontSize: 22,
            }}
          />
        );

      case "absent":
        return (
          <Cancel
            sx={{
              color: "#dc2626",
              fontSize: 22,
            }}
          />
        );

      default:
        return (
          <Groups
            sx={{
              color: "#2563eb",
              fontSize: 22,
            }}
          />
        );
    }
  };

  // ====================================================
  // RENDER PRESENT ROW
  // ====================================================

  const renderPresentRow = (
    attendance,
    index
  ) => {
    const employee = getEmployee(
      attendance.mobileNumber
    );

    const employeeName =
      employee?.name ||
      employee?.fullName ||
      employee?.employeeName ||
      employee?.firstName ||
      getEmployeeName(
        attendance.mobileNumber
      );

    return (
      <div
        className="attendance-table__row"
        key={
          attendance._id ||
          `${attendance.mobileNumber}-${index}`
        }
      >
        <div className="column-number">
          {index + 1}
        </div>

        <div className="column-employee">
          <div className="employee-avatar">
            {getInitials(employeeName)}
          </div>

          <span>
            {employeeName}
          </span>
        </div>

        <div className="column-mobile">
          {attendance.mobileNumber}
        </div>

        <div className="column-time">
          {formatTime(
            attendance.timestamp
          )}
        </div>

        <div className="column-status">
          <span className="status status--present">
            <span className="status-dot" />
            Present
          </span>
        </div>
      </div>
    );
  };

  // ====================================================
  // RENDER EMPLOYEE ROW
  // ====================================================

  const renderEmployeeRow = (
    employee,
    index,
    status
  ) => {
    const employeeName =
      employee.name ||
      employee.fullName ||
      employee.employeeName ||
      employee.firstName ||
      "Unknown";

    return (
      <div
        className="attendance-table__row"
        key={
          employee._id ||
          `${employee.mobileNumber}-${index}`
        }
      >
        <div className="column-number">
          {index + 1}
        </div>

        <div className="column-employee">
          <div
            className={`employee-avatar employee-avatar--${status}`}
          >
            {getInitials(employeeName)}
          </div>

          <span>
            {employeeName}
          </span>
        </div>

        <div className="column-mobile">
          {employee.mobileNumber}
        </div>

        <div className="column-time">
          --
        </div>

        <div className="column-status">
          {status === "leave" && (
            <span className="status status--leave">
              <span className="status-dot" />
              On Leave
            </span>
          )}

          {status === "absent" && (
            <span className="status status--absent">
              <span className="status-dot" />
              Absent
            </span>
          )}
        </div>
      </div>
    );
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="attendance-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="attendance-page__header">

        <div className="attendance-title">

          <div className="attendance-title__icon">
            📅
          </div>

          <div>
            <h1>
              Attendance List
            </h1>

            <p>
              View employee attendance by date
            </p>
          </div>

        </div>

        {/* DATE CONTROL */}

        <div className="attendance-date-control">

          <button
            type="button"
            className="date-arrow"
            onClick={
              handlePreviousDay
            }
          >
            ‹
          </button>

          <div
            className="date-picker"
            onClick={
              openDatePicker
            }
          >

            <span className="date-picker__calendar">
              📅
            </span>

            <span className="date-picker__value">
              {formatDate(selectedDate)}
            </span>

            <span className="date-down">
              ▾
            </span>

            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={
                handleDateChange
              }
              className="date-input"
            />

          </div>

          <button
            type="button"
            className="date-arrow"
            onClick={
              handleNextDay
            }
          >
            ›
          </button>

        </div>

      </div>

      {/* ==================================================
          ACTIONS
      ================================================== */}

      <div className="attendance-actions">

        <button
          type="button"
          className="today-button"
          onClick={handleToday}
        >
          Today
        </button>

        {/* MATERIAL UI DROPDOWN */}

        <FormControl
          className="mui-status-dropdown"
          size="small"
        >
          <Select
            value={selectedStatus}
            onChange={
              handleStatusSelect
            }
            displayEmpty
            renderValue={() => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                }}
              >
                {getStatusIcon()}

                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  {getDropdownTitle()}
                </Typography>
              </Box>
            )}
            sx={{
              minWidth: 255,
              height: 46,
              borderRadius: "10px",
              backgroundColor: "#ffffff",

              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#e2e8f0",
              },

              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#3b82f6",
              },

              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#2563eb",
              },

              "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center",
                padding:
                  "8px 40px 8px 14px",
              },
            }}
          >

            {/* ALL */}

            <MenuItem
              value="all"
              sx={{
                minHeight: 62,
                borderRadius: "8px",
                mx: 0.5,
                my: 0.3,

                "&.Mui-selected": {
                  backgroundColor: "#eff6ff",
                },

                "&.Mui-selected:hover": {
                  backgroundColor: "#dbeafe",
                },
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#eff6ff",
                  }}
                >
                  <Groups
                    sx={{
                      color: "#2563eb",
                      fontSize: 20,
                    }}
                  />
                </Box>
              </ListItemIcon>

              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    All Employees
                  </Typography>
                }
                secondary={
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    {employees.length} employees
                  </Typography>
                }
              />
            </MenuItem>

            {/* PRESENT */}

            <MenuItem
              value="present"
              sx={{
                minHeight: 62,
                borderRadius: "8px",
                mx: 0.5,
                my: 0.3,

                "&.Mui-selected": {
                  backgroundColor: "#f0fdf4",
                },

                "&.Mui-selected:hover": {
                  backgroundColor: "#dcfce7",
                },
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#dcfce7",
                  }}
                >
                  <CheckCircle
                    sx={{
                      color: "#16a34a",
                      fontSize: 20,
                    }}
                  />
                </Box>
              </ListItemIcon>

              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#15803d",
                    }}
                  >
                    Present
                  </Typography>
                }
                secondary={
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    {presentEmployees.length} employees
                  </Typography>
                }
              />
            </MenuItem>

            {/* LEAVE */}

            <MenuItem
              value="leave"
              sx={{
                minHeight: 62,
                borderRadius: "8px",
                mx: 0.5,
                my: 0.3,

                "&.Mui-selected": {
                  backgroundColor: "#fefce8",
                },

                "&.Mui-selected:hover": {
                  backgroundColor: "#fef9c3",
                },
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#fef9c3",
                  }}
                >
                  <EventAvailable
                    sx={{
                      color: "#ca8a04",
                      fontSize: 20,
                    }}
                  />
                </Box>
              </ListItemIcon>

              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#a16207",
                    }}
                  >
                    On Leave
                  </Typography>
                }
                secondary={
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    {leaveLoading
                      ? "Loading..."
                      : `${leaveEmployees.length} employees`}
                  </Typography>
                }
              />
            </MenuItem>

            {/* ABSENT */}

            <MenuItem
              value="absent"
              sx={{
                minHeight: 62,
                borderRadius: "8px",
                mx: 0.5,
                my: 0.3,

                "&.Mui-selected": {
                  backgroundColor: "#fef2f2",
                },

                "&.Mui-selected:hover": {
                  backgroundColor: "#fee2e2",
                },
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#fee2e2",
                  }}
                >
                  <Cancel
                    sx={{
                      color: "#dc2626",
                      fontSize: 20,
                    }}
                  />
                </Box>
              </ListItemIcon>

              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#dc2626",
                    }}
                  >
                    Absent
                  </Typography>
                }
                secondary={
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    {absentEmployees.length} employees
                  </Typography>
                }
              />
            </MenuItem>

          </Select>
        </FormControl>

        {/* PRINT BUTTON */}

        <button
          type="button"
          className="print-button"
          onClick={handlePrint}
        >
          <PictureAsPdf fontSize="small" />
          Print PDF
        </button>

      </div>

      {/* ==================================================
          STATUS SUMMARY
      ================================================== */}

      <div className="status-summary">

        <div className="status-summary__item status-summary__item--present">
          <span className="status-summary__dot" />
          <span>Present</span>
          <strong>
            {presentEmployees.length}
          </strong>
        </div>

        <div className="status-summary__item status-summary__item--leave">
          <span className="status-summary__dot" />
          <span>On Leave</span>
          <strong>
            {leaveEmployees.length}
          </strong>
        </div>

        <div className="status-summary__item status-summary__item--absent">
          <span className="status-summary__dot" />
          <span>Absent</span>
          <strong>
            {absentEmployees.length}
          </strong>
        </div>

      </div>

      {/* ==================================================
          TABLE
      ================================================== */}

      <div className="attendance-table-card">

        <div className="attendance-table__header">

          <div className="column-number">
            #
          </div>

          <div className="column-employee">
            Employee
          </div>

          <div className="column-mobile">
            Mobile Number
          </div>

          <div className="column-time">
            Check In Time
          </div>

          <div className="column-status">
            Status
          </div>

        </div>

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <div className="no-attendance">
            <div className="no-attendance__icon">
              ⏳
            </div>

            <h3>
              Loading attendance...
            </h3>
          </div>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {!loading && error && (
          <div className="no-attendance">

            <div className="no-attendance__icon">
              ⚠️
            </div>

            <h3>
              {error}
            </h3>

          </div>
        )}

        {/* ==================================================
            ALL
        ================================================== */}

        {!loading &&
          !error &&
          selectedStatus === "all" && (
            <>
              {filteredAttendance.map(
                renderPresentRow
              )}

              {filteredAttendance.length === 0 && (
                <div className="no-attendance">

                  <div className="no-attendance__icon">
                    📅
                  </div>

                  <h3>
                    No attendance records
                  </h3>

                  <p>
                    No attendance was recorded
                    for{" "}
                    {formatDate(selectedDate)}.
                  </p>

                </div>
              )}
            </>
          )}

        {/* ==================================================
            PRESENT
        ================================================== */}

        {!loading &&
          !error &&
          selectedStatus === "present" && (
            <>
              {filteredAttendance.map(
                renderPresentRow
              )}

              {filteredAttendance.length === 0 && (
                <div className="no-attendance">

                  <div className="no-attendance__icon">
                    🟢
                  </div>

                  <h3>
                    No present employees
                  </h3>

                  <p>
                    No attendance was recorded
                    for{" "}
                    {formatDate(selectedDate)}.
                  </p>

                </div>
              )}
            </>
          )}

        {/* ==================================================
            LEAVE
        ================================================== */}

        {!loading &&
          !error &&
          selectedStatus === "leave" && (
            <>
              {leaveEmployees.map(
                (employee, index) =>
                  renderEmployeeRow(
                    employee,
                    index,
                    "leave"
                  )
              )}

              {leaveEmployees.length === 0 && (
                <div className="no-attendance">

                  <div className="no-attendance__icon">
                    🟡
                  </div>

                  <h3>
                    No employees on leave
                  </h3>

                  <p>
                    No scheduled leave for{" "}
                    {formatDate(selectedDate)}.
                  </p>

                </div>
              )}
            </>
          )}

        {/* ==================================================
            ABSENT
        ================================================== */}

        {!loading &&
          !error &&
          selectedStatus === "absent" && (
            <>
              {absentEmployees.map(
                (employee, index) =>
                  renderEmployeeRow(
                    employee,
                    index,
                    "absent"
                  )
              )}

              {absentEmployees.length === 0 && (
                <div className="no-attendance">

                  <div className="no-attendance__icon">
                    🎉
                  </div>

                  <h3>
                    No absent employees
                  </h3>

                  <p>
                    All employees are accounted
                    for on{" "}
                    {formatDate(selectedDate)}.
                  </p>

                </div>
              )}
            </>
          )}

        {/* ==================================================
            FOOTER
        ================================================== */}

        {!loading && !error && (
          <div className="attendance-table__footer">

            <span>
              Total Present:
              <strong>
                {" "}
                {presentEmployees.length}
              </strong>
            </span>

            <span>
              On Leave:
              <strong>
                {" "}
                {leaveEmployees.length}
              </strong>
            </span>

            <span>
              Absent:
              <strong>
                {" "}
                {absentEmployees.length}
              </strong>
            </span>

          </div>
        )}

      </div>

    </div>
  );
}

export default Attendance;