import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import axios from "axios";

// Material UI
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import ContrastIcon from "@mui/icons-material/Contrast";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import jsPDF from "jspdf";
import useAttendanceSettings from "../../hooks/useAttendanceSettings";
import { isPunchAfterTime } from "../../utils/attendanceSettings";
import EmployeePhoto from "../../components/EmployeePhoto";
import autoTable from "jspdf-autotable";

import "./Dashboard.scss";

function Dashboard() {
  const {
    lateComingTime,
    halfDayTime,
  } = useAttendanceSettings();

  // ==========================================
  // API URLS
  // ==========================================

  const ATTENDANCE_API =
    "https://attendance-backend-hs75.onrender.com/api/attendance";

  const EMPLOYEES_API =
    "https://attendance-backend-hs75.onrender.com/api/employees";

  const LEAVE_API =
    "https://attendance-backend-hs75.onrender.com/api/leaves";

  // ==========================================
  // STATE
  // ==========================================

  const [attendanceList, setAttendanceList] = useState([]);

  const [employees, setEmployees] = useState([]);

  const [todayLeaves, setTodayLeaves] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [openStatPopup, setOpenStatPopup] =
    useState("");

  // ==========================================
  // TOTAL EMPLOYEES
  // ==========================================

  const totalEmployees = employees.length;

  // ==========================================
  // GET TODAY DATE
  // FORMAT: D/M/YYYY
  // ==========================================

  const getTodayDate = useCallback(() => {
    const today = new Date();

    const day = today.getDate();

    const month = today.getMonth() + 1;

    const year = today.getFullYear();

    return `${day}/${month}/${year}`;
  }, []);

  // ==========================================
  // GET TODAY DATE FOR LEAVE API
  // FORMAT: YYYY-MM-DD
  // ==========================================

  const getTodayLeaveDate = useCallback(() => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  const normalizeLeaveDate = (value) => {
    if (!value) {
      return "";
    }

    const text =
      String(value).trim();

    if (
      /^\d{4}-\d{2}-\d{2}/.test(
        text
      )
    ) {
      return text.slice(0, 10);
    }

    const slashParts =
      text.split("/");

    if (
      slashParts.length === 3
    ) {
      const day = String(
        slashParts[0]
      ).padStart(2, "0");

      const month = String(
        slashParts[1]
      ).padStart(2, "0");

      const year = String(
        slashParts[2]
      ).slice(0, 4);

      if (
        day &&
        month &&
        year.length === 4
      ) {
        return `${year}-${month}-${day}`;
      }
    }

    const parsed =
      new Date(value);

    if (
      isNaN(
        parsed.getTime()
      )
    ) {
      return "";
    }

    const year =
      parsed.getFullYear();

    const month = String(
      parsed.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      parsed.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const isLeaveOnToday = (
    leave
  ) => {
    const today =
      getTodayLeaveDate();

    const startDate =
      normalizeLeaveDate(
        leave.startDate
      );

    const endDate =
      normalizeLeaveDate(
        leave.endDate
      );

    const leaveDate =
      normalizeLeaveDate(
        leave.date
      );

    if (
      startDate &&
      endDate
    ) {
      return (
        today >= startDate &&
        today <= endDate
      );
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

  // ==========================================
  // FORMAT SHORT TIME
  // ==========================================

  const formatShortTime = (timestamp) => {
    if (!timestamp) {
      return "—";
    }

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==========================================
  // FETCH DATA
  // ==========================================

  const fetchData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        // ======================================
        // TODAY DATES
        // ======================================

        const todayAttendanceDate =
          getTodayDate();

        const todayLeaveDate =
          getTodayLeaveDate();

        console.log(
          "Today's attendance date:",
          todayAttendanceDate
        );

        console.log(
          "Today's leave date:",
          todayLeaveDate
        );

        // ======================================
        // GET ATTENDANCE
        // ======================================

        const attendanceResponse =
          await axios.get(
            ATTENDANCE_API
          );

        console.log(
          "Attendance API response:",
          attendanceResponse.data
        );

        // ======================================
        // GET ALL ATTENDANCE
        // ======================================

        const allAttendance =
          attendanceResponse.data.data || [];

        // ======================================
        // FILTER TODAY
        // ======================================

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

        console.log(
          "Today's attendance:",
          todayAttendance
        );

        setAttendanceList(
          todayAttendance
        );

        // ======================================
        // GET EMPLOYEES
        // ======================================

        const employeeResponse =
          await axios.get(
            EMPLOYEES_API
          );

        console.log(
          "Employees API response:",
          employeeResponse.data
        );

        const employeeData =
          employeeResponse.data.data || [];

        setEmployees(
          employeeData
        );

        // ======================================
        // GET TODAY'S LEAVES
        // ======================================

        const leaveResponse =
          await axios.get(
            LEAVE_API,
            {
              params: {
                date: todayLeaveDate,
                status: "Scheduled",
              },
            }
          );

        console.log(
          "Today's leave API response:",
          leaveResponse.data
        );

        const leaves =
          leaveResponse.data.data || [];

        setTodayLeaves(
          leaves
        );

      } catch (error) {
        console.error(
          "Error fetching dashboard data:",
          error
        );

        setError(
          "Unable to fetch dashboard data."
        );

      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [
      getTodayDate,
      getTodayLeaveDate,
    ]
  );

  // ==========================================
  // INITIAL FETCH
  // ==========================================

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================
  // GET EMPLOYEE NAME
  // ==========================================

  const getEmployeeName = (
    mobileNumber
  ) => {
    const employee =
      employees.find(
        (emp) =>
          String(
            emp.mobileNumber
          ) ===
          String(
            mobileNumber
          )
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

  const getEmployeePhoto = (mobileNumber) => {
    const employee = employees.find(
      (emp) =>
        String(emp.mobileNumber) ===
        String(mobileNumber)
    );

    return employee?.profilePic || "";
  };

  // ==========================================
  // UNIQUE PRESENT EMPLOYEES
  // ==========================================

  const uniqueEmployees =
    new Set(
      attendanceList
        .map(
          (attendance) =>
            String(
              attendance.mobileNumber
            )
        )
        .filter(Boolean)
    );

  const presentCount =
    uniqueEmployees.size;

  // ==========================================
  // LEAVE TYPE HELPERS
  // ==========================================

  const getLeaveEmployeeKey = (
    leave
  ) => {
    const value =
      leave.mobileNumber ||
      leave.employeeId;

    if (!value) {
      return "";
    }

    return String(value);
  };

  const isHalfDayLeave = (
    leave
  ) => {
    const leaveType =
      String(
        leave.leaveType || ""
      ).toLowerCase();

    return leaveType.includes("half");
  };

  const currentDayLeaves =
    todayLeaves.filter(
      isLeaveOnToday
    );

  // ==========================================
  // UNIQUE FULL-DAY LEAVE EMPLOYEES
  // ==========================================

  const uniqueLeaveEmployees =
    new Set(
      currentDayLeaves
        .filter(
          (leave) =>
            !isHalfDayLeave(leave)
        )
        .map(
          getLeaveEmployeeKey
        )
        .filter(Boolean)
    );

  const leaveCount =
    uniqueLeaveEmployees.size;

  const getLeaveDisplayName = (
    leave
  ) => {
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

    const key =
      getLeaveEmployeeKey(leave);

    const employee =
      employees.find(
        (emp) =>
          String(
            emp.mobileNumber || ""
          ) === key ||
          String(
            emp._id || ""
          ) ===
            String(
              leave.employeeId || ""
            )
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
    .filter(
      (leave) =>
        !isHalfDayLeave(leave)
    )
    .forEach((leave) => {
      const uniqueKey =
        getLeaveEmployeeKey(leave) ||
        String(
          leave._id ||
            leave.id ||
            ""
        );

      if (
        !uniqueKey ||
        seenLeaveKeys.has(
          uniqueKey
        )
      ) {
        return;
      }

      seenLeaveKeys.add(
        uniqueKey
      );

      const matchedEmployee =
        employees.find(
          (emp) =>
            String(
              emp.mobileNumber || ""
            ) === uniqueKey ||
            String(emp._id || "") ===
              String(leave.employeeId || "")
        );

      onLeaveEmployees.push({
        id:
          leave._id ||
          uniqueKey,
        name: getLeaveDisplayName(
          leave
        ),
        mobileNumber:
          leave.mobileNumber ||
          uniqueKey,
        profilePic:
          matchedEmployee?.profilePic || "",
        leaveType:
          leave.leaveType ||
          "Full Day",
        reason:
          leave.reason || "",
      });
    });

  // ==========================================
  // UNIQUE HALF-DAY EMPLOYEES
  // ==========================================

  const uniqueHalfDayEmployees =
    new Set(
      currentDayLeaves
        .filter(
          isHalfDayLeave
        )
        .map(
          getLeaveEmployeeKey
        )
        .filter(Boolean)
    );

  // ==========================================
  // ABSENT EMPLOYEES LIST
  // ==========================================

  const absentEmployees =
    employees.filter(
      (employee) => {
        const mobileNumber =
          String(
            employee.mobileNumber || ""
          );

        if (!mobileNumber) {
          return false;
        }

        const isPresent =
          uniqueEmployees.has(
            mobileNumber
          );

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
      }
    );

  // ==========================================
  // ABSENT COUNT
  // ==========================================

  const absentCount =
    absentEmployees.length;

  // ==========================================
  // LATE COMERS AND HALF DAY BY PUNCH TIME
  // ==========================================

  const getPunchInDate = (
    attendance
  ) => {
    const timestamp =
      attendance?.punchIn?.timestamp ||
      attendance.timestamp ||
      attendance.createdAt;

    if (!timestamp) {
      return null;
    }

    const date =
      new Date(timestamp);

    if (
      isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    return date;
  };

  const earliestPunchByEmployee =
    new Map();

  attendanceList.forEach(
    (attendance) => {
      const mobileNumber =
        attendance.mobileNumber;

      if (!mobileNumber) {
        return;
      }

      const punchInDate =
        getPunchInDate(
          attendance
        );

      if (!punchInDate) {
        return;
      }

      const employeeKey =
        String(mobileNumber);

      const existingPunch =
        earliestPunchByEmployee.get(
          employeeKey
        );

      if (
        !existingPunch ||
        punchInDate < existingPunch
      ) {
        earliestPunchByEmployee.set(
          employeeKey,
          punchInDate
        );
      }
    }
  );

  const halfDayByPunchKeys =
    new Set();

  let lateCount = 0;

  earliestPunchByEmployee.forEach(
    (punchInDate, employeeKey) => {
      const isHalfDayPunch =
        isPunchAfterTime(
          punchInDate,
          halfDayTime
        );

      const isLate =
        isPunchAfterTime(
          punchInDate,
          lateComingTime
        );

      if (isHalfDayPunch) {
        halfDayByPunchKeys.add(
          employeeKey
        );
      }

      if (
        isLate &&
        !isHalfDayPunch
      ) {
        lateCount += 1;
      }
    }
  );

  const halfDayCount = new Set([
    ...uniqueHalfDayEmployees,
    ...halfDayByPunchKeys,
  ]).size;

  // ==========================================
  // STATS
  // ==========================================

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
      value: String(
        leaveCount
      ).padStart(2, "0"),
      type: "leave",
      icon: "◷",
    },

    {
      title: "Half Day",
      value: String(
        halfDayCount
      ).padStart(2, "0"),
      type: "halfday",
      icon: (
        <ContrastIcon fontSize="inherit" />
      ),
    },

    {
      title: "Late Comer",
      value: lateCount,
      type: "late",
      icon: (
        <AccessTimeIcon fontSize="inherit" />
      ),
    },
  ];

  // ==========================================
  // GET STATUS CLASS
  // ==========================================

  const getSelfieUrl = (punch) => {
    if (!punch) {
      return "";
    }

    return (
      punch.selfieUrl ||
      punch.selfieURL ||
      punch.imageUrl ||
      ""
    );
  };

  const renderPunchCell = (
    punch,
    type,
    timeLabel
  ) => {
    const selfieUrl =
      getSelfieUrl(punch);

    const punchClass =
      type === "in"
        ? "attendance-punch attendance-punch--in"
        : "attendance-punch attendance-punch--out";

    const punchLabel =
      type === "in"
        ? "Punch In"
        : "Punch Out";

    const cell = (
      <Box
        className={`${punchClass}${
          selfieUrl
            ? " attendance-punch--has-photo"
            : ""
        }`}
      >
        <span className="punch-label">
          {punchLabel}
        </span>

        <strong>
          {timeLabel}
        </strong>
      </Box>
    );

    if (!selfieUrl) {
      return cell;
    }

    return (
      <Tooltip
        arrow
        placement="top"
        enterDelay={120}
        leaveDelay={80}
        slotProps={{
          tooltip: {
            className: "selfie-tooltip",
            sx: {
              bgcolor: "#ffffff",
              color: "#111827",
              padding: "8px",
              maxWidth: "none",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow:
                "0 16px 40px rgba(15, 23, 42, 0.18)",
            },
          },
          arrow: {
            sx: {
              color: "#ffffff",
            },
          },
        }}
        title={
          <div className="selfie-popup">
            <p className="selfie-popup__title">
              {punchLabel} photo
            </p>

            <img
              src={selfieUrl}
              alt={`${punchLabel} selfie`}
            />
          </div>
        }
      >
        <span className="attendance-punch__hit">
          {cell}
        </span>
      </Tooltip>
    );
  };

  const getStatusClass = (
    status
  ) => {
    if (
      status ===
      "Punched Out"
    ) {
      return "status-punched-out";
    }

    return "status-punched-in";
  };

  // ==========================================
  // DOWNLOAD PDF
  // ==========================================

  const downloadPDF = () => {
    if (
      attendanceList.length === 0
    ) {
      alert(
        "No attendance data available for today."
      );

      return;
    }

    const doc =
      new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

    const today =
      new Date();

    const day =
      String(
        today.getDate()
      ).padStart(2, "0");

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, "0");

    const year =
      today.getFullYear();

    const formattedDate =
      `${day}/${month}/${year}`;

    const fileDate =
      `${day}-${month}-${year}`;

    // TITLE

    doc.setFontSize(20);

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.text(
      "Shop Attendance System",
      14,
      15
    );

    // SUBTITLE

    doc.setFontSize(14);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.text(
      "Today's Attendance Report",
      14,
      24
    );

    // DATE

    doc.setFontSize(10);

    doc.text(
      `Date: ${formattedDate}`,
      14,
      32
    );

    // SUMMARY

    doc.text(
      `Total Employees: ${totalEmployees}`,
      80,
      32
    );

    doc.text(
      `Present: ${presentCount}`,
      165,
      32
    );

    doc.text(
      `Absent: ${absentCount}`,
      220,
      32
    );

    // TABLE DATA

    const tableData =
      attendanceList.map(
        (
          attendance,
          index
        ) => {
          const punchIn =
            attendance.punchIn ||
            {};

          const punchOut =
            attendance.punchOut ||
            {};

          return [
            index + 1,

            getEmployeeName(
              attendance.mobileNumber
            ),

            attendance.mobileNumber ||
              "",

            attendance.date ||
              formattedDate,

            formatShortTime(
              punchIn.timestamp
            ),

            formatShortTime(
              punchOut.timestamp
            ),

            attendance.status ||
              "Punched In",

            punchIn.accuracy != null
              ? `${punchIn.accuracy} m`
              : "",

            punchOut.accuracy != null
              ? `${punchOut.accuracy} m`
              : "",
          ];
        }
      );

    // CREATE TABLE

    autoTable(
      doc,
      {
        startY: 40,

        head: [
          [
            "Sr.",
            "Employee",
            "Mobile",
            "Date",
            "Punch In",
            "Punch Out",
            "Status",
            "In Accuracy",
            "Out Accuracy",
          ],
        ],

        body: tableData,

        theme: "grid",

        styles: {
          fontSize: 7,
          cellPadding: 2.5,
          valign: "middle",
        },

        headStyles: {
          fontSize: 7,
          fontStyle: "bold",
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 12,
            halign: "center",
          },

          1: {
            cellWidth: 38,
          },

          2: {
            cellWidth: 30,
          },

          3: {
            cellWidth: 25,
          },

          4: {
            cellWidth: 25,
          },

          5: {
            cellWidth: 25,
          },

          6: {
            cellWidth: 30,
          },

          7: {
            cellWidth: 25,
          },

          8: {
            cellWidth: 25,
          },
        },

        margin: {
          left: 10,
          right: 10,
        },
      }
    );

    // FOOTER

    const pageCount =
      doc.internal.getNumberOfPages();

    for (
      let page = 1;
      page <= pageCount;
      page++
    ) {
      doc.setPage(page);

      doc.setFontSize(8);

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        "Generated by Shop Attendance System",
        14,
        202
      );

      doc.text(
        `Page ${page} of ${pageCount}`,
        250,
        202
      );
    }

    // DOWNLOAD

    doc.save(
      `Attendance-${fileDate}.pdf`
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="dashboard">

      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="dashboard__header">

        <div>

          <h1>
            Today Attendance
          </h1>

          <p>
            Overview of today's employee
            attendance
          </p>

        </div>

        <div className="dashboard__actions">

          <button
            className="report-button"
            onClick={downloadPDF}
            disabled={
              loading ||
              refreshing ||
              attendanceList.length === 0
            }
          >

            📄

            <span>
              Download PDF
            </span>

          </button>

        </div>

      </div>

      {/* ======================================
          STATS
      ====================================== */}

      <section className="stats">

        {stats.map(
          (stat) => (

            <div
              className={
                `stat-card stat-card--${stat.type}${
                  openStatPopup ===
                  stat.type
                    ? " is-open"
                    : ""
                }`
              }
              key={stat.title}
              onClick={() => {
                if (
                  stat.type !==
                    "absent" &&
                  stat.type !==
                    "leave"
                ) {
                  return;
                }

                setOpenStatPopup(
                  (current) =>
                    current ===
                    stat.type
                      ? ""
                      : stat.type
                );
              }}
            >

              <div className="stat-card__icon">

                {stat.icon}

              </div>

              <div className="stat-card__content">

                <p>
                  {stat.title}
                </p>

                <h2>
                  {stat.value}
                </h2>

              </div>

              {/* ==============================
                  ABSENT EMPLOYEE POPUP
              ============================== */}

              {stat.type === "absent" && (

                <div
                  className="absent-popup"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >

                  <div className="absent-popup__header">

                    <h3>
                      Absent Employees
                    </h3>

                    <span>
                      {absentEmployees.length}
                    </span>

                  </div>

                  <div className="absent-popup__list">

                    {absentEmployees.length > 0 ? (

                      absentEmployees.map(
                        (employee) => {

                          const employeeName =
                            employee.name ||
                            employee.fullName ||
                            employee.employeeName ||
                            employee.firstName ||
                            "Unknown Employee";

                          return (

                            <div
                              className="absent-popup__employee"
                              key={
                                employee._id ||
                                employee.mobileNumber
                              }
                            >

                              <EmployeePhoto
                                className="absent-popup__avatar"
                                src={employee.profilePic}
                                name={employeeName}
                              />

                              <div>

                                <strong>
                                  {employeeName}
                                </strong>

                                <span>
                                  {
                                    employee.mobileNumber
                                  }
                                </span>

                              </div>

                            </div>

                          );
                        }
                      )

                    ) : (

                      <p className="no-absent">
                        No absent employees 🎉
                      </p>

                    )}

                  </div>

                </div>

              )}

              {/* ==============================
                  ON LEAVE EMPLOYEE POPUP
              ============================== */}

              {stat.type === "leave" && (

                <div
                  className="absent-popup leave-popup"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >

                  <div className="absent-popup__header">

                    <h3>
                      On Leave Today
                    </h3>

                    <span>
                      {onLeaveEmployees.length}
                    </span>

                  </div>

                  <div className="absent-popup__list">

                    {onLeaveEmployees.length > 0 ? (

                      onLeaveEmployees.map(
                        (employee) => (

                          <div
                            className="absent-popup__employee"
                            key={
                              employee.id
                            }
                          >

                            <EmployeePhoto
                              className="absent-popup__avatar"
                              src={employee.profilePic}
                              name={employee.name}
                            />

                            <div>

                              <strong>
                                {employee.name}
                              </strong>

                              <span>
                                {
                                  employee.mobileNumber
                                }
                              </span>

                              {(
                                employee.leaveType ||
                                employee.reason
                              ) && (

                                <span className="leave-popup__meta">
                                  {
                                    employee.leaveType
                                  }
                                  {
                                    employee.reason
                                      ? ` · ${employee.reason}`
                                      : ""
                                  }
                                </span>

                              )}

                            </div>

                          </div>

                        )
                      )

                    ) : (

                      <p className="no-absent">
                        No employees on leave today
                      </p>

                    )}

                  </div>

                </div>

              )}

            </div>

          )
        )}

      </section>

      {/* ======================================
          ATTENDANCE CONTENT
      ====================================== */}

      <section className="dashboard-grid">

        <div className="attendance-card">

          {/* ==================================
              HEADER
          ================================== */}

          <div className="card-header">

            <div>

              <h2>
                Today's Attendance List
              </h2>

              <p className="attendance-subtitle">
                Punch in and punch out details
              </p>

            </div>

            <div className="attendance-actions">

              <button
                className="refresh-button"
                onClick={() =>
                  fetchData(true)
                }
                disabled={refreshing}
              >

                {
                  refreshing
                    ? "↻ Refreshing..."
                    : "↻ Refresh"
                }

              </button>

              <button
                className="view-all"
                onClick={downloadPDF}
                disabled={
                  loading ||
                  refreshing ||
                  attendanceList.length === 0
                }
              >

                Download PDF

              </button>

            </div>

          </div>

          {/* LOADING */}

          {loading && (

            <div className="attendance-placeholder">

              <div className="dashboard-loader">
                <span></span>
              </div>

              Loading attendance...

            </div>

          )}

          {/* ERROR */}

          {!loading &&
            error && (

              <div className="attendance-placeholder">

                {error}

              </div>

            )}

          {/* NO DATA */}

          {!loading &&
            !error &&
            attendanceList.length === 0 && (

              <div className="attendance-placeholder">

                No attendance records found for today.

              </div>

            )}

          {/* ATTENDANCE LIST */}

          {!loading &&
            !error &&
            attendanceList.length > 0 && (

              <Box className="attendance-list">

                {/* LIST HEADER */}

                <Box className="attendance-list__header">

                  <Typography>
                    Employee
                  </Typography>

                  <Typography>
                    Date
                  </Typography>

                  <Typography>
                    Punch In
                  </Typography>

                  <Typography>
                    Punch Out
                  </Typography>

                  <Typography>
                    Status
                  </Typography>

                </Box>

                {/* ROWS */}

                {attendanceList.map(
                  (attendance) => {

                    const punchIn =
                      attendance.punchIn ||
                      {};

                    const punchOut =
                      attendance.punchOut ||
                      {};

                    const punchInTime =
                      formatShortTime(
                        punchIn.timestamp
                      );

                    const punchOutTime =
                      formatShortTime(
                        punchOut.timestamp
                      );

                    const employeeName =
                      getEmployeeName(
                        attendance.mobileNumber
                      );

                    const status =
                      attendance.status ||
                      "Punched In";

                    return (

                      <Box
                        key={attendance._id}
                        className="attendance-list__row"
                      >

                        {/* EMPLOYEE */}

                        <Box className="attendance-user">

                          <EmployeePhoto
                            src={getEmployeePhoto(
                              attendance.mobileNumber
                            )}
                            name={employeeName}
                          />

                          <Box>

                            <Typography
                              className="attendance-user__number"
                            >

                              {employeeName}

                            </Typography>

                            <Typography
                              className="attendance-user__label"
                            >

                              {
                                attendance.mobileNumber
                              }

                            </Typography>

                          </Box>

                        </Box>

                        {/* DATE */}

                        <Typography
                          className="attendance-date"
                        >

                          {attendance.date}

                        </Typography>

                        {/* PUNCH IN */}

                        {renderPunchCell(
                          punchIn,
                          "in",
                          punchInTime
                        )}

                        {/* PUNCH OUT */}

                        {renderPunchCell(
                          punchOut,
                          "out",
                          punchOutTime
                        )}

                        {/* STATUS */}

                        <Chip
                          label={status}
                          size="small"
                          className={
                            `attendance-status ${getStatusClass(
                              status
                            )}`
                          }
                        />

                      </Box>

                    );

                  }
                )}

              </Box>

            )}

        </div>

      </section>

    </div>
  );
}

export default Dashboard;