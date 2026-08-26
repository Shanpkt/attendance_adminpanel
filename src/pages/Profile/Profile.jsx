import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
  ArrowLeft,
  CalendarDays,
  Mail,
  Phone,
  Save,
  UserCheck,
  UserX,
  Clock3,
  X,
  MapPinned,
} from "lucide-react";

import "./Profile.scss";

// ==================================================
// API
// ==================================================

const EMPLOYEE_API =
  "https://attendance-backend-hs75.onrender.com/api/employees";

const ATTENDANCE_API =
  "https://attendance-backend-hs75.onrender.com/api/attendance";

// ==================================================
// PROFILE
// ==================================================

function Profile() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  // ==================================================
  // EMPLOYEE
  // ==================================================

  const [employee, setEmployee] = useState(null);

  // ==================================================
  // ATTENDANCE
  // ==================================================

  const [attendance, setAttendance] = useState([]);

  // ==================================================
  // LOADING
  // ==================================================

  const [loading, setLoading] = useState(true);

  const [attendanceLoading, setAttendanceLoading] =
    useState(true);

  // ==================================================
  // ERROR
  // ==================================================

  const [error, setError] = useState("");

  // ==================================================
  // SAVING
  // ==================================================

  const [saving, setSaving] = useState(false);

  // ==================================================
  // PRESENT POPUP
  // ==================================================

  const [showPresentPopup, setShowPresentPopup] =
    useState(false);

  // ==================================================
  // SELECTED MONTH
  // ==================================================

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonthValue());

  // ==================================================
  // FORM
  // ==================================================

  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "",
    email: "",
    phone: "",
    joiningDate: "",
    dateOfBirth: "",
  });

  // ==================================================
  // FETCH EMPLOYEE
  // ==================================================

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(EMPLOYEE_API);

      const employees = response.data?.data || [];

      const selectedEmployee = employees.find(
        (item) =>
          String(item._id || item.id) ===
          String(employeeId)
      );

      if (!selectedEmployee) {
        setError("Employee not found.");
        setEmployee(null);
        return;
      }

      console.log(
        "Selected employee:",
        selectedEmployee
      );

      setEmployee(selectedEmployee);

      // ==================================================
      // SET FORM
      // ==================================================

      setFormData({
        fullName:
          selectedEmployee.name || "",

        employeeId:
          selectedEmployee.employeeId ||
          selectedEmployee._id ||
          selectedEmployee.id ||
          "",

        email:
          selectedEmployee.email || "",

        phone:
          selectedEmployee.mobileNumber ||
          selectedEmployee.mobile ||
          "",

        joiningDate:
          formatDateForInput(
            selectedEmployee.joiningDate
          ),

        dateOfBirth:
          formatDateForInput(
            selectedEmployee.dateOfBirth
          ),
      });
    } catch (err) {
      console.error(
        "Employee fetch error:",
        err
      );

      setError(
        "Unable to fetch employee information."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // FETCH ATTENDANCE
  // ==================================================

  const fetchAttendance = async () => {
    try {
      setAttendanceLoading(true);

      const response = await axios.get(
        ATTENDANCE_API
      );

      const attendanceData =
        response.data?.data || [];

      console.log(
        "All attendance:",
        attendanceData
      );

      setAttendance(attendanceData);
    } catch (err) {
      console.error(
        "Attendance fetch error:",
        err
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  // ==================================================
  // LOAD DATA
  // ==================================================

  useEffect(() => {
    if (!employeeId) {
      setError("Employee ID is missing.");
      setLoading(false);
      return;
    }

    fetchEmployee();
    fetchAttendance();
  }, [employeeId]);

  // ==================================================
  // FORM CHANGE
  // ==================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==================================================
  // SAVE EMPLOYEE
  // ==================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      // Only send fields that still exist
      const requestData = {
        name:
          formData.fullName.trim(),

        mobileNumber:
          formData.phone.trim(),

        email:
          formData.email.trim(),

        joiningDate:
          formData.joiningDate,

        dateOfBirth:
          formData.dateOfBirth,
      };

      const response = await axios.put(
        `${EMPLOYEE_API}/${employeeId}`,
        requestData
      );

      console.log(
        "Employee updated:",
        response.data
      );

      setEmployee(
        response.data?.data ||
          employee
      );

      alert(
        "Employee information updated successfully."
      );

      await fetchEmployee();
    } catch (err) {
      console.error(
        "Update employee error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to update employee."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // BACK
  // ==================================================

  const handleBack = () => {
    navigate("/employees");
  };

  // ==================================================
  // EMPLOYEE DATA
  // ==================================================

  const name =
    employee?.name ||
    employee?.employeeName ||
    "Unknown Employee";

  const phone =
    employee?.mobileNumber ||
    employee?.mobile ||
    "";

  const email =
    employee?.email ||
    "N/A";

  const employeeMongoId =
    employee?._id ||
    employee?.id ||
    "";

  // ==================================================
  // EMPLOYEE ATTENDANCE
  // ==================================================

  const employeeAttendance = useMemo(() => {
    if (!phone) {
      return [];
    }

    return attendance.filter(
      (record) =>
        String(
          record.mobileNumber
        ).replace(/\D/g, "") ===
        String(phone).replace(
          /\D/g,
          ""
        )
    );
  }, [attendance, phone]);

  // ==================================================
  // SELECTED MONTH ATTENDANCE
  // ==================================================

  const selectedMonthAttendance =
    useMemo(() => {
      return employeeAttendance.filter(
        (record) =>
          getRecordMonth(record) ===
          selectedMonth
      );
    }, [
      employeeAttendance,
      selectedMonth,
    ]);

  // ==================================================
  // UNIQUE PRESENT DATES
  // ==================================================

  const presentDateKeys = useMemo(() => {
    return new Set(
      selectedMonthAttendance
        .map((record) =>
          getRecordDateKey(record)
        )
        .filter(Boolean)
    );
  }, [
    selectedMonthAttendance,
  ]);

  // ==================================================
  // PRESENT DAYS
  // ==================================================

  const presentDays =
    presentDateKeys.size;

  // ==================================================
  // WORKING DAYS
  // ==================================================

  const workingDays = useMemo(() => {
    return getWorkingDaysForMonth(
      selectedMonth
    );
  }, [selectedMonth]);

  // ==================================================
  // ABSENT DAYS
  // ==================================================

  const absentDays = Math.max(
    workingDays - presentDays,
    0
  );

  // ==================================================
  // LEAVE DAYS
  // ==================================================

  const leaveDays = 0;

  // ==================================================
  // TOTAL HOURS
  // ==================================================

  const totalMinutes = useMemo(() => {
    return selectedMonthAttendance.reduce(
      (total, record) => {
        const value =
          record.hours ||
          record.workingHours;

        if (!value) {
          return total;
        }

        return (
          total +
          parseWorkingHours(value)
        );
      },
      0
    );
  }, [
    selectedMonthAttendance,
  ]);

  // ==================================================
  // PRESENT POPUP DATA
  // ==================================================

  const presentPopupRecords =
    useMemo(() => {
      return [...selectedMonthAttendance].sort(
        (a, b) =>
          getRecordTimestamp(b) -
          getRecordTimestamp(a)
      );
    }, [
      selectedMonthAttendance,
    ]);

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-loading-icon">
            ⏳
          </div>

          <h2>
            Loading employee profile...
          </h2>
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error || !employee) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <h2>
            {error ||
              "Employee not found."}
          </h2>

          <button
            className="back-button"
            onClick={handleBack}
          >
            <ArrowLeft size={17} />
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="profile-page">

      {/* ==================================================
          BREADCRUMB
      ================================================== */}

      <div className="profile-breadcrumb">
        <span
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Dashboard
        </span>

        <span>›</span>

        <span
          onClick={() =>
            navigate("/employees")
          }
        >
          Employees
        </span>

        <span>›</span>

        <strong>{name}</strong>
      </div>

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="profile-header">
        <div>
          <h1>
            Employee Profile
          </h1>

          <p>
            View employee information
            and attendance
          </p>
        </div>

        <button
          className="back-button"
          onClick={handleBack}
        >
          <ArrowLeft size={17} />
          Back to Employees
        </button>
      </div>

      {/* ==================================================
          PROFILE + FORM
      ================================================== */}

      <div className="profile-content">

        {/* ==================================================
            EMPLOYEE CARD
        ================================================== */}

        <div className="employee-card">

          <div className="employee-avatar-wrapper">
            <div className="employee-avatar">
              {getInitials(name)}
            </div>
          </div>

          <h2>{name}</h2>

          <div className="employee-id">
            {employeeMongoId}
          </div>

          <div className="employee-status">
            Active
          </div>

          <div className="employee-details">

            <ProfileDetail
              icon={Mail}
              label="Email"
              value={email}
            />

            <ProfileDetail
              icon={Phone}
              label="Phone"
              value={
                phone || "N/A"
              }
            />

            <ProfileDetail
              icon={CalendarDays}
              label="Joining Date"
              value={formatDate(
                employee.joiningDate
              )}
            />

            <ProfileDetail
              icon={CalendarDays}
              label="Date of Birth"
              value={formatDate(
                employee.dateOfBirth
              )}
            />

          </div>
        </div>

        {/* ==================================================
            EDIT FORM
        ================================================== */}

        <form
          className="employee-form"
          onSubmit={handleSubmit}
        >
          <h2>
            Edit Employee Information
          </h2>

          <div className="form-grid">

            <FormInput
              label="Full Name"
              name="fullName"
              value={
                formData.fullName
              }
              onChange={
                handleChange
              }
            />

            <FormInput
              label="Employee ID"
              name="employeeId"
              value={
                formData.employeeId
              }
              onChange={
                handleChange
              }
              disabled
            />

            <FormInput
              label="Email"
              name="email"
              value={
                formData.email
              }
              onChange={
                handleChange
              }
            />

            <FormInput
              label="Phone"
              name="phone"
              value={
                formData.phone
              }
              onChange={
                handleChange
              }
            />

            <FormDate
              label="Joining Date"
              name="joiningDate"
              value={
                formData.joiningDate
              }
              onChange={
                handleChange
              }
            />

            <FormDate
              label="Date of Birth"
              name="dateOfBirth"
              value={
                formData.dateOfBirth
              }
              onChange={
                handleChange
              }
            />

          </div>

          <div className="form-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={handleBack}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-button"
              disabled={saving}
            >
              <Save size={17} />

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>
        </form>
      </div>

      {/* ==================================================
          ATTENDANCE SUMMARY
      ================================================== */}

      <AttendanceSummary
        selectedMonth={
          selectedMonth
        }
        setSelectedMonth={
          setSelectedMonth
        }
        presentDays={
          presentDays
        }
        absentDays={
          absentDays
        }
        leaveDays={
          leaveDays
        }
        totalMinutes={
          totalMinutes
        }
        workingDays={
          workingDays
        }
        onPresentClick={() =>
          setShowPresentPopup(true)
        }
      />

      {/* ==================================================
          ATTENDANCE HISTORY
      ================================================== */}

      <AttendanceRecords
        attendance={
          selectedMonthAttendance
        }
        selectedMonth={
          selectedMonth
        }
        loading={
          attendanceLoading
        }
      />

      {/* ==================================================
          PRESENT POPUP
      ================================================== */}

      {showPresentPopup && (
        <PresentPunchModal
          records={
            presentPopupRecords
          }
          employeeName={name}
          selectedMonth={
            selectedMonth
          }
          onClose={() =>
            setShowPresentPopup(false)
          }
        />
      )}

    </div>
  );
}

// ==================================================
// PROFILE DETAIL
// ==================================================

function ProfileDetail({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="employee-detail">
      <Icon size={16} />

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

// ==================================================
// INPUT
// ==================================================

function FormInput({
  label,
  name,
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div className="form-field">

      <label>
        {label}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />

    </div>
  );
}

// ==================================================
// DATE
// ==================================================

function FormDate({
  label,
  name,
  value,
  onChange,
}) {
  return (
    <div className="form-field">

      <label>
        {label}
      </label>

      <div className="date-field">

        <CalendarDays
          size={16}
        />

        <input
          type="date"
          name={name}
          value={value}
          onChange={onChange}
        />

      </div>
    </div>
  );
}

// ==================================================
// ATTENDANCE SUMMARY
// ==================================================

function AttendanceSummary({
  selectedMonth,
  setSelectedMonth,
  presentDays,
  absentDays,
  leaveDays,
  totalMinutes,
  workingDays,
  onPresentClick,
}) {
  const monthName =
    formatMonthName(
      selectedMonth
    );

  const summary = [
    {
      title: "Present Days",
      value: presentDays,
      type: "present",
      icon: UserCheck,
      clickable: true,
    },
    {
      title: "Absent Days",
      value: absentDays,
      type: "absent",
      icon: UserX,
      clickable: false,
    },
    {
      title: "Leave Days",
      value: leaveDays,
      type: "leave",
      icon: Clock3,
      clickable: false,
    },
    {
      title: "Total Working Hours",
      value:
        formatMinutes(
          totalMinutes
        ),
      type: "hours",
      icon: Clock3,
      clickable: false,
    },
  ];

  return (
    <section className="attendance-summary">

      {/* HEADER */}

      <div className="attendance-summary-header">

        <div>
          <h2>
            Attendance Summary
          </h2>

          <p>
            {monthName}
            {" • "}
            Working days:{" "}
            <strong>
              {workingDays}
            </strong>
          </p>
        </div>

        {/* MONTH CALENDAR */}

        <div className="month-picker">

          <CalendarDays
            size={18}
          />

          <input
            type="month"
            value={
              selectedMonth
            }
            onChange={(event) =>
              setSelectedMonth(
                event.target.value
              )
            }
          />

        </div>

      </div>

      {/* CARDS */}

      <div className="summary-items">

        {summary.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <button
                type="button"
                className={`summary-item summary-item--${item.type} ${
                  item.clickable
                    ? "summary-item--clickable"
                    : ""
                }`}
                key={
                  item.title
                }
                onClick={
                  item.clickable
                    ? onPresentClick
                    : undefined
                }
              >

                <div className="summary-icon">
                  <Icon
                    size={20}
                  />
                </div>

                <div className="summary-content">

                  <p>
                    {item.title}
                  </p>

                  <strong>
                    {item.value}
                  </strong>

                  {item.clickable && (
                    <small>
                      Click to view
                      punches
                    </small>
                  )}

                </div>

              </button>
            );
          }
        )}

      </div>

    </section>
  );
}

// ==================================================
// ATTENDANCE RECORDS
// ==================================================

function AttendanceRecords({
  attendance,
  selectedMonth,
  loading,
}) {
  return (
    <section className="attendance-records">

      <div className="attendance-records-header">

        <div>
          <h2>
            Attendance History
          </h2>

          <p>
            Records for{" "}
            <strong>
              {formatMonthName(
                selectedMonth
              )}
            </strong>
          </p>
        </div>

        <strong>
          {attendance.length} Records
        </strong>

      </div>

      {loading ? (
        <div className="no-attendance">

          <Clock3
            size={25}
          />

          <p>
            Loading attendance...
          </p>

        </div>
      ) : attendance.length ===
        0 ? (
        <div className="no-attendance">

          <Clock3
            size={25}
          />

          <p>
            No attendance records
            found for this month.
          </p>

        </div>
      ) : (
        <div className="attendance-table">

          <div className="attendance-table-header">
            <span>#</span>
            <span>Date</span>
            <span>Time</span>
            <span>Location</span>
            <span>Accuracy</span>
            <span>Status</span>
          </div>

          {attendance.map(
            (
              record,
              index
            ) => {

              const recordDate =
                getRecordDate(
                  record
                );

              const time =
                getRecordTime(
                  record
                );

              return (
                <div
                  className="attendance-table-row"
                  key={
                    record._id ||
                    index
                  }
                >

                  <span>
                    {index + 1}
                  </span>

                  <span>
                    {formatDate(
                      recordDate
                    )}
                  </span>

                  <span>
                    {time}
                  </span>

                  <span>

                    {record.latitude !==
                      undefined &&
                    record.longitude !==
                      undefined ? (
                      <span className="location-text">

                        <MapPinned
                          size={14}
                        />

                        {Number(
                          record.latitude
                        ).toFixed(4)}

                        ,{" "}

                        {Number(
                          record.longitude
                        ).toFixed(4)}

                      </span>
                    ) : (
                      "—"
                    )}

                  </span>

                  <span>

                    {record.accuracy !==
                      undefined &&
                    record.accuracy !==
                      null
                      ? `${Math.round(
                          Number(
                            record.accuracy
                          )
                        )} m`
                      : "—"}

                  </span>

                  <span>

                    <span className="attendance-status">
                      Present
                    </span>

                  </span>

                </div>
              );
            }
          )}

        </div>
      )}

    </section>
  );
}

// ==================================================
// PRESENT PUNCH MODAL
// ==================================================

function PresentPunchModal({
  records,
  employeeName,
  selectedMonth,
  onClose,
}) {
  return (
    <div
      className="present-modal-overlay"
      onMouseDown={onClose}
    >

      <div
        className="present-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* HEADER */}

        <div className="present-modal-header">

          <div>
            <h2>
              Present Punches
            </h2>

            <p>
              {employeeName}
              {" • "}
              {formatMonthName(
                selectedMonth
              )}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>

        </div>

        {/* BODY */}

        <div className="present-modal-body">

          {records.length ===
          0 ? (
            <div className="modal-empty">

              <Clock3
                size={30}
              />

              <p>
                No punches found
                for this month.
              </p>

            </div>
          ) : (
            <div className="punch-list">

              {records.map(
                (
                  record,
                  index
                ) => {

                  const date =
                    getRecordDate(
                      record
                    );

                  const time =
                    getRecordTime(
                      record
                    );

                  return (
                    <div
                      className="punch-item"
                      key={
                        record._id ||
                        index
                      }
                    >

                      <div className="punch-number">
                        {index + 1}
                      </div>

                      <div className="punch-date">

                        <strong>
                          {formatDate(
                            date
                          )}
                        </strong>

                        <span>
                          {getDayName(
                            date
                          )}
                        </span>

                      </div>

                      <div className="punch-time">

                        <Clock3
                          size={17}
                        />

                        <strong>
                          {time}
                        </strong>

                      </div>

                      <div className="punch-location">

                        <MapPinned
                          size={16}
                        />

                        <span>

                          {record.latitude !==
                            undefined &&
                          record.longitude !==
                            undefined
                            ? `${Number(
                                record.latitude
                              ).toFixed(
                                4
                              )}, ${Number(
                                record.longitude
                              ).toFixed(
                                4
                              )}`
                            : "Location unavailable"}

                        </span>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

        {/* FOOTER */}

        <div className="present-modal-footer">

          <strong>
            {records.length}
          </strong>

          <span>
            total punches
          </span>

        </div>

      </div>
    </div>
  );
}

// ==================================================
// HELPERS
// ==================================================

function getInitials(name) {
  if (!name) {
    return "U";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0)
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ==================================================
// CURRENT MONTH
// ==================================================

function getCurrentMonthValue() {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  return `${year}-${month}`;
}

// ==================================================
// FORMAT MONTH
// ==================================================

function formatMonthName(
  monthValue
) {
  if (!monthValue) {
    return "";
  }

  const [
    year,
    month,
  ] = monthValue
    .split("-")
    .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      1
    );

  return date.toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  );
}

// ==================================================
// RECORD DATE
// ==================================================

function getRecordDate(record) {
  if (
    record?.date
  ) {
    const dateString =
      String(
        record.date
      );

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        dateString
      )
    ) {
      const [
        year,
        month,
        day,
      ] =
        dateString
          .split("-")
          .map(Number);

      return new Date(
        year,
        month - 1,
        day
      );
    }
  }

  if (
    record?.timestamp
  ) {
    return new Date(
      record.timestamp
    );
  }

  return null;
}

// ==================================================
// RECORD TIMESTAMP
// ==================================================

function getRecordTimestamp(
  record
) {
  if (
    record?.timestamp
  ) {
    const timestamp =
      new Date(
        record.timestamp
      ).getTime();

    if (
      !Number.isNaN(timestamp)
    ) {
      return timestamp;
    }
  }

  const date =
    getRecordDate(record);

  return date
    ? date.getTime()
    : 0;
}

// ==================================================
// RECORD DATE KEY
// ==================================================

function getRecordDateKey(
  record
) {
  if (
    record?.date
  ) {
    const dateString =
      String(
        record.date
      );

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        dateString
      )
    ) {
      return dateString;
    }
  }

  const date =
    getRecordDate(record);

  if (!date) {
    return "";
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

// ==================================================
// RECORD MONTH
// ==================================================

function getRecordMonth(
  record
) {
  const date =
    getRecordDate(record);

  if (!date) {
    return "";
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

// ==================================================
// RECORD TIME
// ==================================================

function getRecordTime(
  record
) {
  if (
    !record?.timestamp
  ) {
    return "—";
  }

  const date =
    new Date(
      record.timestamp
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }
  );
}

// ==================================================
// DAY NAME
// ==================================================

function getDayName(date) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
    }
  );
}

// ==================================================
// FORMAT DATE
// ==================================================

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const parsedDate =
    date instanceof Date
      ? date
      : new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "—";
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

// ==================================================
// DATE INPUT
// ==================================================

function formatDateForInput(
  date
) {
  if (!date) {
    return "";
  }

  const dateString =
    String(date);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateString
    )
  ) {
    return dateString;
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "";
  }

  return [
    parsedDate.getFullYear(),
    String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0"),
    String(
      parsedDate.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

// ==================================================
// WORKING DAYS
// ==================================================

function getWorkingDaysForMonth(
  monthValue
) {
  if (!monthValue) {
    return 0;
  }

  const [
    year,
    month,
  ] =
    monthValue
      .split("-")
      .map(Number);

  const now =
    new Date();

  const currentYear =
    now.getFullYear();

  const currentMonth =
    now.getMonth();

  let lastDay;

  // Future month
  if (
    year > currentYear ||
    (
      year === currentYear &&
      month - 1 >
        currentMonth
    )
  ) {
    return 0;
  }

  // Current month
  if (
    year === currentYear &&
    month - 1 ===
      currentMonth
  ) {
    lastDay =
      now.getDate();
  } else {
    lastDay =
      new Date(
        year,
        month,
        0
      ).getDate();
  }

  let workingDays = 0;

  for (
    let day = 1;
    day <= lastDay;
    day++
  ) {
    const date =
      new Date(
        year,
        month - 1,
        day
      );

    const dayOfWeek =
      date.getDay();

    // Monday - Friday
    if (
      dayOfWeek !== 0 &&
      dayOfWeek !== 6
    ) {
      workingDays++;
    }
  }

  return workingDays;
}

// ==================================================
// WORKING HOURS
// ==================================================

function parseWorkingHours(
  value
) {
  if (
    typeof value ===
    "number"
  ) {
    return value * 60;
  }

  if (
    typeof value !==
    "string"
  ) {
    return 0;
  }

  const match =
    value.match(
      /(\d+)\s*h(?:ours?)?\s*(?:(\d+)\s*m(?:in(?:ute)?s?)?)?/i
    );

  if (!match) {
    return 0;
  }

  const hours =
    Number(
      match[1]
    ) || 0;

  const minutes =
    Number(
      match[2]
    ) || 0;

  return (
    hours * 60 +
    minutes
  );
}

// ==================================================
// FORMAT MINUTES
// ==================================================

function formatMinutes(
  minutes
) {
  if (!minutes) {
    return "0h 0m";
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remainingMinutes =
    minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

// ==================================================

export default Profile;