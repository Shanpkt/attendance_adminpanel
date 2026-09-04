import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import axios from "axios";

// Material UI
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "./Dashboard.scss";

function Dashboard() {
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


  // ==========================================
  // TOTAL EMPLOYEES
  // ==========================================

  const totalEmployees = employees.length;


  // ==========================================
  // GET TODAY DATE
  //
  // FORMAT:
  // DD/M/YYYY
  //
  // Example:
  // 4/9/2026
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
  //
  // FORMAT:
  // YYYY-MM-DD
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
                date:
                  todayLeaveDate,

                status:
                  "Scheduled",
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


  // ==========================================
  // GET EMPLOYEE INITIAL
  // ==========================================

  const getEmployeeInitial = (
    mobileNumber
  ) => {

    const name =
      getEmployeeName(
        mobileNumber
      );


    if (!name) {
      return "?";
    }


    return String(name)
      .charAt(0)
      .toUpperCase();
  };


  // ==========================================
  // UNIQUE PRESENT EMPLOYEES
  // ==========================================

  const uniqueEmployees =
    new Set(
      attendanceList
        .map(
          (attendance) =>
            attendance.mobileNumber
        )
        .filter(Boolean)
    );


  const presentCount =
    uniqueEmployees.size;


  // ==========================================
  // LEAVE TYPE HELPERS
  // ==========================================

  const getLeaveEmployeeKey = (leave) => {
    const value =
      leave.mobileNumber ||
      leave.employeeId;

    if (!value) {
      return "";
    }

    return String(value);
  };

  const isHalfDayLeave = (leave) => {
    const leaveType =
      String(
        leave.leaveType || ""
      ).toLowerCase();

    return leaveType.includes("half");
  };


  // ==========================================
  // UNIQUE FULL-DAY LEAVE EMPLOYEES
  // ==========================================

  const uniqueLeaveEmployees =
    new Set(
      todayLeaves
        .filter(
          (leave) =>
            !isHalfDayLeave(leave)
        )
        .map(getLeaveEmployeeKey)
        .filter(Boolean)
    );


  const leaveCount =
    uniqueLeaveEmployees.size;


  // ==========================================
  // UNIQUE HALF-DAY EMPLOYEES
  // ==========================================

  const uniqueHalfDayEmployees =
    new Set(
      todayLeaves
        .filter(isHalfDayLeave)
        .map(getLeaveEmployeeKey)
        .filter(Boolean)
    );


  const halfDayCount =
    uniqueHalfDayEmployees.size;


  // ==========================================
  // ABSENT COUNT
  // ==========================================

  const accountedEmployees =
    new Set([
      ...Array.from(uniqueEmployees).map(
        (value) => String(value)
      ),
      ...uniqueLeaveEmployees,
      ...uniqueHalfDayEmployees,
    ]);


  const absentCount =
    Math.max(
      totalEmployees -
        accountedEmployees.size,
      0
    );


  // ==========================================
  // LATE COMERS
  //
  // Count unique employees who punched in
  // after 10:00 AM today.
  // ==========================================

  const LATE_CUTOFF_HOUR = 10;

  const LATE_CUTOFF_MINUTE = 0;

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

  const earliestPunchByEmployee =
    new Map();

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
  });

  let lateCount = 0;

  earliestPunchByEmployee.forEach(
    (punchInDate) => {
      const hours =
        punchInDate.getHours();

      const minutes =
        punchInDate.getMinutes();

      const isLate =
        hours > LATE_CUTOFF_HOUR ||
        (hours === LATE_CUTOFF_HOUR &&
          minutes > LATE_CUTOFF_MINUTE);

      if (isLate) {
        lateCount += 1;
      }
    }
  );


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
      icon: "◑",
    },

    {
      title: "Late Comer",
      value: lateCount,
      type: "late",
      icon: "⏰",
    },
  ];


  // ==========================================
  // GET STATUS CLASS
  // ==========================================

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

    // ----------------------------------------
    // CHECK DATA
    // ----------------------------------------

    if (
      attendanceList.length === 0
    ) {

      alert(
        "No attendance data available for today."
      );

      return;
    }


    // ----------------------------------------
    // CREATE PDF
    // ----------------------------------------

    const doc =
      new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });


    // ----------------------------------------
    // DATE
    // ----------------------------------------

    const today =
      new Date();


    const day =
      String(
        today.getDate()
      ).padStart(
        2,
        "0"
      );


    const month =
      String(
        today.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const year =
      today.getFullYear();


    const formattedDate =
      `${day}/${month}/${year}`;


    const fileDate =
      `${day}-${month}-${year}`;


    // ----------------------------------------
    // TITLE
    // ----------------------------------------

    doc.setFontSize(
      20
    );


    doc.setFont(
      "helvetica",
      "bold"
    );


    doc.text(
      "Shop Attendance System",
      14,
      15
    );


    // ----------------------------------------
    // SUBTITLE
    // ----------------------------------------

    doc.setFontSize(
      14
    );


    doc.setFont(
      "helvetica",
      "normal"
    );


    doc.text(
      "Today's Attendance Report",
      14,
      24
    );


    // ----------------------------------------
    // DATE
    // ----------------------------------------

    doc.setFontSize(
      10
    );


    doc.text(
      `Date: ${formattedDate}`,
      14,
      32
    );


    // ----------------------------------------
    // SUMMARY
    // ----------------------------------------

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


    // ----------------------------------------
    // TABLE DATA
    // ----------------------------------------

    const tableData =
      attendanceList.map(
        (
          attendance,
          index
        ) => {

          const punchIn =
            attendance.punchIn || {};


          const punchOut =
            attendance.punchOut || {};


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


    // ----------------------------------------
    // CREATE TABLE
    // ----------------------------------------

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


    // ----------------------------------------
    // FOOTER
    // ----------------------------------------

    const pageCount =
      doc.internal.getNumberOfPages();


    for (
      let page = 1;
      page <= pageCount;
      page++
    ) {

      doc.setPage(
        page
      );


      doc.setFontSize(
        8
      );


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


    // ----------------------------------------
    // DOWNLOAD
    // ----------------------------------------

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
            onClick={
              downloadPDF
            }
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
                `stat-card stat-card--${stat.type}`
              }
              key={
                stat.title
              }
            >

              <div className="stat-card__icon">

                {
                  stat.icon
                }

              </div>


              <div>

                <p>
                  {
                    stat.title
                  }
                </p>


                <h2>
                  {
                    stat.value
                  }
                </h2>

              </div>

            </div>

          )
        )}

      </section>


      {/* ======================================
          ATTENDANCE CONTENT
      ====================================== */}

      <section className="dashboard-grid">


        {/* ====================================
            ATTENDANCE
        ==================================== */}

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


              {/* REFRESH */}

              <button
                className="refresh-button"
                onClick={() =>
                  fetchData(true)
                }
                disabled={
                  refreshing
                }
              >

                {
                  refreshing
                    ? "↻ Refreshing..."
                    : "↻ Refresh"
                }

              </button>


              {/* PDF */}

              <button
                className="view-all"
                onClick={
                  downloadPDF
                }
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


          {/* ==================================
              LOADING
          ================================== */}

          {loading && (

            <div className="attendance-placeholder">

              <div className="dashboard-loader">
                <span></span>
              </div>

              Loading attendance...

            </div>

          )}


          {/* ==================================
              ERROR
          ================================== */}

          {!loading &&
            error && (

              <div className="attendance-placeholder">

                {
                  error
                }

              </div>

            )}


          {/* ==================================
              NO DATA
          ================================== */}

          {!loading &&
            !error &&
            attendanceList.length === 0 && (

              <div className="attendance-placeholder">

                No attendance records found for today.

              </div>

            )}


          {/* ==================================
              ATTENDANCE LIST
          ================================== */}

          {!loading &&
            !error &&
            attendanceList.length > 0 && (

              <Box className="attendance-list">


                {/* =================================
                    LIST HEADER
                ================================= */}

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


                {/* =================================
                    ROWS
                ================================= */}

                {attendanceList.map(
                  (
                    attendance
                  ) => {

                    // --------------------------------
                    // NEW NESTED DATA
                    // --------------------------------

                    const punchIn =
                      attendance.punchIn ||
                      {};

                    const punchOut =
                      attendance.punchOut ||
                      {};


                    // --------------------------------
                    // TIMES
                    // --------------------------------

                    const punchInTime =
                      formatShortTime(
                        punchIn.timestamp
                      );


                    const punchOutTime =
                      formatShortTime(
                        punchOut.timestamp
                      );


                    // --------------------------------
                    // EMPLOYEE
                    // --------------------------------

                    const employeeName =
                      getEmployeeName(
                        attendance.mobileNumber
                      );


                    // --------------------------------
                    // STATUS
                    // --------------------------------

                    const status =
                      attendance.status ||
                      "Punched In";


                    return (

                      <Box
                        key={
                          attendance._id
                        }
                        className="attendance-list__row"
                      >


                        {/* ==========================
                            EMPLOYEE
                        ========================== */}

                        <Box
                          className="attendance-user"
                        >

                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              fontSize: "14px",
                              background:
                                "linear-gradient(135deg, #1976d2, #42a5f5)",
                            }}
                          >

                            {
                              getEmployeeInitial(
                                attendance.mobileNumber
                              )
                            }

                          </Avatar>


                          <Box>

                            <Typography
                              className="attendance-user__number"
                            >

                              {
                                employeeName
                              }

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


                        {/* ==========================
                            DATE
                        ========================== */}

                        <Typography
                          className="attendance-date"
                        >

                          {
                            attendance.date
                          }

                        </Typography>


                        {/* ==========================
                            PUNCH IN
                        ========================== */}

                        <Box
                          className="attendance-punch attendance-punch--in"
                        >

                          <span className="punch-label">
                            Punch In
                          </span>

                          <strong>
                            {
                              punchInTime
                            }
                          </strong>

                        </Box>


                        {/* ==========================
                            PUNCH OUT
                        ========================== */}

                        <Box
                          className="attendance-punch attendance-punch--out"
                        >

                          <span className="punch-label">
                            Punch Out
                          </span>

                          <strong>
                            {
                              punchOutTime
                            }
                          </strong>

                        </Box>


                        {/* ==========================
                            STATUS
                        ========================== */}

                        <Chip
                          label={
                            status
                          }
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