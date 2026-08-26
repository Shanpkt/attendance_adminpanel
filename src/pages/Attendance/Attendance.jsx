import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import axios from "axios";

import "./Attendance.scss";

// ==========================================
// API URL
// ==========================================

const API_URL =
  "https://attendance-backend-hs75.onrender.com/api/attendance";

// ==========================================
// FORMAT SELECTED DATE FOR DISPLAY
// Example:
// 2026-08-25
// ↓
// 25 August 2026
// ==========================================

const formatDate = (dateString) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ==========================================
// GET YYYY-MM-DD
// ==========================================

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

// ==========================================
// CONVERT API DATE TO YYYY-MM-DD
//
// API:
// 25/8/2026
//
// Converts to:
// 2026-08-25
// ==========================================

const normalizeApiDate = (apiDate) => {
  if (!apiDate) {
    return "";
  }

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(apiDate)) {
    return apiDate;
  }

  // API format: DD/M/YYYY
  const parts = apiDate.split("/");

  if (parts.length === 3) {
    const day = String(parts[0]).padStart(2, "0");
    const month = String(parts[1]).padStart(2, "0");
    const year = parts[2];

    return `${year}-${month}-${day}`;
  }

  return apiDate;
};

// ==========================================
// GET INITIALS
// ==========================================

const getInitials = (name) => {
  if (!name) {
    return "U";
  }

  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

// ==========================================
// FORMAT TIME
// ==========================================

const formatTime = (timestamp) => {
  if (!timestamp) {
    return "--";
  }

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

// ==========================================
// ATTENDANCE PAGE
// ==========================================

function Attendance() {
  // ========================================
  // SELECTED DATE
  // ========================================

  const [selectedDate, setSelectedDate] =
    useState("2026-08-25");

  // ========================================
  // ALL ATTENDANCE DATA
  // ========================================

  const [attendanceData, setAttendanceData] =
    useState([]);

  // ========================================
  // LOADING
  // ========================================

  const [loading, setLoading] =
    useState(true);

  // ========================================
  // ERROR
  // ========================================

  const [error, setError] =
    useState("");

  // ========================================
  // DATE INPUT REF
  // ========================================

  const dateInputRef = useRef(null);

  // ========================================
  // FETCH ATTENDANCE
  // ========================================

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          API_URL
        );

        console.log(
          "Attendance API response:",
          response.data
        );

        const data =
          response.data?.data || [];

        console.log(
          "Attendance data:",
          data
        );

        setAttendanceData(data);
      } catch (err) {
        console.error(
          "Error fetching attendance:",
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

  // ========================================
  // OPEN CALENDAR
  // ========================================

  const openDatePicker = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (error) {
        dateInputRef.current.focus();
      }
    }
  };

  // ========================================
  // DATE CHANGE
  // ========================================

  const handleDateChange = (event) => {
    const value = event.target.value;

    console.log(
      "Selected date:",
      value
    );

    setSelectedDate(value);
  };

  // ========================================
  // PREVIOUS DAY
  // ========================================

  const handlePreviousDay = () => {
    const currentDate = new Date(
      `${selectedDate}T00:00:00`
    );

    currentDate.setDate(
      currentDate.getDate() - 1
    );

    const newDate =
      getDateString(currentDate);

    console.log(
      "Previous date:",
      newDate
    );

    setSelectedDate(newDate);
  };

  // ========================================
  // NEXT DAY
  // ========================================

  const handleNextDay = () => {
    const currentDate = new Date(
      `${selectedDate}T00:00:00`
    );

    currentDate.setDate(
      currentDate.getDate() + 1
    );

    const newDate =
      getDateString(currentDate);

    console.log(
      "Next date:",
      newDate
    );

    setSelectedDate(newDate);
  };

  // ========================================
  // TODAY
  // ========================================

  const handleToday = () => {
    const today = new Date();

    const todayString =
      getDateString(today);

    console.log(
      "Today:",
      todayString
    );

    setSelectedDate(todayString);
  };

  // ========================================
  // FILTER ATTENDANCE BY DATE
  // ========================================

  const filteredAttendance =
    attendanceData.filter(
      (attendance) => {
        const apiDate =
          normalizeApiDate(
            attendance.date
          );

        const isMatch =
          apiDate === selectedDate;

        console.log(
          "DATE FILTER:",
          {
            apiDate: attendance.date,
            normalizedApiDate: apiDate,
            selectedDate,
            isMatch,
          }
        );

        return isMatch;
      }
    );

  // ========================================
  // UI
  // ========================================

  return (
    <div className="attendance-page">

      {/* ==================================
          HEADER
      ================================== */}

      <div className="attendance-page__header">

        {/* TITLE */}

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

          {/* PREVIOUS */}

          <button
            type="button"
            className="date-arrow"
            onClick={
              handlePreviousDay
            }
          >
            ‹
          </button>

          {/* DATE PICKER */}

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
              {formatDate(
                selectedDate
              )}
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

          {/* NEXT */}

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

      {/* ==================================
          TODAY BUTTON
      ================================== */}

      <div className="attendance-actions">

        <button
          type="button"
          className="today-button"
          onClick={
            handleToday
          }
        >
          Today
        </button>

      </div>

      {/* ==================================
          TABLE
      ================================== */}

      <div className="attendance-table-card">

        {/* TABLE HEADER */}

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

        {/* ==================================
            LOADING
        ================================== */}

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

        {/* ==================================
            ERROR
        ================================== */}

        {!loading &&
          error && (
            <div className="no-attendance">

              <div className="no-attendance__icon">
                ⚠️
              </div>

              <h3>
                {error}
              </h3>

            </div>
          )}

        {/* ==================================
            ATTENDANCE LIST
        ================================== */}

        {!loading &&
          !error &&
          filteredAttendance.length > 0 &&
          filteredAttendance.map(
            (attendance, index) => {

              return (
                <div
                  className="attendance-table__row"
                  key={
                    attendance._id ||
                    index
                  }
                >

                  {/* NUMBER */}

                  <div className="column-number">
                    {index + 1}
                  </div>

                  {/* EMPLOYEE */}

                  <div className="column-employee">

                    <div className="employee-avatar">

                      {getInitials(
                        attendance.mobileNumber
                      )}

                    </div>

                    <span>
                      {attendance.mobileNumber}
                    </span>

                  </div>

                  {/* MOBILE */}

                  <div className="column-mobile">

                    {attendance.mobileNumber}

                  </div>

                  {/* TIME */}

                  <div className="column-time">

                    {formatTime(
                      attendance.timestamp
                    )}

                  </div>

                  {/* STATUS */}

                  <div className="column-status">

                    <span className="status status--present">

                      <span className="status-dot">
                      </span>

                      Present

                    </span>

                  </div>

                </div>
              );
            }
          )}

        {/* ==================================
            NO DATA
        ================================== */}

        {!loading &&
          !error &&
          filteredAttendance.length === 0 && (

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
                {formatDate(
                  selectedDate
                )}
                .
              </p>

            </div>
          )}

        {/* ==================================
            FOOTER
        ================================== */}

        {!loading &&
          !error && (

            <div className="attendance-table__footer">

              <span>

                Total Present:

                <strong>
                  {" "}
                  {
                    filteredAttendance.length
                  }
                </strong>

                {" "}
                Employees

              </span>

            </div>
          )}

      </div>

    </div>
  );
}

export default Attendance;