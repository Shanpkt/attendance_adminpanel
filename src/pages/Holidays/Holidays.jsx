import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  HOLIDAYS_API,
  holidayByIdApi,
} from "../../api";

import "./Holidays.scss";

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const getMonthKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
};

const getTodayKey = () => {
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

const formatMonthName = (monthKey) => {
  const [year, month] = monthKey
    .split("-")
    .map(Number);

  const date = new Date(year, month - 1, 1);

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const formatDisplayDate = (dateKey) => {
  if (!dateKey) {
    return "—";
  }

  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    weekday: "short",
  });
};

const generateCalendarDays = (monthKey) => {
  const [year, month] = monthKey
    .split("-")
    .map(Number);

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(
    year,
    month,
    0
  ).getDate();
  const startWeekday = firstDay.getDay();

  const days = [];

  for (let i = 0; i < startWeekday; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    days.push({
      day,
      date,
    });
  }

  return days;
};

function Holidays() {
  const [calendarMonth, setCalendarMonth] =
    useState(getMonthKey());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] =
    useState("");
  const [holidayName, setHolidayName] =
    useState("Holiday");
  const [holidayNote, setHolidayNote] =
    useState("");
  const [message, setMessage] = useState("");

  const todayKey = getTodayKey();

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        HOLIDAYS_API,
        {
          params: {
            month: calendarMonth,
          },
        }
      );

      setHolidays(response.data?.data || []);
    } catch (err) {
      console.error("Fetch holidays error:", err);
      setError("Unable to fetch holidays.");
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [calendarMonth]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const holidayByDate = useMemo(() => {
    const map = new Map();

    holidays.forEach((holiday) => {
      map.set(holiday.date, holiday);
    });

    return map;
  }, [holidays]);

  const calendarDays = useMemo(
    () => generateCalendarDays(calendarMonth),
    [calendarMonth]
  );

  const selectedHoliday = selectedDate
    ? holidayByDate.get(selectedDate)
    : null;

  const goPreviousMonth = () => {
    const [year, month] = calendarMonth
      .split("-")
      .map(Number);

    const date = new Date(year, month - 2, 1);

    setCalendarMonth(
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`
    );
    setSelectedDate("");
    setMessage("");
  };

  const goNextMonth = () => {
    const [year, month] = calendarMonth
      .split("-")
      .map(Number);

    const date = new Date(year, month, 1);

    setCalendarMonth(
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`
    );
    setSelectedDate("");
    setMessage("");
  };

  const handleDayClick = (date) => {
    const existing = holidayByDate.get(date);

    setSelectedDate(date);
    setHolidayName(existing?.name || "Holiday");
    setHolidayNote(existing?.note || "");
    setMessage("");
    setError("");
  };

  const handleSaveHoliday = async () => {
    if (!selectedDate) {
      setError("Please select a date on the calendar.");
      return;
    }

    const name = holidayName.trim();

    if (!name) {
      setError("Holiday name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (selectedHoliday) {
        await axios.put(
          holidayByIdApi(selectedHoliday._id),
          {
            name,
            note: holidayNote.trim(),
          }
        );

        setMessage("Holiday updated.");
      } else {
        await axios.post(HOLIDAYS_API, {
          date: selectedDate,
          name,
          note: holidayNote.trim(),
        });

        setMessage("Holiday marked on calendar.");
      }

      await fetchHolidays();
    } catch (err) {
      console.error("Save holiday error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to save holiday."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveHoliday = async () => {
    if (!selectedHoliday) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await axios.delete(
        holidayByIdApi(selectedHoliday._id)
      );

      setMessage("Holiday removed.");
      setHolidayName("Holiday");
      setHolidayNote("");
      await fetchHolidays();
    } catch (err) {
      console.error("Remove holiday error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to remove holiday."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="holidays-page">
      <div className="holidays-page__header">
        <div>
          <h1>Holidays</h1>
          <p>
            Mark office holidays on the calendar.
            Those dates are not counted as absent.
          </p>
        </div>
      </div>

      {(error || message) && (
        <p
          className={`holidays-page__banner${
            error
              ? " holidays-page__banner--error"
              : " holidays-page__banner--success"
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="holidays-layout">
        <section className="holidays-calendar-card">
          <div className="holidays-calendar-card__nav">
            <button
              type="button"
              onClick={goPreviousMonth}
              disabled={loading || saving}
            >
              ‹
            </button>

            <strong>
              {formatMonthName(calendarMonth)}
            </strong>

            <button
              type="button"
              onClick={goNextMonth}
              disabled={loading || saving}
            >
              ›
            </button>
          </div>

          <div className="holidays-weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="holidays-grid">
            {calendarDays.map((day, index) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="holidays-empty"
                  />
                );
              }

              const holiday = holidayByDate.get(
                day.date
              );
              const isToday =
                day.date === todayKey;
              const isSelected =
                day.date === selectedDate;

              return (
                <button
                  type="button"
                  key={day.date}
                  className={[
                    "holidays-day",
                    isToday
                      ? "holidays-day--today"
                      : "",
                    holiday
                      ? "holidays-day--holiday"
                      : "",
                    isSelected
                      ? "holidays-day--selected"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() =>
                    handleDayClick(day.date)
                  }
                  disabled={saving}
                  title={holiday?.name || ""}
                >
                  <span>{day.day}</span>
                  {holiday && <i />}
                </button>
              );
            })}
          </div>

          <div className="holidays-legend">
            <div>
              <span className="holidays-legend__dot" />
              Holiday
            </div>
            <div>
              <span className="holidays-legend__today" />
              Today
            </div>
          </div>

          {loading && (
            <p className="holidays-loading">
              Loading holidays...
            </p>
          )}
        </section>

        <section className="holidays-side">
          <div className="holidays-form-card">
            <h2>
              {selectedHoliday
                ? "Edit Holiday"
                : "Mark Holiday"}
            </h2>

            <p className="holidays-form-card__date">
              {selectedDate
                ? formatDisplayDate(selectedDate)
                : "Select a date on the calendar"}
            </p>

            <label htmlFor="holiday-name">
              Holiday name
            </label>
            <input
              id="holiday-name"
              type="text"
              value={holidayName}
              disabled={!selectedDate || saving}
              onChange={(event) =>
                setHolidayName(event.target.value)
              }
              placeholder="e.g. Diwali, Republic Day"
            />

            <label htmlFor="holiday-note">
              Note (optional)
            </label>
            <textarea
              id="holiday-note"
              rows={3}
              value={holidayNote}
              disabled={!selectedDate || saving}
              onChange={(event) =>
                setHolidayNote(event.target.value)
              }
              placeholder="Optional note for this holiday"
            />

            <div className="holidays-form-card__actions">
              <button
                type="button"
                className="holidays-btn holidays-btn--primary"
                onClick={handleSaveHoliday}
                disabled={!selectedDate || saving}
              >
                {saving
                  ? "Saving..."
                  : selectedHoliday
                    ? "Update Holiday"
                    : "Mark Holiday"}
              </button>

              {selectedHoliday && (
                <button
                  type="button"
                  className="holidays-btn holidays-btn--danger"
                  onClick={handleRemoveHoliday}
                  disabled={saving}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="holidays-list-card">
            <div className="holidays-list-card__header">
              <h2>This Month</h2>
              <span>{holidays.length}</span>
            </div>

            {holidays.length === 0 ? (
              <p className="holidays-list-card__empty">
                No holidays marked in{" "}
                {formatMonthName(calendarMonth)}.
              </p>
            ) : (
              <ul className="holidays-list">
                {holidays.map((holiday) => (
                  <li key={holiday._id}>
                    <button
                      type="button"
                      onClick={() =>
                        handleDayClick(
                          holiday.date
                        )
                      }
                    >
                      <strong>
                        {holiday.name}
                      </strong>
                      <span>
                        {formatDisplayDate(
                          holiday.date
                        )}
                      </span>
                      {holiday.note && (
                        <small>
                          {holiday.note}
                        </small>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Holidays;
