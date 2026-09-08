import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ContrastIcon from "@mui/icons-material/Contrast";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PlaceIcon from "@mui/icons-material/Place";
import StopCircleIcon from "@mui/icons-material/StopCircle";

import useAttendanceSettings from "../../hooks/useAttendanceSettings";
import {
  DEFAULT_ATTENDANCE_SETTINGS,
  formatTimeLabel,
  isValidGpsSettings,
  isValidPunchAccuracy,
  timeToMinutes,
} from "../../utils/attendanceSettings";

import "./Settings.scss";

const GPS_SCAN_TARGET_METERS = 8;

const formatGpsAccuracy = (value) => {
  if (value == null || !Number.isFinite(Number(value))) {
    return "";
  }

  return String(Math.round(Number(value) * 100) / 100);
};

function Settings() {
  const {
    lateComingTime,
    halfDayTime,
    latitude,
    longitude,
    accuracy,
    tolerance,
    punchAccuracy,
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

  const [gpsToleranceMeters, setGpsToleranceMeters] =
    useState(tolerance);

  const [punchAccuracyMeters, setPunchAccuracyMeters] =
    useState(punchAccuracy);

  const [keepGpsTolerance, setKeepGpsTolerance] =
    useState(gpsTolerance);

  const [scanning, setScanning] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const watchIdRef = useRef(null);
  const scanningRef = useRef(false);

  scanningRef.current = scanning;

  useEffect(() => {
    setLateTime(lateComingTime);
    setHalfTime(halfDayTime);
    setKeepGpsTolerance(gpsTolerance);

    if (!scanningRef.current) {
      setGpsLatitude(latitude);
      setGpsLongitude(longitude);
      setGpsAccuracy(accuracy);
      setGpsToleranceMeters(tolerance);
      setPunchAccuracyMeters(punchAccuracy);
    }
  }, [
    lateComingTime,
    halfDayTime,
    latitude,
    longitude,
    accuracy,
    tolerance,
    punchAccuracy,
    gpsTolerance,
  ]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }
    };
  }, []);

  const hasInvalidOrder =
    timeToMinutes(halfTime) <=
    timeToMinutes(lateTime);

  const hasInvalidGps = !isValidGpsSettings({
    latitude: gpsLatitude,
    longitude: gpsLongitude,
    accuracy: gpsAccuracy,
    tolerance: gpsToleranceMeters,
  });

  const hasInvalidPunchAccuracy =
    !isValidPunchAccuracy(punchAccuracyMeters);

  const updateGpsField = (setter) => {
    return (event) => {
      setter(event.target.value);
      setSaved(false);
      setFormError("");
    };
  };

  const stopGpsScan = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );
      watchIdRef.current = null;
    }

    setScanning(false);
  };

  const handleScanCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormError(
        "This browser cannot read GPS location."
      );
      return;
    }

    stopGpsScan();
    setScanning(true);
    setFormError("");
    setSaved(false);

    watchIdRef.current =
      navigator.geolocation.watchPosition(
        (position) => {
          const {
            latitude: currentLatitude,
            longitude: currentLongitude,
            accuracy: currentAccuracy,
          } = position.coords;

          setGpsLatitude(String(currentLatitude));
          setGpsLongitude(String(currentLongitude));
          setGpsAccuracy(
            formatGpsAccuracy(currentAccuracy)
          );

          if (
            Number.isFinite(currentAccuracy) &&
            currentAccuracy <= GPS_SCAN_TARGET_METERS
          ) {
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(
                watchIdRef.current
              );
              watchIdRef.current = null;
            }

            setScanning(false);
          }
        },
        (gpsError) => {
          if (gpsError.code === 1) {
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(
                watchIdRef.current
              );
              watchIdRef.current = null;
            }

            setScanning(false);
            setFormError(
              "Location permission denied. Please allow location access."
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
  };

  const handleSave = async () => {
    setSaved(false);
    setFormError("");

    if (hasInvalidGps) {
      setFormError(
        "Enter valid latitude, longitude, tolerance, and spot accuracy, or leave all GPS fields empty."
      );
      return;
    }

    if (hasInvalidPunchAccuracy) {
      setFormError(
        "Enter a valid punch accuracy in meters (0 or more)."
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
        tolerance: gpsToleranceMeters,
        punchAccuracy: punchAccuracyMeters,
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

    setGpsToleranceMeters(
      DEFAULT_ATTENDANCE_SETTINGS.tolerance
    );

    setPunchAccuracyMeters(
      DEFAULT_ATTENDANCE_SETTINGS.punchAccuracy
    );

    setKeepGpsTolerance(
      DEFAULT_ATTENDANCE_SETTINGS.gpsTolerance
    );

    stopGpsScan();
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
              distance tolerance, and GPS
              accuracy for employee punch-in.
              Scan current location until GPS
              accuracy is {GPS_SCAN_TARGET_METERS}m
              or better.
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
                    loading || saving || scanning
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
                    loading || saving || scanning
                  }
                  onChange={updateGpsField(
                    setGpsLongitude
                  )}
                />
              </div>

              <div>
                <label htmlFor="gps-tolerance-meters">
                  Tolerance (m)
                </label>
                <input
                  id="gps-tolerance-meters"
                  type="number"
                  step="any"
                  min="1"
                  placeholder="e.g. 30"
                  value={gpsToleranceMeters}
                  disabled={
                    loading || saving || scanning
                  }
                  onChange={updateGpsField(
                    setGpsToleranceMeters
                  )}
                />
              </div>

              <div>
                <label htmlFor="gps-accuracy">
                  Spot Accuracy (m)
                </label>
                <input
                  id="gps-accuracy"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="From GPS scan"
                  value={gpsAccuracy}
                  disabled={
                    loading || saving || scanning
                  }
                  onChange={updateGpsField(
                    setGpsAccuracy
                  )}
                />
              </div>

            </div>

            <div className="settings-gps-punch">
              <div>
                <label htmlFor="punch-accuracy">
                  Punch Accuracy (m)
                </label>
                <input
                  id="punch-accuracy"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 30"
                  value={punchAccuracyMeters}
                  disabled={loading || saving}
                  onChange={updateGpsField(
                    setPunchAccuracyMeters
                  )}
                />
                <span className="settings-card__hint">
                  Max GPS accuracy allowed when
                  employees punch in.
                </span>
              </div>
            </div>

            <div className="settings-gps-actions">
              <button
                type="button"
                className="settings-gps-button"
                onClick={handleScanCurrentLocation}
                disabled={
                  loading || saving || scanning
                }
              >
                <MyLocationIcon />
                {scanning
                  ? `Scanning... need ${GPS_SCAN_TARGET_METERS}m`
                  : "Scan current location"}
              </button>

              <button
                type="button"
                className="settings-gps-button settings-gps-button--stop"
                onClick={stopGpsScan}
                disabled={!scanning}
              >
                <StopCircleIcon />
                Stop
              </button>
            </div>

            {scanning && (
              <span className="settings-card__hint">
                Scanning GPS until accuracy
                is {GPS_SCAN_TARGET_METERS}m
                or better. Current accuracy:{" "}
                {gpsAccuracy !== ""
                  ? `${gpsAccuracy} m`
                  : "waiting..."}
              </span>
            )}

            <div className="settings-gps-tolerance">
              <div>
                <label htmlFor="gps-tolerance">
                  GPS Check
                </label>
                <p>
                  On makes the punch app read
                  user GPS and compare
                  accuracy and office
                  distance. Off skips GPS
                  completely and opens the
                  camera.
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
                    ? "On"
                    : "Off"}
                </span>
              </label>
            </div>

            <span className="settings-card__hint">
              Saved spot:{" "}
              {gpsLatitude && gpsLongitude
                ? `${gpsLatitude}, ${gpsLongitude}`
                : "not set"}
              {gpsToleranceMeters !== ""
                ? ` · ${gpsToleranceMeters} m tolerance`
                : ""}
              {gpsAccuracy !== ""
                ? ` · ${gpsAccuracy} m spot`
                : ""}
              {punchAccuracyMeters !== ""
                ? ` · ${punchAccuracyMeters} m punch`
                : ""}
              {" · "}
              {keepGpsTolerance
                ? "GPS check on"
                : "GPS check off"}
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
          numbers (tolerance must be greater
          than 0), or leave them all empty.
        </p>

      )}

      {hasInvalidPunchAccuracy && (

        <p className="settings-warning">
          Enter a valid punch accuracy in
          meters (0 or more).
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
            loading || saving || hasInvalidGps || hasInvalidPunchAccuracy
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
