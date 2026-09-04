import React, {
  useEffect,
  useState,
} from "react";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ContrastIcon from "@mui/icons-material/Contrast";

import useAttendanceSettings from "../../hooks/useAttendanceSettings";
import {
  DEFAULT_ATTENDANCE_SETTINGS,
  formatTimeLabel,
  timeToMinutes,
} from "../../utils/attendanceSettings";

import "./Settings.scss";

function Settings() {
  const {
    lateComingTime,
    halfDayTime,
    saveSettings,
  } = useAttendanceSettings();

  const [lateTime, setLateTime] =
    useState(lateComingTime);

  const [halfTime, setHalfTime] =
    useState(halfDayTime);

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    setLateTime(lateComingTime);
    setHalfTime(halfDayTime);
  }, [
    lateComingTime,
    halfDayTime,
  ]);

  const hasInvalidOrder =
    timeToMinutes(halfTime) <=
    timeToMinutes(lateTime);

  const handleSave = () => {
    saveSettings({
      lateComingTime: lateTime,
      halfDayTime: halfTime,
    });

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const handleReset = () => {
    setLateTime(
      DEFAULT_ATTENDANCE_SETTINGS.lateComingTime
    );

    setHalfTime(
      DEFAULT_ATTENDANCE_SETTINGS.halfDayTime
    );

    setSaved(false);
  };

  return (
    <div className="settings-page">

      <div className="settings-page__header">

        <div>

          <h1>
            Settings
          </h1>

          <p>
            Set late coming and half day
            punch-in limits. These apply
            on Dashboard and Attendance.
          </p>

        </div>

      </div>

      <section className="settings-grid">

        <div className="settings-card settings-card--late">

          <div className="settings-card__icon">
            <AccessTimeIcon />
          </div>

          <div className="settings-card__body">

            <h2>
              Late Coming Time
            </h2>

            <p>
              Punch in after this time is
              marked as late.
            </p>

            <label htmlFor="late-coming-time">
              Cut-off time
            </label>

            <input
              id="late-coming-time"
              type="time"
              value={lateTime}
              onChange={(event) => {
                setLateTime(
                  event.target.value
                );
                setSaved(false);
              }}
            />

            <span className="settings-card__hint">
              Current limit:{" "}
              {formatTimeLabel(lateTime)}
            </span>

          </div>

        </div>

        <div className="settings-card settings-card--halfday">

          <div className="settings-card__icon">
            <ContrastIcon />
          </div>

          <div className="settings-card__body">

            <h2>
              Half Day Time
            </h2>

            <p>
              Punch in after this time is
              marked as half day.
            </p>

            <label htmlFor="half-day-time">
              Cut-off time
            </label>

            <input
              id="half-day-time"
              type="time"
              value={halfTime}
              onChange={(event) => {
                setHalfTime(
                  event.target.value
                );
                setSaved(false);
              }}
            />

            <span className="settings-card__hint">
              Current limit:{" "}
              {formatTimeLabel(halfTime)}
            </span>

          </div>

        </div>

      </section>

      {hasInvalidOrder && (

        <p className="settings-warning">
          Half day time should usually be
          later than late coming time.
        </p>

      )}

      <div className="settings-actions">

        <button
          type="button"
          className="settings-reset"
          onClick={handleReset}
        >
          Reset
        </button>

        <button
          type="button"
          className="settings-save"
          onClick={handleSave}
        >
          Save Limits
        </button>

        {saved && (
          <span className="settings-saved">
            Saved. Dashboard and Attendance
            will use these times.
          </span>
        )}

      </div>

    </div>
  );
}

export default Settings;
