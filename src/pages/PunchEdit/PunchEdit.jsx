import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";

import {
  ATTENDANCE_API,
  EMPLOYEES_API,
  employeeByIdApi,
} from "../../api";
import useAttendanceSettings from "../../hooks/useAttendanceSettings";
import {
  evaluateAttendanceRecord,
  formatTimeLabel,
  getCompanyLimitsForDate,
  isSundayDate,
  timeToMinutes,
} from "../../utils/attendanceSettings";

import "./PunchEdit.scss";

const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const toTimeInput = (timestamp) => {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(
    2,
    "0"
  );

  return `${hours}:${minutes}`;
};

const toLocalIso = (dateKey, time) => {
  if (!dateKey || !time) {
    return null;
  }

  const [year, month, day] = dateKey
    .split("-")
    .map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  const date = new Date(
    year,
    month - 1,
    day,
    hours || 0,
    minutes || 0,
    0,
    0
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const toDateKey = (value) => {
  const raw = String(value || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parts = raw.split("/");

  if (parts.length !== 3) {
    return "";
  }

  const [day, month, year] = parts;

  if (
    year.length !== 4 ||
    !Number(day) ||
    !Number(month)
  ) {
    return "";
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;
};

const toAppDate = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);

  return `${day}/${month}/${year}`;
};

const formatDisplayDate = (dateKey) => {
  const normalized = toDateKey(dateKey);

  if (!normalized) {
    return dateKey || "—";
  }

  const [year, month, day] = normalized
    .split("-")
    .map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatClock = (timestamp) => {
  const value = toTimeInput(timestamp);

  if (!value) {
    return "—";
  }

  return formatTimeLabel(value);
};

const getEmployeeName = (employee) => {
  return (
    employee?.name ||
    employee?.employeeName ||
    "Employee"
  );
};

const getEmployeeMobile = (employee) => {
  return String(
    employee?.mobileNumber || employee?.mobile || ""
  ).trim();
};

function PunchEdit() {
  const {
    lateComingTime: companyLateTime,
    halfDayTime: companyHalfDayTime,
    sundayLateComingTime,
    sundayHalfDayTime,
  } = useAttendanceSettings();

  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    getDateString(new Date())
  );

  const companyLimitsForDay = getCompanyLimitsForDate(
    {
      lateComingTime: companyLateTime,
      halfDayTime: companyHalfDayTime,
      sundayLateComingTime,
      sundayHalfDayTime,
    },
    selectedDate
  );

  const [punchIn, setPunchIn] = useState("");
  const [punchOut, setPunchOut] = useState("");
  const [lateLimit, setLateLimit] = useState("");
  const [employeeLateLimit, setEmployeeLateLimit] =
    useState("");

  const [loadingEmployees, setLoadingEmployees] =
    useState(true);
  const [loadingRecords, setLoadingRecords] =
    useState(false);
  const [savingPunch, setSavingPunch] = useState(false);
  const [savingLimit, setSavingLimit] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        setError("");

        const response = await axios.get(EMPLOYEES_API);
        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setEmployees(data);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Unable to fetch employees.");
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const selectedEmployee = useMemo(() => {
    return (
      employees.find(
        (employee) => employee._id === selectedId
      ) || null
    );
  }, [employees, selectedId]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return employees;
    }

    return employees.filter((employee) => {
      const name = getEmployeeName(employee).toLowerCase();
      const mobile = getEmployeeMobile(employee);

      return (
        name.includes(query) || mobile.includes(query)
      );
    });
  }, [employees, search]);

  useEffect(() => {
    const mobile = getEmployeeMobile(selectedEmployee);

    if (!mobile) {
      setRecords([]);
      setEmployeeLateLimit("");
      return;
    }

    setEmployeeLateLimit(
      selectedEmployee.lateComingTime || ""
    );
    setRecords([]);

    const fetchRecords = async () => {
      try {
        setLoadingRecords(true);
        setError("");

        const response = await axios.get(
          `${ATTENDANCE_API}/employee/${mobile}`
        );

        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setRecords(data);
      } catch (fetchError) {
        console.error(fetchError);
        setRecords([]);
        setError("Unable to fetch punch records.");
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchRecords();
  }, [selectedEmployee]);

  const selectedRecord = useMemo(() => {
    return (
      records.find(
        (record) => toDateKey(record.date) === selectedDate
      ) || null
    );
  }, [records, selectedDate]);

  const dayHalfTime =
    selectedEmployee?.halfDayTime ||
    (isSundayDate(selectedDate)
      ? companyLimitsForDay.halfDayTime
      : selectedRecord?.limits?.halfDayTime ||
        companyLimitsForDay.halfDayTime);

  useEffect(() => {
    if (!selectedEmployee) {
      setPunchIn("");
      setPunchOut("");
      setLateLimit("");
      return;
    }

    setPunchIn(
      toTimeInput(selectedRecord?.punchIn?.timestamp)
    );
    setPunchOut(
      toTimeInput(selectedRecord?.punchOut?.timestamp)
    );
    setLateLimit(
      selectedEmployee.lateComingTime ||
        (isSundayDate(selectedDate)
          ? companyLimitsForDay.lateComingTime
          : selectedRecord?.limits?.lateComingTime ||
            companyLimitsForDay.lateComingTime) ||
        "10:00"
    );
  }, [
    selectedEmployee,
    selectedRecord,
    selectedDate,
    companyLimitsForDay.lateComingTime,
  ]);

  const preview = useMemo(() => {
    if (!punchIn || !lateLimit) {
      return null;
    }

    return evaluateAttendanceRecord(
      {
        date: selectedDate,
        punchIn: {
          timestamp: toLocalIso(selectedDate, punchIn),
        },
        punchOut: {
          timestamp: punchOut
            ? toLocalIso(selectedDate, punchOut)
            : null,
        },
        limits: {
          lateComingTime: lateLimit,
          halfDayTime: dayHalfTime,
        },
      },
      {
        lateComingTime: companyLateTime,
        halfDayTime: companyHalfDayTime,
        sundayLateComingTime,
        sundayHalfDayTime,
      },
      selectedEmployee,
      {
        respectSavedLimits: true,
      }
    );
  }, [
    punchIn,
    punchOut,
    lateLimit,
    dayHalfTime,
    selectedDate,
    companyLateTime,
    companyHalfDayTime,
    sundayLateComingTime,
    sundayHalfDayTime,
    selectedEmployee,
  ]);

  const punchOrderInvalid =
    Boolean(punchIn) &&
    Boolean(punchOut) &&
    timeToMinutes(punchOut) <= timeToMinutes(punchIn);

  const lateOrderInvalid =
    Boolean(lateLimit) &&
    Boolean(dayHalfTime) &&
    timeToMinutes(dayHalfTime) <=
      timeToMinutes(lateLimit);

  const employeeLateOrderInvalid =
    Boolean(employeeLateLimit) &&
    Boolean(
      selectedEmployee?.halfDayTime || companyHalfDayTime
    ) &&
    timeToMinutes(
      selectedEmployee?.halfDayTime || companyHalfDayTime
    ) <= timeToMinutes(employeeLateLimit);

  const applyRecord = (record) => {
    if (!record?.date) {
      return;
    }

    setSelectedDate(toDateKey(record.date));
    setMessage("");
    setError("");
  };

  const savePunch = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const mobile = getEmployeeMobile(selectedEmployee);

    if (!mobile) {
      setError("Select an employee first.");
      return;
    }

    if (!punchIn) {
      setError("Punch in time is required.");
      return;
    }

    if (punchOrderInvalid) {
      setError("Punch out must be later than punch in.");
      return;
    }

    if (!lateLimit || lateOrderInvalid) {
      setError(
        "Late time limit must be earlier than the half day time."
      );
      return;
    }

    try {
      setSavingPunch(true);

      const response = await axios.put(
        `${ATTENDANCE_API}/correct`,
        {
          mobileNumber: mobile,
          date: selectedRecord
            ? selectedRecord.date
            : toAppDate(selectedDate),
          punchInTime: toLocalIso(selectedDate, punchIn),
          punchOutTime: punchOut
            ? toLocalIso(selectedDate, punchOut)
            : null,
          lateComingTime: lateLimit,
        }
      );

      const saved = response.data?.data;

      setRecords((current) => {
        const next = current.filter(
          (record) =>
            toDateKey(record.date) !== selectedDate
        );

        return [saved, ...next].sort((left, right) => {
          return String(right.date).localeCompare(
            String(left.date)
          );
        });
      });

      setMessage(
        selectedRecord
          ? "Punch in, punch out, and late time limit updated."
          : "Punch record created for this date."
      );
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError.response?.data?.message ||
          "Unable to update punch data. Restart the backend if this page was just added."
      );
    } finally {
      setSavingPunch(false);
    }
  };

  const saveEmployeeLateLimit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!selectedEmployee?._id) {
      setError("Select an employee first.");
      return;
    }

    if (employeeLateOrderInvalid) {
      setError(
        "Employee late time must be earlier than the half day time."
      );
      return;
    }

    try {
      setSavingLimit(true);

      const response = await axios.put(
        employeeByIdApi(selectedEmployee._id),
        {
          lateComingTime: employeeLateLimit.trim(),
        }
      );

      const saved = response.data?.data;

      setEmployees((current) =>
        current.map((employee) =>
          employee._id === saved._id ? saved : employee
        )
      );

      setMessage(
        employeeLateLimit.trim()
          ? "Employee late time limit updated."
          : "Employee late time limit cleared. Company time will be used."
      );
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError.response?.data?.message ||
          "Unable to update the late time limit."
      );
    } finally {
      setSavingLimit(false);
    }
  };

  const statusLabel = preview?.isHalfDay
    ? "Half day"
    : preview?.isLate
      ? "Late"
      : preview
        ? "On time"
        : "—";

  return (
    <div className="punch-edit">
      <header className="punch-edit__header">
        <div>
          <h1>Punch Edit</h1>
          <p>
            Change an employee’s punch in, punch out, and
            late time limit for a selected day.
          </p>
        </div>
      </header>

      {error ? (
        <p className="punch-edit__banner punch-edit__banner--error">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="punch-edit__banner punch-edit__banner--success">
          {message}
        </p>
      ) : null}

      <div className="punch-edit__layout">
        <section className="punch-edit__card">
          <h2>Employee</h2>

          <label htmlFor="employee-search">Search</label>
          <input
            id="employee-search"
            type="search"
            placeholder="Name or mobile"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <label htmlFor="employee-select">Employee</label>
          <select
            id="employee-select"
            value={selectedId}
            onChange={(event) => {
              setSelectedId(event.target.value);
              setMessage("");
              setError("");
            }}
          >
            <option value="">
              {loadingEmployees
                ? "Loading employees..."
                : "Select employee"}
            </option>
            {filteredEmployees.map((employee) => (
              <option
                key={employee._id}
                value={employee._id}
              >
                {getEmployeeName(employee)} ·{" "}
                {getEmployeeMobile(employee)}
              </option>
            ))}
          </select>

          <div className="punch-edit__records">
            <div className="punch-edit__records-head">
              <h3>Recent punches</h3>
              {loadingRecords ? <span>Loading...</span> : null}
            </div>

            {!selectedEmployee ? (
              <p className="punch-edit__empty">
                Select an employee to see punch records.
              </p>
            ) : records.length === 0 ? (
              <p className="punch-edit__empty">
                No punch records for this employee.
              </p>
            ) : (
              <ul>
                {records.slice(0, 12).map((record) => (
                  <li key={record._id || record.date}>
                    <button
                      type="button"
                      className={
                        record.date === selectedDate
                          ? "is-active"
                          : ""
                      }
                      onClick={() => applyRecord(record)}
                    >
                      <strong>
                        {formatDisplayDate(record.date)}
                      </strong>
                      <span>
                        In {formatClock(record.punchIn?.timestamp)}
                        {" · "}
                        Out{" "}
                        {formatClock(record.punchOut?.timestamp)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="punch-edit__forms">
          <form
            className="punch-edit__card"
            onSubmit={savePunch}
          >
            <h2>Day punch data</h2>
            <p>
              Times are saved in this computer’s local time.
              Location and selfie on an existing punch stay
              as they are.
            </p>

            <div className="punch-edit__fields">
              <div>
                <label htmlFor="punch-date">Date</label>
                <input
                  id="punch-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setMessage("");
                  }}
                  required
                />
              </div>

              <div>
                <label htmlFor="punch-in">
                  <AccessTimeIcon /> Punch in
                </label>
                <input
                  id="punch-in"
                  type="time"
                  value={punchIn}
                  onChange={(event) =>
                    setPunchIn(event.target.value)
                  }
                  required
                />
              </div>

              <div>
                <label htmlFor="punch-out">
                  <LogoutIcon /> Punch out
                </label>
                <input
                  id="punch-out"
                  type="time"
                  value={punchOut}
                  onChange={(event) =>
                    setPunchOut(event.target.value)
                  }
                />
              </div>

              <div>
                <label htmlFor="late-limit">
                  Late time limit
                </label>
                <input
                  id="late-limit"
                  type="time"
                  value={lateLimit}
                  onChange={(event) =>
                    setLateLimit(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            <p className="punch-edit__hint">
              Half day time for this day:{" "}
              {formatTimeLabel(dayHalfTime)}. Leave punch
              out empty if the employee has not punched out.
              {selectedRecord
                ? " This day already has a punch record."
                : " Saving will create a punch record for this date."}
            </p>

            {punchOrderInvalid ? (
              <p className="punch-edit__warning">
                Punch out must be later than punch in.
              </p>
            ) : null}

            {lateOrderInvalid ? (
              <p className="punch-edit__warning">
                Late time limit must be earlier than the
                half day time.
              </p>
            ) : null}

            <div className="punch-edit__status">
              <span>Result with these times</span>
              <strong
                className={`punch-edit__badge punch-edit__badge--${
                  preview?.isHalfDay
                    ? "half"
                    : preview?.isLate
                      ? "late"
                      : "ok"
                }`}
              >
                {statusLabel}
              </strong>
            </div>

            <div className="punch-edit__actions">
              <button
                type="button"
                className="punch-edit__secondary"
                onClick={() => setPunchOut("")}
                disabled={!punchOut || savingPunch}
              >
                Clear punch out
              </button>
              <button
                type="submit"
                className="punch-edit__primary"
                disabled={
                  savingPunch ||
                  !selectedEmployee ||
                  punchOrderInvalid ||
                  lateOrderInvalid
                }
              >
                {savingPunch ? "Saving..." : "Save punch data"}
              </button>
            </div>
          </form>

          <form
            className="punch-edit__card"
            onSubmit={saveEmployeeLateLimit}
          >
            <h2>
              <PersonIcon /> Employee late time limit
            </h2>
            <p>
              This is the employee’s own late limit for
              future punches. Leave it empty to use the
              company limit ({formatTimeLabel(companyLateTime)}).
            </p>

            <label htmlFor="employee-late">
              Late time limit
            </label>
            <input
              id="employee-late"
              type="time"
              value={employeeLateLimit}
              onChange={(event) =>
                setEmployeeLateLimit(event.target.value)
              }
              disabled={!selectedEmployee}
            />

            {employeeLateOrderInvalid ? (
              <p className="punch-edit__warning">
                Employee late time must be earlier than the
                half day time.
              </p>
            ) : null}

            <div className="punch-edit__actions">
              <button
                type="button"
                className="punch-edit__secondary"
                onClick={() => setEmployeeLateLimit("")}
                disabled={
                  !selectedEmployee ||
                  !employeeLateLimit ||
                  savingLimit
                }
              >
                Use company time
              </button>
              <button
                type="submit"
                className="punch-edit__primary"
                disabled={
                  !selectedEmployee ||
                  savingLimit ||
                  employeeLateOrderInvalid
                }
              >
                {savingLimit
                  ? "Saving..."
                  : "Save late time limit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PunchEdit;
