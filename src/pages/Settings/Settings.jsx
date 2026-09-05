import React, {
  useEffect,
  useState,
} from "react";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ContrastIcon from "@mui/icons-material/Contrast";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PlaceIcon from "@mui/icons-material/Place";

import useAttendanceSettings from "../../hooks/useAttendanceSettings";
import {
  DEFAULT_ATTENDANCE_SETTINGS,
  formatTimeLabel,
  isValidGpsSettings,
  timeToMinutes,
} from "../../utils/attendanceSettings";

import "./Settings.scss";

function Settings() {
  const {
    lateComingTime,
    halfDayTime,
    latitude,
    longitude,
    accuracy,
    gpsTolerance,
    loading,
    saving,
    error,
    saveSettings,
  } = useAttendanceSettings();

  const [lateTime, setLateTime] =
    useState(lateComingTime);

  const [halfTime, setHalfTime] =
    useState(halfDayTime);

  const [gpsLatitude, setGpsLatitude] =
    useState(latitude);

  const [gpsLongitude, setGpsLongitude] =
    useState(longitude);

  const [gpsAccuracy, setGpsAccuracy] =
    useState(accuracy);

  const [keepGpsTolerance, setKeepGpsTolerance] =
    useState(gpsTolerance);

  const [locating, setLocating] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  useEffect(() => {
    setLateTime(lateComingTime);
    setHalfTime(halfDayTime);
    setGpsLatitude(latitude);
    setGpsLongitude(longitude);
    setGpsAccuracy(accuracy);
    setKeepGpsTolerance(gpsTolerance);
  }, [
    lateComingTime,
    halfDayTime,
    latitude,
    longitude,
    accuracy,
    gpsTolerance,
  ]);

  const hasInvalidOrder =
    timeToMinutes(halfTime) <=
    timeToMinutes(lateTime);

  const hasInvalidGps = !isValidGpsSettings({
    latitude: gpsLatitude,
    longitude: gpsLongitude,
    accuracy: gpsAccuracy,
  });

  const updateGpsField = (setter) => {
    return (event) => {
      setter(event.target.value);
      setSaved(false);
      setFormError("");
    };
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormError(
        "This browser cannot read GPS location."
      );
      return;
    }

    setLocating(true);
    setFormError("");
    setSaved(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLatitude(
          String(position.coords.latitude)
        );
        setGpsLongitude(
          String(position.coords.longitude)
        );
        setGpsAccuracy(
          position.coords.accuracy != null
            ? String(
                Math.round(
                  position.coords.accuracy * 100
                ) / 100
              )
            : ""
        );
        setLocating(false);
      },
      () => {
        setLocating(false);
        setFormError(
          "Unable to read current GPS location."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleSave = async () => {
    setSaved(false);
    setFormError("");

    if (hasInvalidGps) {
      setFormError(
        "Enter a valid latitude, longitude, and accuracy, or leave all GPS fields empty."
      );
      return;
    }

    try {
      await saveSettings({
        lateComingTime: lateTime,
        halfDayTime: halfTime,
        latitude: gpsLatitude,
        longitude: gpsLongitude,
        accuracy: gpsAccuracy,
        gpsTolerance: keepGpsTolerance,
      });

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (saveError) {
      setFormError(
        saveError.response?.data
          ?.message ||
          "Unable to save settings."
      );
    }
  };

  const handleReset = () => {
    setLateTime(
      DEFAULT_ATTENDANCE_SETTINGS.lateComingTime
    );

    setHalfTime(
      DEFAULT_ATTENDANCE_SETTINGS.halfDayTime
    );

    setGpsLatitude(
      DEFAULT_ATTENDANCE_SETTINGS.latitude
    );

    setGpsLongitude(
      DEFAULT_ATTENDANCE_SETTINGS.longitude
    );

    setGpsAccuracy(
      DEFAULT_ATTENDANCE_SETTINGS.accuracy
    );

    setKeepGpsTolerance(
      DEFAULT_ATTENDANCE_SETTINGS.gpsTolerance
    );

    setSaved(false);
    setFormError("");
  };

  return (
    <div className="settings-page">

      <div className="settings-page__header">

        <div>

          <h1>
            Settings
          </h1>

          <p>
            Set late coming, half day, and
            GPS location. These save to the
            settings module in the backend.
          </p>

        </div>

      </div>

      {loading && (
        <p className="settings-status">
          Loading saved settings...
        </p>
      )}

      {(formError || error) && (
        <p className="settings-warning">
          {formError || error}
        </p>
      )}

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
              disabled={loading || saving}
              onChange={(event) => {
                setLateTime(
                  event.target.value
                );
                setSaved(false);
                setFormError("");
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
              disabled={loading || saving}
              onChange={(event) => {
                setHalfTime(
                  event.target.value
                );
                setSaved(false);
                setFormError("");
              }}
            />

            <span className="settings-card__hint">
              Current limit:{" "}
              {formatTimeLabel(halfTime)}
            </span>

          </div>

        </div>

        <div className="settings-card settings-card--gps">

          <div className="settings-card__icon">
            <PlaceIcon />
          </div>

          <div className="settings-card__body">

            <h2>
              GPS Location Spot
            </h2>

            <p>
              Office latitude, longitude,
              and allowed GPS accuracy in
              meters.
            </p>

            <div className="settings-gps-fields">

              <div>
                <label htmlFor="gps-latitude">
                  Latitude
                </label>
                <input
                  id="gps-latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  placeholder="e.g. 28.6139"
                  value={gpsLatitude}
                  disabled={
                    loading || saving || locating
                  }
                  onChange={updateGpsField(
                    setGpsLatitude
                  )}
                />
              </div>

              <div>
                <label htmlFor="gps-longitude">
                  Longitude
                </label>
                <input
                  id="gps-longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  placeholder="e.g. 77.2090"
                  value={gpsLongitude}
                  disabled={
                    loading || saving || locating
                  }
                  onChange={updateGpsField(
                    setGpsLongitude
                  )}
                />
              </div>

              <div>
                <label htmlFor="gps-accuracy">
                  Accuracy (m)
                </label>
                <input
                  id="gps-accuracy"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 50"
                  value={gpsAccuracy}
                  disabled={
                    loading || saving || locating
                  }
                  onChange={updateGpsField(
                    setGpsAccuracy
                  )}
                />
              </div>

            </div>

            <button
              type="button"
              className="settings-gps-button"
              onClick={handleUseCurrentLocation}
              disabled={
                loading || saving || locating
              }
            >
              <MyLocationIcon />
              {locating
                ? "Reading GPS..."
                : "Use current location"}
            </button>

            <div className="settings-gps-tolerance">
              <div>
                <label htmlFor="gps-tolerance">
                  GPS Tolerance
                </label>
                <p>
                  On keeps GPS accuracy
                  checks. Off tells the punch
                  app to ignore GPS
                  tolerance.
                </p>
              </div>

              <label
                className="settings-switch"
                htmlFor="gps-tolerance"
              >
                <input
                  id="gps-tolerance"
                  type="checkbox"
                  role="switch"
                  checked={keepGpsTolerance}
                  disabled={loading || saving}
                  onChange={(event) => {
                    setKeepGpsTolerance(
                      event.target.checked
                    );
                    setSaved(false);
                    setFormError("");
                  }}
                />
                <span className="settings-switch__slider" />
                <span className="settings-switch__label">
                  {keepGpsTolerance
                    ? "Keep"
                    : "Ignore"}
                </span>
              </label>
            </div>

            <span className="settings-card__hint">
              Saved spot:{" "}
              {gpsLatitude && gpsLongitude
                ? `${gpsLatitude}, ${gpsLongitude}`
                : "not set"}
              {gpsAccuracy !== ""
                ? ` · ${gpsAccuracy} m`
                : ""}
              {" · "}
              {keepGpsTolerance
                ? "GPS tolerance on"
                : "GPS tolerance ignored"}
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

      {hasInvalidGps && (

        <p className="settings-warning">
          Fill all GPS fields with valid
          numbers, or leave them all empty.
        </p>

      )}

      <div className="settings-actions">

        <button
          type="button"
          className="settings-reset"
          onClick={handleReset}
          disabled={loading || saving}
        >
          Reset
        </button>

        <button
          type="button"
          className="settings-save"
          onClick={handleSave}
          disabled={
            loading || saving || hasInvalidGps
          }
        >
          {saving
            ? "Saving..."
            : "Save Settings"}
        </button>

        {saved && (
          <span className="settings-saved">
            Saved to database. Backend
            settings now include GPS.
          </span>
        )}

      </div>

    </div>
  );
}

export default Settings;
