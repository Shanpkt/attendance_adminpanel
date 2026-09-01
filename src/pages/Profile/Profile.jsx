import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Trash2,
  Printer,
  IndianRupee,
} from "lucide-react";

import "./Profile.scss";

// ==================================================
// API
// ==================================================

const EMPLOYEE_API =
  "https://attendance-backend-hs75.onrender.com/api/employees";

const ATTENDANCE_API =
  "https://attendance-backend-hs75.onrender.com/api/attendance";

const LEAVE_API =
  "https://attendance-backend-hs75.onrender.com/api/leaves";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // ==================================================
  // ATTENDANCE
  // ==================================================

  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  const [showPresentPopup, setShowPresentPopup] = useState(false);

  // ==================================================
  // SALARY
  // ==================================================

  const [showSalaryPopup, setShowSalaryPopup] = useState(false);

  // ==================================================
  // LEAVE STATES
  // ==================================================

  const [scheduledLeaves, setScheduledLeaves] = useState([]);

  const [leaveLoading, setLeaveLoading] = useState(false);

  const [leaveSaving, setLeaveSaving] = useState(false);

  const [showLeaveCalendar, setShowLeaveCalendar] = useState(false);

  const [showScheduleLeave, setShowScheduleLeave] = useState(false);

  const [selectedLeaveDate, setSelectedLeaveDate] = useState("");

  const [leaveReason, setLeaveReason] = useState("");

  const [leaveType, setLeaveType] = useState("full");

  const [leaveCalendarMonth, setLeaveCalendarMonth] =
    useState(getCurrentMonthValue());

  // ==================================================
  // MONTH
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
  });

  // ==================================================
  // FETCH EMPLOYEE
  // ==================================================

  const fetchEmployee = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(EMPLOYEE_API);

      console.log(
        "Employee API response:",
        response.data
      );

      const employees = response.data?.data || [];

      const selectedEmployee = employees.find(
        (item) =>
          String(item?._id || item?.id) ===
          String(employeeId)
      );

      if (!selectedEmployee) {
        setError("Employee not found.");
        setEmployee(null);
        return;
      }

      setEmployee(selectedEmployee);

      setFormData({
        fullName: selectedEmployee.name || "",

        employeeId:
          selectedEmployee._id ||
          selectedEmployee.id ||
          "",

        email: selectedEmployee.email || "",

        phone: selectedEmployee.mobileNumber || "",

        joiningDate: formatDateForInput(
          selectedEmployee.joiningDate
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
  }, [employeeId]);

  // ==================================================
  // FETCH ATTENDANCE
  // ==================================================

  const fetchAttendance = useCallback(async () => {
    try {
      setAttendanceLoading(true);

      const response = await axios.get(
        ATTENDANCE_API
      );

      console.log(
        "Attendance API response:",
        response.data
      );

      const attendanceData =
        response.data?.data || [];

      setAttendance(attendanceData);
    } catch (err) {
      console.error(
        "Attendance fetch error:",
        err
      );

      setAttendance([]);
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  // ==================================================
  // FETCH EMPLOYEE LEAVES
  // ==================================================

  const fetchLeaves = useCallback(
    async (mobileNumber) => {
      if (!mobileNumber) {
        setScheduledLeaves([]);
        return;
      }

      try {
        setLeaveLoading(true);

        const cleanMobileNumber = String(
          mobileNumber
        ).replace(/\D/g, "");

        console.log(
          "Fetching leaves for:",
          cleanMobileNumber
        );

        const response = await axios.get(
          `${LEAVE_API}/employee/${cleanMobileNumber}`
        );

        console.log(
          "Leave API response:",
          response.data
        );

        const leaves =
          response.data?.data || [];

        const normalizedLeaves = [];

        leaves.forEach((leave) => {
          const startDate =
            normalizeDateKey(
              leave.startDate
            );

          const endDate =
            normalizeDateKey(
              leave.endDate
            );

          if (!startDate) {
            return;
          }

          const finalEndDate =
            endDate || startDate;

          const dates =
            getDatesBetween(
              startDate,
              finalEndDate
            );

          dates.forEach((date) => {
            normalizedLeaves.push({
              id:
                leave._id ||
                leave.id,

              backendId:
                leave._id ||
                leave.id,

              date,

              leaveType:
                normalizeLeaveType(
                  leave.leaveType
                ),

              reason:
                leave.reason ||
                "Personal Leave",

              status:
                leave.status ||
                "Scheduled",

              startDate,

              endDate:
                finalEndDate,

              employeeId:
                leave.employeeId,

              employeeName:
                leave.employeeName,

              mobileNumber:
                leave.mobileNumber,

              createdAt:
                leave.createdAt,
            });
          });
        });

        setScheduledLeaves(
          normalizedLeaves
        );
      } catch (err) {
        console.error(
          "Leave fetch error:",
          err
        );

        setScheduledLeaves([]);

        alert(
          err.response?.data?.message ||
            "Unable to fetch employee leaves."
        );
      } finally {
        setLeaveLoading(false);
      }
    },
    []
  );

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
  }, [
    employeeId,
    fetchEmployee,
    fetchAttendance,
  ]);

  // ==================================================
  // LOAD LEAVES AFTER EMPLOYEE AVAILABLE
  // ==================================================

  useEffect(() => {
    if (!employee?.mobileNumber) {
      return;
    }

    fetchLeaves(
      employee.mobileNumber
    );
  }, [
    employee?.mobileNumber,
    fetchLeaves,
  ]);

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

      const requestData = {
        name:
          formData.fullName.trim(),

        mobileNumber:
          formData.phone.trim(),

        email:
          formData.email.trim(),

        joiningDate:
          formData.joiningDate,
      };

      const response =
        await axios.put(
          `${EMPLOYEE_API}/${employeeId}`,
          requestData
        );

      if (response.data?.data) {
        setEmployee(
          response.data.data
        );
      }

      alert(
        "Employee information updated successfully."
      );

      await fetchEmployee();

      await fetchLeaves(
        requestData.mobileNumber
      );
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
    "Unknown Employee";

  const phone =
    employee?.mobileNumber ||
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

  const employeeAttendance =
    useMemo(() => {
      if (!phone) {
        return [];
      }

      const cleanPhone =
        String(phone).replace(
          /\D/g,
          ""
        );

      return attendance.filter(
        (record) => {
          const recordPhone =
            String(
              record?.mobileNumber ||
                ""
            ).replace(
              /\D/g,
              ""
            );

          return (
            recordPhone ===
            cleanPhone
          );
        }
      );
    }, [
      attendance,
      phone,
    ]);

  // ==================================================
  // MONTH ATTENDANCE
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
  // PRESENT DAYS
  // ==================================================

  const presentDateKeys =
    useMemo(() => {
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

  const presentDays =
    presentDateKeys.size;

  // ==================================================
  // WORKING DAYS
  // ==================================================

  const workingDays =
    useMemo(() => {
      return getWorkingDaysForMonth(
        selectedMonth
      );
    }, [selectedMonth]);

  // ==================================================
  // LEAVE DAYS
  // ==================================================

  const selectedMonthLeaves =
    useMemo(() => {
      return scheduledLeaves.filter(
        (leave) =>
          leave.date?.startsWith(
            selectedMonth
          ) &&
          leave.status !==
            "Cancelled"
      );
    }, [
      scheduledLeaves,
      selectedMonth,
    ]);

  const leaveDays =
    useMemo(() => {
      return selectedMonthLeaves.reduce(
        (total, leave) => {
          return (
            total +
            (leave.leaveType === "half"
              ? 0.5
              : 1)
          );
        },
        0
      );
    }, [
      selectedMonthLeaves,
    ]);

  // ==================================================
  // ABSENT DAYS
  // ==================================================

  const absentDays =
    Math.max(
      workingDays -
        presentDays -
        leaveDays,
      0
    );

  // ==================================================
  // SORTED PRESENT RECORDS
  // ==================================================

  const presentPopupRecords =
    useMemo(() => {
      return [
        ...selectedMonthAttendance,
      ].sort(
        (a, b) =>
          getRecordTimestamp(b) -
          getRecordTimestamp(a)
      );
    }, [
      selectedMonthAttendance,
    ]);

  // ==================================================
  // SCHEDULE LEAVE
  // ==================================================

  const handleScheduleLeave =
    async () => {
      if (!selectedLeaveDate) {
        alert(
          "Please select a leave date."
        );
        return;
      }

      if (!employeeMongoId) {
        alert(
          "Employee ID is missing."
        );
        return;
      }

      if (!phone) {
        alert(
          "Employee mobile number is missing."
        );
        return;
      }

      const alreadyScheduled =
        scheduledLeaves.some(
          (leave) =>
            leave.date ===
              selectedLeaveDate &&
            leave.status !==
              "Cancelled"
        );

      if (alreadyScheduled) {
        alert(
          "Leave is already scheduled for this date."
        );
        return;
      }

      try {
        setLeaveSaving(true);

        const requestData = {
          employeeId:
            employeeMongoId,

          leaveType:
            leaveType === "half"
              ? "Half Day"
              : "Full Day",

          startDate:
            selectedLeaveDate,

          endDate:
            selectedLeaveDate,

          reason:
            leaveReason.trim() ||
            "Personal Leave",
        };

        const response =
          await axios.post(
            LEAVE_API,
            requestData
          );

        if (
          response.data?.success &&
          response.data?.data
        ) {
          const savedLeave =
            response.data.data;

          setScheduledLeaves(
            (previous) => [
              ...previous,
              {
                id:
                  savedLeave._id,

                backendId:
                  savedLeave._id,

                date:
                  normalizeDateKey(
                    savedLeave.startDate
                  ),

                leaveType:
                  normalizeLeaveType(
                    savedLeave.leaveType
                  ),

                reason:
                  savedLeave.reason ||
                  "Personal Leave",

                status:
                  savedLeave.status ||
                  "Scheduled",

                startDate:
                  normalizeDateKey(
                    savedLeave.startDate
                  ),

                endDate:
                  normalizeDateKey(
                    savedLeave.endDate
                  ),

                employeeId:
                  savedLeave.employeeId,

                employeeName:
                  savedLeave.employeeName,

                mobileNumber:
                  savedLeave.mobileNumber,

                createdAt:
                  savedLeave.createdAt,
              },
            ]
          );
        }

        const selectedType =
          leaveType;

        const selectedDate =
          selectedLeaveDate;

        setSelectedLeaveDate("");
        setLeaveReason("");
        setLeaveType("full");

        setShowScheduleLeave(
          false
        );

        setShowLeaveCalendar(
          true
        );

        alert(
          `${
            selectedType === "half"
              ? "Half Day"
              : "Full Day"
          } leave scheduled for ${formatDate(
            selectedDate
          )}.`
        );

        await fetchLeaves(phone);
      } catch (err) {
        console.error(
          "Schedule leave error:",
          err
        );

        alert(
          err.response?.data?.message ||
            "Unable to schedule leave."
        );
      } finally {
        setLeaveSaving(false);
      }
    };

  // ==================================================
  // DELETE LEAVE
  // ==================================================

  const handleDeleteLeave =
    async (leaveId) => {
      if (!leaveId) {
        alert(
          "Leave ID is missing."
        );
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to remove this scheduled leave?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setLeaveLoading(true);

        const response =
          await axios.delete(
            `${LEAVE_API}/${leaveId}`
          );

        setScheduledLeaves(
          (previous) =>
            previous.filter(
              (leave) =>
                leave.backendId !==
                  leaveId &&
                leave.id !==
                  leaveId
            )
        );

        alert(
          response.data?.message ||
            "Leave deleted successfully."
        );
      } catch (err) {
        console.error(
          "Delete leave error:",
          err
        );

        alert(
          err.response?.data?.message ||
            "Unable to delete leave."
        );
      } finally {
        setLeaveLoading(false);
      }
    };

  // ==================================================
  // SELECT CALENDAR DATE
  // ==================================================

  const handleCalendarDateClick =
    (dateKey) => {
      const existingLeave =
        scheduledLeaves.find(
          (leave) =>
            leave.date === dateKey &&
            leave.status !==
              "Cancelled"
        );

      if (existingLeave) {
        return;
      }

      setSelectedLeaveDate(
        dateKey
      );

      setLeaveType("full");

      setShowLeaveCalendar(
        false
      );

      setShowScheduleLeave(
        true
      );
    };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">

          <div className="profile-spinner" />

          <h2>
            Loading employee profile...
          </h2>

          <p>
            Please wait while we fetch
            the employee information.
          </p>

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

          <div className="error-icon">
            !
          </div>

          <h2>
            {error ||
              "Employee not found."}
          </h2>

          <button
            type="button"
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

      {/* ================= BREADCRUMB ================= */}

      <div className="profile-breadcrumb">

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Dashboard
        </button>

        <span>›</span>

        <button
          type="button"
          onClick={() =>
            navigate("/employees")
          }
        >
          Employees
        </button>

        <span>›</span>

        <strong>
          {name}
        </strong>

      </div>

      {/* ================= HEADER ================= */}

      <div className="profile-header">

        <div>
          <h1>
            Employee Profile
          </h1>

          <p>
            View and manage employee
            information and attendance.
          </p>
        </div>

        <button
          type="button"
          className="back-button"
          onClick={handleBack}
        >
          <ArrowLeft size={17} />
          Back to Employees
        </button>

      </div>

      {/* ================= PROFILE CONTENT ================= */}

      <div className="profile-content">

        {/* ================= EMPLOYEE CARD ================= */}

        <div className="employee-card">

          <div className="employee-avatar-wrapper">

            <div className="employee-avatar">
              {getInitials(name)}
            </div>

          </div>

          <h2>
            {name}
          </h2>

          <div className="employee-id">
            ID: {employeeMongoId}
          </div>

          <div className="employee-status">
            <span />
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

          </div>

        </div>

        {/* ================= FORM ================= */}

        <form
          className="employee-form"
          onSubmit={handleSubmit}
        >

          <div className="form-heading">

            <div>

              <h2>
                Edit Employee Information
              </h2>

              <p>
                Update the employee details
                below.
              </p>

            </div>

          </div>

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
          LEAVE MANAGEMENT
      ================================================== */}

      <section className="leave-section">

        <div className="leave-section-header">

          <div>

            <h2>
              Leave Management
            </h2>

            <p>
              Schedule employee leaves
              and view all scheduled dates.
            </p>

          </div>

          <div className="leave-actions">

            <button
              type="button"
              className="schedule-leave-button"
              onClick={() => {

                setShowLeaveCalendar(
                  false
                );

                setSelectedLeaveDate(
                  ""
                );

                setLeaveReason(
                  ""
                );

                setLeaveType(
                  "full"
                );

                setShowScheduleLeave(
                  true
                );

              }}
              disabled={leaveSaving}
            >
              <CalendarPlus size={17} />

              Schedule Leave
            </button>

            <div className="leave-calendar-wrapper">

              <button
                type="button"
                className="leave-calendar-button"
                onClick={() => {

                  setShowScheduleLeave(
                    false
                  );

                  setShowLeaveCalendar(
                    (previous) =>
                      !previous
                  );

                }}
              >

                <CalendarDays size={17} />

                Leave Calendar

                <span className="leave-count-badge">
                  {
                    scheduledLeaves.filter(
                      (leave) =>
                        leave.status !==
                        "Cancelled"
                    ).length
                  }
                </span>

              </button>

              {showLeaveCalendar && (

                <LeaveCalendarPopup
                  calendarMonth={
                    leaveCalendarMonth
                  }

                  setCalendarMonth={
                    setLeaveCalendarMonth
                  }

                  leaves={
                    scheduledLeaves
                  }

                  onDateClick={
                    handleCalendarDateClick
                  }

                  onDelete={
                    handleDeleteLeave
                  }

                  onClose={() =>
                    setShowLeaveCalendar(
                      false
                    )
                  }

                  loading={
                    leaveLoading
                  }
                />

              )}

            </div>

          </div>

        </div>

        {/* ================= SCHEDULE LEAVE POPUP ================= */}

        {showScheduleLeave && (

          <ScheduleLeavePopup
            selectedDate={
              selectedLeaveDate
            }

            setSelectedDate={
              setSelectedLeaveDate
            }

            reason={
              leaveReason
            }

            setReason={
              setLeaveReason
            }

            leaveType={
              leaveType
            }

            setLeaveType={
              setLeaveType
            }

            onSchedule={
              handleScheduleLeave
            }

            onClose={() =>
              setShowScheduleLeave(
                false
              )
            }

            saving={
              leaveSaving
            }
          />

        )}

      </section>

      {/* ================= ATTENDANCE SUMMARY ================= */}

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

        punchCount={
          selectedMonthAttendance.length
        }

        workingDays={
          workingDays
        }

        onPresentClick={() =>
          setShowPresentPopup(
            true
          )
        }

        onSalaryClick={() =>
          setShowSalaryPopup(
            true
          )
        }
      />

      {/* ================= ATTENDANCE HISTORY ================= */}

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

      {/* ================= PRESENT MODAL ================= */}

      {showPresentPopup && (

        <PresentPunchModal
          records={
            presentPopupRecords
          }

          employeeName={
            name
          }

          selectedMonth={
            selectedMonth
          }

          onClose={() =>
            setShowPresentPopup(
              false
            )
          }
        />

      )}

      {/* ================= SALARY MODAL ================= */}

      {showSalaryPopup && (

        <SalaryCalculationModal
          employee={
            employee
          }

          employeeName={
            name
          }

          employeeId={
            employeeMongoId
          }

          selectedMonth={
            selectedMonth
          }

          attendance={
            selectedMonthAttendance
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

          workingDays={
            workingDays
          }

          onClose={() =>
            setShowSalaryPopup(
              false
            )
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

      <div className="detail-icon">
        <Icon size={16} />
      </div>

      <div className="detail-text">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}

// ==================================================
// FORM INPUT
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

      <label htmlFor={name}>
        {label}
      </label>

      <input
        id={name}
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
// DATE INPUT
// ==================================================

function FormDate({
  label,
  name,
  value,
  onChange,
}) {
  return (
    <div className="form-field">

      <label htmlFor={name}>
        {label}
      </label>

      <div className="date-field">

        <CalendarDays size={17} />

        <input
          id={name}
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
// SCHEDULE LEAVE POPUP
// ==================================================

function ScheduleLeavePopup({
  selectedDate,
  setSelectedDate,
  reason,
  setReason,
  leaveType,
  setLeaveType,
  onSchedule,
  onClose,
  saving,
}) {
  return (
    <div
      className="leave-popup-overlay"
      onMouseDown={onClose}
    >

      <div
        className="schedule-leave-popup"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        <div className="schedule-popup-header">

          <div className="schedule-popup-header-content">

            <div className="schedule-popup-icon">
              <CalendarPlus size={20} />
            </div>

            <div>

              <h3>
                Schedule Leave
              </h3>

              <p>
                Select a date and leave type.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="popup-close-button"
          >
            <X size={18} />
          </button>

        </div>

        <div className="schedule-popup-body">

          <div className="leave-form-field">

            <label>
              Leave Date
            </label>

            <div className="leave-date-input">

              <CalendarDays size={17} />

              <input
                type="date"
                value={
                  selectedDate
                }
                onChange={(event) =>
                  setSelectedDate(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="leave-form-field">

            <label>
              Leave Type
            </label>

            <div className="leave-type-options">

              <button
                type="button"
                className={`leave-type-option ${
                  leaveType === "full"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setLeaveType(
                    "full"
                  )
                }
              >

                <div className="leave-type-radio">

                  {leaveType ===
                    "full" && (
                    <span />
                  )}

                </div>

                <div className="leave-type-content">

                  <strong>
                    Full Day
                  </strong>

                  <small>
                    1 full leave day
                  </small>

                </div>

              </button>

              <button
                type="button"
                className={`leave-type-option ${
                  leaveType === "half"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setLeaveType(
                    "half"
                  )
                }
              >

                <div className="leave-type-radio">

                  {leaveType ===
                    "half" && (
                    <span />
                  )}

                </div>

                <div className="leave-type-content">

                  <strong>
                    Half Day
                  </strong>

                  <small>
                    0.5 leave day
                  </small>

                </div>

              </button>

            </div>

          </div>

          <div className="leave-form-field">

            <label>
              Reason
            </label>

            <input
              type="text"
              placeholder="e.g. Personal Leave"
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
            />

          </div>

        </div>

        <div className="schedule-popup-footer">

          <button
            type="button"
            className="leave-cancel-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="leave-confirm-button"
            onClick={onSchedule}
            disabled={saving}
          >

            <Plus size={17} />

            {saving
              ? "Saving..."
              : `Schedule ${
                  leaveType === "half"
                    ? "Half Day"
                    : "Leave"
                }`}

          </button>

        </div>

      </div>

    </div>
  );
}

// ==================================================
// LEAVE CALENDAR POPUP
// ==================================================

function LeaveCalendarPopup({
  calendarMonth,
  setCalendarMonth,
  leaves,
  onDateClick,
  onDelete,
  onClose,
  loading,
}) {
  const [
    selectedCalendarDate,
    setSelectedCalendarDate,
  ] = useState(null);

  const calendarDays =
    useMemo(() => {
      return generateCalendarDays(
        calendarMonth
      );
    }, [calendarMonth]);

  const monthLeaves =
    leaves.filter(
      (leave) =>
        leave.date?.startsWith(
          calendarMonth
        ) &&
        leave.status !==
          "Cancelled"
    );

  const goPreviousMonth = () => {
    const [
      year,
      month,
    ] = calendarMonth
      .split("-")
      .map(Number);

    const date = new Date(
      year,
      month - 2,
      1
    );

    setCalendarMonth(
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`
    );

    setSelectedCalendarDate(null);
  };

  const goNextMonth = () => {
    const [
      year,
      month,
    ] = calendarMonth
      .split("-")
      .map(Number);

    const date = new Date(
      year,
      month,
      1
    );

    setCalendarMonth(
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`
    );

    setSelectedCalendarDate(null);
  };

  const selectedLeave =
    leaves.find(
      (leave) =>
        leave.date ===
          selectedCalendarDate &&
        leave.status !==
          "Cancelled"
    );

  return (
    <div className="leave-calendar-popup">

      <div className="leave-calendar-header">

        <div>

          <h3>
            Leave Calendar
          </h3>

          <span>
            {formatMonthName(
              calendarMonth
            )}
          </span>

        </div>

        <button
          type="button"
          className="leave-popup-x"
          onClick={onClose}
        >
          <X size={17} />
        </button>

      </div>

      <div className="calendar-navigation">

        <button
          type="button"
          onClick={
            goPreviousMonth
          }
        >
          <ChevronLeft size={17} />
        </button>

        <strong>
          {formatMonthName(
            calendarMonth
          )}
        </strong>

        <button
          type="button"
          onClick={
            goNextMonth
          }
        >
          <ChevronRight size={17} />
        </button>

      </div>

      {loading && (
        <div className="calendar-loading">
          Loading leaves...
        </div>
      )}

      <div className="calendar-weekdays">

        {[
          "Sun",
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
        ].map((day) => (

          <span key={day}>
            {day}
          </span>

        ))}

      </div>

      <div className="calendar-grid">

        {calendarDays.map(
          (day, index) => {

            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="calendar-empty"
                />
              );
            }

            const leave =
              leaves.find(
                (item) =>
                  item.date ===
                    day.date &&
                  item.status !==
                    "Cancelled"
              );

            const isToday =
              day.date ===
              getTodayDateKey();

            const isSelected =
              selectedCalendarDate ===
              day.date;

            return (
              <button
                type="button"
                key={day.date}
                className={[
                  "calendar-day",

                  isToday
                    ? "calendar-day--today"
                    : "",

                  leave
                    ? "calendar-day--leave"
                    : "",

                  leave?.leaveType ===
                    "half"
                    ? "calendar-day--half-leave"
                    : "",

                  isSelected
                    ? "calendar-day--selected"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}

                onClick={() => {

                  if (leave) {

                    setSelectedCalendarDate(
                      day.date
                    );

                  } else {

                    onDateClick(
                      day.date
                    );

                  }

                }}
              >

                <span>
                  {day.day}
                </span>

                {leave && (
                  <i />
                )}

                {leave && (
                  <small>
                    {leave.leaveType ===
                    "half"
                      ? "½"
                      : "F"}
                  </small>
                )}

              </button>
            );
          }
        )}

      </div>

      <div className="calendar-legend">

        <div>
          <span className="legend-dot" />
          Scheduled Leave
        </div>

        <div>
          <span className="legend-half">
            ½
          </span>
          Half Day
        </div>

        <div>
          <span className="legend-today" />
          Today
        </div>

      </div>

      {selectedLeave && (

        <div className="selected-leave-info">

          <div className="selected-leave-info-top">

            <div>

              <span>
                Scheduled Leave
              </span>

              <strong>
                {formatDate(
                  selectedLeave.date
                )}
              </strong>

            </div>

            <button
              type="button"
              onClick={() =>
                onDelete(
                  selectedLeave.backendId ||
                    selectedLeave.id
                )
              }
              title="Delete leave"
              disabled={loading}
            >
              <Trash2 size={16} />
            </button>

          </div>

          <div className="selected-leave-type">

            <span
              className={
                selectedLeave.leaveType ===
                "half"
                  ? "half"
                  : "full"
              }
            >
              {selectedLeave.leaveType ===
              "half"
                ? "Half Day"
                : "Full Day"}
            </span>

          </div>

          <p>
            {selectedLeave.reason ||
              "Personal Leave"}
          </p>

        </div>

      )}

      <div className="calendar-leave-list">

        <div className="calendar-leave-list-header">

          <strong>
            Scheduled Leaves
          </strong>

          <span>
            {monthLeaves.length}
          </span>

        </div>

        {monthLeaves.length ===
        0 ? (

          <div className="calendar-no-leaves">

            <CalendarDays size={22} />

            <p>
              No leaves scheduled
              for this month.
            </p>

          </div>

        ) : (

          [...monthLeaves]
            .sort(
              (a, b) =>
                a.date.localeCompare(
                  b.date
                )
            )
            .map((leave) => (

              <div
                className="calendar-leave-item"
                key={`${leave.id}-${leave.date}`}

                onClick={() =>
                  setSelectedCalendarDate(
                    leave.date
                  )
                }
              >

                <div className="calendar-leave-date">

                  <strong>
                    {new Date(
                      `${leave.date}T00:00:00`
                    ).getDate()}
                  </strong>

                  <span>
                    {new Date(
                      `${leave.date}T00:00:00`
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        month:
                          "short",
                      }
                    )}
                  </span>

                </div>

                <div className="calendar-leave-details">

                  <strong>
                    {leave.reason ||
                      "Personal Leave"}
                  </strong>

                  <span>
                    {formatDate(
                      leave.date
                    )}
                  </span>

                  <small
                    className={
                      leave.leaveType ===
                      "half"
                        ? "half"
                        : "full"
                    }
                  >
                    {leave.leaveType ===
                    "half"
                      ? "Half Day"
                      : "Full Day"}
                  </small>

                </div>

                <button
                  type="button"
                  onClick={(event) => {

                    event.stopPropagation();

                    onDelete(
                      leave.backendId ||
                        leave.id
                    );

                  }}
                  title="Delete leave"
                  disabled={loading}
                >
                  <Trash2 size={15} />
                </button>

              </div>

            ))

        )}

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
  punchCount,
  workingDays,
  onPresentClick,
  onSalaryClick,
}) {
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
      title: "Attendance Punches",
      value: punchCount,
      type: "hours",
      icon: Clock3,
      clickable: false,
    },
  ];

  return (
    <section className="attendance-summary">

      <div className="attendance-summary-header">

        <div>

          <h2>
            Attendance Summary
          </h2>

          <p>

            {formatMonthName(
              selectedMonth
            )}

            <span>•</span>

            Working days:

            <strong>
              {workingDays}
            </strong>

          </p>

        </div>

        <div className="attendance-summary-actions">

          <div className="month-picker">

            <CalendarDays size={18} />

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

          <button
            type="button"
            className="salary-button"
            onClick={
              onSalaryClick
            }
          >

            <IndianRupee size={17} />

            Salary Calculation

          </button>

        </div>

      </div>

      <div className="summary-items">

        {summary.map((item) => {

          const Icon =
            item.icon;

          return (

            <button
              type="button"
              key={item.title}
              className={`summary-item summary-item--${item.type} ${
                item.clickable
                  ? "summary-item--clickable"
                  : ""
              }`}
              onClick={
                item.clickable
                  ? onPresentClick
                  : undefined
              }
            >

              <div className="summary-icon">
                <Icon size={21} />
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
                    Click to view punches
                  </small>
                )}

              </div>

            </button>

          );
        })}

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

        <div className="records-count">
          {attendance.length} Records
        </div>

      </div>

      {loading ? (

        <div className="no-attendance">

          <Clock3 size={28} />

          <p>
            Loading attendance...
          </p>

        </div>

      ) : attendance.length ===
        0 ? (

        <div className="no-attendance">

          <Clock3 size={28} />

          <h3>
            No attendance records
          </h3>

          <p>
            No attendance found for
            this month.
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
            (record, index) => {

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
                    record?._id ||
                    index
                  }
                >

                  <span className="row-number">
                    {index + 1}
                  </span>

                  <span>
                    {formatDate(
                      recordDate
                    )}
                  </span>

                  <span className="time-cell">
                    {time}
                  </span>

                  <span>

                    {record.latitude !==
                      undefined &&
                    record.longitude !==
                      undefined ? (

                      <span className="location-text">

                        <MapPinned size={14} />
                      {record.locationName}
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

        <div className="present-modal-header">

          <div>

            <h2>
              Present Punches
            </h2>

            <p>

              {employeeName}

              <span>•</span>

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

        <div className="present-modal-body">

          {records.length ===
          0 ? (

            <div className="modal-empty">

              <Clock3 size={30} />

              <p>
                No punches found
                for this month.
              </p>

            </div>

          ) : (

            <div className="punch-list">

              {records.map(
                (record, index) => {

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
                        record?._id ||
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

                        <Clock3 size={17} />

                        <strong>
                          {time}
                        </strong>

                      </div>

                      <div className="punch-location">

                        <MapPinned size={16} />

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
// SALARY CALCULATION MODAL
// ==================================================

function SalaryCalculationModal({
  employee,
  employeeName,
  employeeId,
  selectedMonth,
  attendance,
  presentDays,
  absentDays,
  leaveDays,
  workingDays,
  onClose,
}) {
  const [monthlySalary, setMonthlySalary] =
    useState(
      employee?.salary || ""
    );

  const salaryNumber =
    Number(monthlySalary) || 0;

  // ==================================================
  // SALARY CALCULATIONS
  // ==================================================

  const perDaySalary =
    workingDays > 0
      ? salaryNumber / workingDays
      : 0;

  const presentSalary =
    presentDays * perDaySalary;

  const leaveDeduction =
    leaveDays * perDaySalary;

  const absentDeduction =
    absentDays * perDaySalary;

  const finalSalary =
    Math.max(
      salaryNumber -
        leaveDeduction -
        absentDeduction,
      0
    );

  // ==================================================
  // PRINT REPORT
  // ==================================================

  const printAttendance = () => {
    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1100,height=850"
      );

    if (!printWindow) {
      alert(
        "Please allow popups to print."
      );
      return;
    }

    const sortedAttendance =
      [...attendance].sort(
        (a, b) =>
          getRecordTimestamp(a) -
          getRecordTimestamp(b)
      );

    const attendanceRows =
      sortedAttendance
        .map(
          (record, index) => {

            const date =
              getRecordDate(
                record
              );

            const time =
              getRecordTime(
                record
              );

            const latitude =
              record.latitude !==
              undefined
                ? Number(
                    record.latitude
                  ).toFixed(4)
                : "—";

            const longitude =
              record.longitude !==
              undefined
                ? Number(
                    record.longitude
                  ).toFixed(4)
                : "—";

            const accuracy =
              record.accuracy !==
                undefined &&
              record.accuracy !==
                null
                ? `${Math.round(
                    Number(
                      record.accuracy
                    )
                  )} m`
                : "—";

            return `
              <tr>
                <td>${index + 1}</td>
                <td>${formatDate(
                  date
                )}</td>
                <td>${time}</td>
                <td>
                  ${latitude},
                  ${longitude}
                </td>
                <td>${accuracy}</td>
                <td>
                  <span class="present-status">
                    Present
                  </span>
                </td>
              </tr>
            `;
          }
        )
        .join("");

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <title>
            Attendance & Salary Report
          </title>

          <style>

            * {
              box-sizing: border-box;
            }

            body {
              font-family:
                Arial,
                Helvetica,
                sans-serif;

              margin: 0;

              padding: 30px;

              color: #222;

              background: #fff;
            }

            .report-header {
              border-bottom:
                2px solid #222;

              padding-bottom: 18px;

              margin-bottom: 24px;
            }

            .report-header h1 {
              margin: 0 0 6px;

              font-size: 25px;
            }

            .report-header p {
              margin: 0;

              color: #666;

              font-size: 14px;
            }

            .employee-info {
              display: grid;

              grid-template-columns:
                1fr 1fr;

              gap: 12px;

              padding: 15px;

              border:
                1px solid #ddd;

              border-radius: 8px;

              margin-bottom: 25px;
            }

            .employee-info div {
              font-size: 13px;

              line-height: 1.5;
            }

            .employee-info strong {
              display: inline-block;

              min-width: 115px;
            }

            h2 {
              font-size: 18px;

              margin:
                25px 0 12px;
            }

            .summary {
              display: grid;

              grid-template-columns:
                repeat(4, 1fr);

              gap: 12px;
            }

            .summary-box {
              border:
                1px solid #ddd;

              border-radius: 8px;

              padding: 15px;
            }

            .summary-box span {
              display: block;

              font-size: 12px;

              color: #666;

              margin-bottom: 7px;
            }

            .summary-box strong {
              font-size: 22px;
            }

            table {
              width: 100%;

              border-collapse:
                collapse;

              margin-top: 10px;
            }

            th,
            td {
              border:
                1px solid #ddd;

              padding: 9px;

              text-align: left;

              font-size: 12px;
            }

            th {
              background:
                #f5f5f5;

              font-weight: 700;
            }

            .salary-table {
              width: 560px;

              max-width: 100%;
            }

            .salary-table td {
              font-size: 13px;
            }

            .salary-table td:last-child {
              text-align: right;

              font-weight: 700;
            }

            .deduction {
              color: #c62828;
            }

            .final-salary {
              background:
                #f5f5f5;
            }

            .final-salary td {
              font-size: 16px;
            }

            .present-status {
              font-weight: 700;
            }

            .footer {
              margin-top: 35px;

              padding-top: 12px;

              border-top:
                1px solid #ddd;

              font-size: 11px;

              color: #777;
            }

            @media print {

              body {
                padding: 15px;
              }

              .report-header {
                margin-bottom: 15px;
              }

              h2 {
                margin-top: 18px;
              }

              .summary-box {
                padding: 10px;
              }

            }

          </style>

        </head>

        <body>

          <div class="report-header">

            <h1>
              Attendance & Salary Report
            </h1>

            <p>
              ${formatMonthName(
                selectedMonth
              )}
            </p>

          </div>

          <div class="employee-info">

            <div>
              <strong>
                Employee Name:
              </strong>

              ${employeeName}
            </div>

            <div>
              <strong>
                Employee ID:
              </strong>

              ${employeeId}
            </div>

            <div>
              <strong>
                Phone:
              </strong>

              ${
                employee?.mobileNumber ||
                "N/A"
              }
            </div>

            <div>
              <strong>
                Email:
              </strong>

              ${
                employee?.email ||
                "N/A"
              }
            </div>

          </div>

          <h2>
            Attendance Summary
          </h2>

          <div class="summary">

            <div class="summary-box">

              <span>
                Working Days
              </span>

              <strong>
                ${workingDays}
              </strong>

            </div>

            <div class="summary-box">

              <span>
                Present Days
              </span>

              <strong>
                ${presentDays}
              </strong>

            </div>

            <div class="summary-box">

              <span>
                Leave Days
              </span>

              <strong>
                ${leaveDays}
              </strong>

            </div>

            <div class="summary-box">

              <span>
                Absent Days
              </span>

              <strong>
                ${absentDays}
              </strong>

            </div>

          </div>

          <h2>
            Salary Calculation
          </h2>

          <table class="salary-table">

            <tbody>

              <tr>
                <td>
                  Monthly Salary
                </td>

                <td>
                  ₹${salaryNumber.toFixed(
                    2
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Working Days
                </td>

                <td>
                  ${workingDays}
                </td>
              </tr>

              <tr>
                <td>
                  Per Day Salary
                </td>

                <td>
                  ₹${perDaySalary.toFixed(
                    2
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Present Days
                </td>

                <td>
                  ${presentDays}
                </td>
              </tr>

              <tr>
                <td>
                  Present Salary
                </td>

                <td>
                  ₹${presentSalary.toFixed(
                    2
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Leave Deduction
                </td>

                <td class="deduction">
                  - ₹${leaveDeduction.toFixed(
                    2
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Absent Deduction
                </td>

                <td class="deduction">
                  - ₹${absentDeduction.toFixed(
                    2
                  )}
                </td>
              </tr>

              <tr class="final-salary">

                <td>
                  <strong>
                    Final Salary
                  </strong>
                </td>

                <td>
                  <strong>
                    ₹${finalSalary.toFixed(
                      2
                    )}
                  </strong>
                </td>

              </tr>

            </tbody>

          </table>

          <h2>
            Attendance Details
          </h2>

          ${
            sortedAttendance.length ===
            0
              ? `
                <p>
                  No attendance records found
                  for this month.
                </p>
              `
              : `
                <table>

                  <thead>

                    <tr>

                      <th>#</th>

                      <th>
                        Date
                      </th>

                      <th>
                        Time
                      </th>

                      <th>
                        Location
                      </th>

                      <th>
                        Accuracy
                      </th>

                      <th>
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    ${attendanceRows}

                  </tbody>

                </table>
              `
          }

          <div class="footer">

            Generated on:
            ${new Date().toLocaleString(
              "en-IN"
            )}

          </div>

        </body>

      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <div
      className="salary-modal-overlay"
      onMouseDown={onClose}
    >

      <div
        className="salary-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* HEADER */}

        <div className="salary-modal-header">

          <div className="salary-modal-title">

            <div className="salary-modal-icon">
              <IndianRupee size={20} />
            </div>

            <div>

              <h2>
                Salary Calculation
              </h2>

              <p>
                {employeeName}

                <span>•</span>

                {formatMonthName(
                  selectedMonth
                )}
              </p>

            </div>

          </div>

          <button
            type="button"
            className="salary-close-button"
            onClick={onClose}
          >
            <X size={19} />
          </button>

        </div>

        {/* BODY */}

        <div className="salary-modal-body">

          {/* EMPLOYEE */}

          <div className="salary-employee-info">

            <div>

              <span>
                Employee
              </span>

              <strong>
                {employeeName}
              </strong>

            </div>

            <div>

              <span>
                Employee ID
              </span>

              <strong>
                {employeeId}
              </strong>

            </div>

          </div>

          {/* SALARY INPUT */}

          <div className="salary-input-field">

            <label>
              Monthly Salary
            </label>

            <div className="salary-input-wrapper">

              <IndianRupee size={17} />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter monthly salary"
                value={
                  monthlySalary
                }
                onChange={(event) =>
                  setMonthlySalary(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          {/* ATTENDANCE */}

          <div className="salary-section">

            <h3>
              Attendance
            </h3>

            <div className="salary-stats">

              <div className="salary-stat">

                <span>
                  Working Days
                </span>

                <strong>
                  {workingDays}
                </strong>

              </div>

              <div className="salary-stat salary-stat--present">

                <span>
                  Present
                </span>

                <strong>
                  {presentDays}
                </strong>

              </div>

              <div className="salary-stat salary-stat--leave">

                <span>
                  Leave
                </span>

                <strong>
                  {leaveDays}
                </strong>

              </div>

              <div className="salary-stat salary-stat--absent">

                <span>
                  Absent
                </span>

                <strong>
                  {absentDays}
                </strong>

              </div>

            </div>

          </div>

          {/* SALARY BREAKDOWN */}

          <div className="salary-section">

            <h3>
              Salary Breakdown
            </h3>

            <div className="salary-breakdown">

              <div>

                <span>
                  Monthly Salary
                </span>

                <strong>
                  ₹{salaryNumber.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Per Day Salary
                </span>

                <strong>
                  ₹{perDaySalary.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Present Salary
                </span>

                <strong>
                  ₹{presentSalary.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Leave Deduction
                </span>

                <strong className="deduction">
                  - ₹{leaveDeduction.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Absent Deduction
                </span>

                <strong className="deduction">
                  - ₹{absentDeduction.toFixed(
                    2
                  )}
                </strong>

              </div>

            </div>

          </div>

          {/* FINAL SALARY */}

          <div className="salary-final">

            <div>

              <span>
                Final Salary
              </span>

              <small>
                After attendance
                deductions
              </small>

            </div>

            <strong>
              ₹{finalSalary.toFixed(
                2
              )}
            </strong>

          </div>

        </div>

        {/* FOOTER */}

        <div className="salary-modal-footer">

          <button
            type="button"
            className="salary-cancel-button"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="salary-print-button"
            onClick={
              printAttendance
            }
          >

            <Printer size={17} />

            Print Attendance & Salary

          </button>

        </div>

      </div>

    </div>
  );
}

// ==================================================
// GET INITIALS
// ==================================================

function getInitials(name) {
  if (!name) {
    return "U";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .map((word) =>
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
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

// ==================================================
// TODAY DATE KEY
// ==================================================

function getTodayDateKey() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

// ==================================================
// NORMALIZE DATE KEY
// ==================================================

function normalizeDateKey(date) {
  if (!date) {
    return "";
  }

  const dateString =
    String(date).trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateString
    )
  ) {
    return dateString;
  }

  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      dateString
    )
  ) {
    const [
      day,
      month,
      year,
    ] = dateString
      .split("/")
      .map(Number);

    return `${year}-${String(
      month
    ).padStart(
      2,
      "0"
    )}-${String(
      day
    ).padStart(
      2,
      "0"
    )}`;
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "";
  }

  return `${parsed.getFullYear()}-${String(
    parsed.getMonth() + 1
  ).padStart(
    2,
    "0"
  )}-${String(
    parsed.getDate()
  ).padStart(
    2,
    "0"
  )}`;
}

// ==================================================
// NORMALIZE LEAVE TYPE
// ==================================================

function normalizeLeaveType(
  leaveType
) {
  if (!leaveType) {
    return "full";
  }

  const value =
    String(
      leaveType
    ).toLowerCase();

  if (
    value.includes("half")
  ) {
    return "half";
  }

  return "full";
}

// ==================================================
// GET DATES BETWEEN
// ==================================================

function getDatesBetween(
  startDate,
  endDate
) {
  const dates = [];

  const startParts =
    startDate
      .split("-")
      .map(Number);

  const endParts =
    endDate
      .split("-")
      .map(Number);

  const current =
    new Date(
      startParts[0],
      startParts[1] - 1,
      startParts[2]
    );

  const end =
    new Date(
      endParts[0],
      endParts[1] - 1,
      endParts[2]
    );

  while (
    current <= end
  ) {
    dates.push(
      `${current.getFullYear()}-${String(
        current.getMonth() + 1
      ).padStart(
        2,
        "0"
      )}-${String(
        current.getDate()
      ).padStart(
        2,
        "0"
      )}`
    );

    current.setDate(
      current.getDate() + 1
    );
  }

  return dates;
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

  const date = new Date(
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
// GENERATE CALENDAR DAYS
// ==================================================

function generateCalendarDays(
  monthValue
) {
  if (!monthValue) {
    return [];
  }

  const [
    year,
    month,
  ] = monthValue
    .split("-")
    .map(Number);

  const firstDay =
    new Date(
      year,
      month - 1,
      1
    ).getDay();

  const totalDays =
    new Date(
      year,
      month,
      0
    ).getDate();

  const days = [];

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    days.push(null);
  }

  for (
    let day = 1;
    day <= totalDays;
    day++
  ) {
    days.push({
      day,

      date: `${year}-${String(
        month
      ).padStart(
        2,
        "0"
      )}-${String(
        day
      ).padStart(
        2,
        "0"
      )}`,
    });
  }

  return days;
}

// ==================================================
// RECORD DATE
// ==================================================

function getRecordDate(record) {
  if (record?.date) {
    const dateString =
      String(
        record.date
      ).trim();

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        dateString
      )
    ) {
      const [
        year,
        month,
        day,
      ] = dateString
        .split("-")
        .map(Number);

      return new Date(
        year,
        month - 1,
        day
      );
    }

    if (
      /^\d{2}\/\d{2}\/\d{4}$/.test(
        dateString
      )
    ) {
      const [
        day,
        month,
        year,
      ] = dateString
        .split("/")
        .map(Number);

      return new Date(
        year,
        month - 1,
        day
      );
    }
  }

  if (record?.timestamp) {
    const date =
      new Date(
        record.timestamp
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date;
    }
  }

  return null;
}

// ==================================================
// RECORD TIMESTAMP
// ==================================================

function getRecordTimestamp(
  record
) {
  if (record?.timestamp) {
    const timestamp =
      new Date(
        record.timestamp
      ).getTime();

    if (
      !Number.isNaN(
        timestamp
      )
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
  const date =
    getRecordDate(record);

  if (!date) {
    return "";
  }

  return [
    date.getFullYear(),

    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    ),

    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    ),
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
  ).padStart(
    2,
    "0"
  )}`;
}

// ==================================================
// RECORD TIME
// ==================================================

function getRecordTime(record) {
  if (!record?.timestamp) {
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

  if (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      date
    )
  ) {
    const [
      year,
      month,
      day,
    ] = date
      .split("-")
      .map(Number);

    const parsed =
      new Date(
        year,
        month - 1,
        day
      );

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  if (
    typeof date === "string" &&
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      date
    )
  ) {
    const [
      day,
      month,
      year,
    ] = date
      .split("/")
      .map(Number);

    const parsed =
      new Date(
        year,
        month - 1,
        day
      );

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
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
    String(date).trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateString
    )
  ) {
    return dateString;
  }

  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      dateString
    )
  ) {
    const [
      day,
      month,
      year,
    ] = dateString
      .split("/")
      .map(Number);

    return `${year}-${String(
      month
    ).padStart(
      2,
      "0"
    )}-${String(
      day
    ).padStart(
      2,
      "0"
    )}`;
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
    ).padStart(
      2,
      "0"
    ),

    String(
      parsedDate.getDate()
    ).padStart(
      2,
      "0"
    ),
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
  ] = monthValue
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
// EXPORT
// ==================================================

export default Profile;