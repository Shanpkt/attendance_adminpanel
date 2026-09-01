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
  // ATTENDANCE STATE
  // ==========================================

  const [attendanceList, setAttendanceList] =
    useState([]);


  // ==========================================
  // EMPLOYEE STATE
  // ==========================================

  const [employees, setEmployees] =
    useState([]);


  // ==========================================
  // LEAVE STATE
  // ==========================================

  const [todayLeaves, setTodayLeaves] =
    useState([]);


  // ==========================================
  // LOADING STATE
  // ==========================================

  const [loading, setLoading] =
    useState(true);


  // ==========================================
  // REFRESH STATE
  // ==========================================

  const [refreshing, setRefreshing] =
    useState(false);


  // ==========================================
  // ERROR STATE
  // ==========================================

  const [error, setError] =
    useState("");


  // ==========================================
  // TOTAL EMPLOYEES
  // ==========================================

  const totalEmployees =
    employees.length;


  // ==========================================
  // GET TODAY DATE FOR ATTENDANCE
  //
  // ATTENDANCE FORMAT:
  // DD/M/YYYY
  //
  // Example:
  // 1/9/2026
  // ==========================================

  const getTodayDate = useCallback(() => {
    const today = new Date();

    const day =
      today.getDate();

    const month =
      today.getMonth() + 1;

    const year =
      today.getFullYear();

    return `${day}/${month}/${year}`;
  }, []);


  // ==========================================
  // GET TODAY DATE FOR LEAVE API
  //
  // LEAVE DATE FORMAT:
  // YYYY-MM-DD
  //
  // Example:
  // 2026-09-01
  // ==========================================

  const getTodayLeaveDate = useCallback(() => {
    const today = new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        today.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);


  // ==========================================
  // FETCH ATTENDANCE + EMPLOYEES + LEAVES
  // ==========================================

  const fetchData = useCallback(
    async (isRefresh = false) => {

      try {

        // ======================================
        // LOADING STATE
        // ======================================

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");


        // ======================================
        // GET TODAY DATE
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
        // FILTER TODAY'S ATTENDANCE
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


        // ======================================
        // SET TODAY'S ATTENDANCE
        // ======================================

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


        // ======================================
        // SET EMPLOYEES
        // ======================================

        const employeeData =
          employeeResponse.data.data || [];

        setEmployees(
          employeeData
        );


        // ======================================
        // GET TODAY'S SCHEDULED LEAVES
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


        // ======================================
        // GET LEAVE DATA
        // ======================================

        const leaves =
          leaveResponse.data.data || [];


        console.log(
          "Today's scheduled leaves:",
          leaves
        );


        // ======================================
        // SET TODAY'S LEAVES
        // ======================================

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
  // INITIAL API CALL
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
  // COUNT UNIQUE PRESENT EMPLOYEES
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
  // COUNT UNIQUE EMPLOYEES ON LEAVE
  // ==========================================

  const uniqueLeaveEmployees =
    new Set(
      todayLeaves
        .map(
          (leave) =>
            leave.mobileNumber ||
            leave.employeeId
        )
        .filter(Boolean)
        .map(
          (value) =>
            String(value)
        )
    );


  const leaveCount =
    uniqueLeaveEmployees.size;


  // ==========================================
  // ABSENT COUNT
  //
  // Employees who are neither:
  // Present
  // nor
  // On Leave
  // ==========================================

  const absentCount =
    Math.max(
      totalEmployees -
        presentCount -
        leaveCount,
      0
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
  ];


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
    // TODAY DATE
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
    // PDF TITLE
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

    doc.setFontSize(
      10
    );


    doc.text(
      `Total Employees: ${totalEmployees}`,
      90,
      32
    );


    doc.text(
      `Present: ${presentCount}`,
      170,
      32
    );


    doc.text(
      `Absent: ${absentCount}`,
      230,
      32
    );


    // ----------------------------------------
    // PREPARE TABLE DATA
    // ----------------------------------------

    const tableData =
      attendanceList.map(
        (
          attendance,
          index
        ) => {

          const timestamp =
            new Date(
              attendance.timestamp
            );


          const time =
            timestamp.toLocaleTimeString(
              "en-IN",
              {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }
            );


          return [
            index + 1,

            getEmployeeName(
              attendance.mobileNumber
            ),

            attendance.mobileNumber ||
              "",

            attendance.date ||
              formattedDate,

            time,

            attendance.latitude ||
              "",

            attendance.longitude ||
              "",

            attendance.accuracy ||
              "",
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
            "Sr. No.",
            "Employee Name",
            "Mobile Number",
            "Date",
            "Time",
            "Latitude",
            "Longitude",
            "GPS Accuracy",
          ],
        ],

        body: tableData,

        theme: "grid",

        styles: {
          fontSize: 8,
          cellPadding: 3,
          valign: "middle",
        },

        headStyles: {
          fontSize: 8,
          fontStyle: "bold",
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 15,
            halign: "center",
          },

          1: {
            cellWidth: 45,
          },

          2: {
            cellWidth: 35,
          },

          3: {
            cellWidth: 28,
          },

          4: {
            cellWidth: 30,
          },

          5: {
            cellWidth: 32,
          },

          6: {
            cellWidth: 32,
          },

          7: {
            cellWidth: 30,
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


        {/* ==================================
            PDF BUTTON
        ================================== */}

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

            <h2>
              Today's Attendance List
            </h2>


            <div className="attendance-actions">


              {/* =================================
                  REFRESH BUTTON
              ================================= */}

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


              {/* =================================
                  PDF BUTTON
              ================================= */}

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


                {/* ==============================
                    LIST HEADER
                ============================== */}

                <Box className="attendance-list__header">

                  <Typography>
                    Employee
                  </Typography>

                  <Typography>
                    Date
                  </Typography>

                  <Typography>
                    Time
                  </Typography>

                </Box>


                {/* ==============================
                    ATTENDANCE ROWS
                ============================== */}

                {attendanceList.map(
                  (
                    attendance
                  ) => {

                    const timestamp =
                      new Date(
                        attendance.timestamp
                      );


                    const time =
                      timestamp.toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }
                      );


                    const employeeName =
                      getEmployeeName(
                        attendance.mobileNumber
                      );


                    return (

                      <Box
                        key={
                          attendance._id
                        }
                        className="attendance-list__row"
                      >


                        {/* ==================
                            EMPLOYEE
                        ================== */}

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


                        {/* ==================
                            DATE
                        ================== */}

                        <Typography
                          className="attendance-date"
                        >

                          {
                            attendance.date
                          }

                        </Typography>


                        {/* ==================
                            TIME
                        ================== */}

                        <Chip
                          label={
                            time
                          }
                          size="small"
                          className="attendance-time"
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