export const SETTINGS_API =
  "https://attendance-backend-hs75.onrender.com/api/settings";

export const DEFAULT_ATTENDANCE_SETTINGS = {
  lateComingTime: "10:00",
  halfDayTime: "13:30",
  latitude: "",
  longitude: "",
  accuracy: "",
  tolerance: "30",
  punchAccuracy: "30",
  gpsTolerance: true,
};

const toSettingBoolean = (value, fallback) => {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }

  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }

  return fallback;
};

const toSettingNumber = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return String(number);
};

export const timeToMinutes = (time) => {
  if (!time) {
    return 0;
  }

  const [
    hours,
    minutes,
  ] = String(time)
    .split(":")
    .map(Number);

  return (
    (hours || 0) * 60 +
    (minutes || 0)
  );
};

export const isPunchAfterTime = (
  timestamp,
  time
) => {
  if (!timestamp || !time) {
    return false;
  }

  const date =
    timestamp instanceof Date
      ? timestamp
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const punchMinutes =
    date.getHours() * 60 +
    date.getMinutes();

  return punchMinutes > timeToMinutes(time);
};

export const formatTimeLabel = (time) => {
  if (!time) {
    return "—";
  }

  const [
    hours,
    minutes,
  ] = String(time)
    .split(":")
    .map(Number);

  const date = new Date();

  date.setHours(
    hours || 0,
    minutes || 0,
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

export const normalizeSettings = (
  data = {}
) => {
  return {
    lateComingTime:
      data.lateComingTime ||
      DEFAULT_ATTENDANCE_SETTINGS.lateComingTime,
    halfDayTime:
      data.halfDayTime ||
      DEFAULT_ATTENDANCE_SETTINGS.halfDayTime,
    latitude: toSettingNumber(
      data.latitude
    ),
    longitude: toSettingNumber(
      data.longitude
    ),
    accuracy: toSettingNumber(
      data.accuracy
    ),
    tolerance: toSettingNumber(
      data.tolerance !== undefined &&
        data.tolerance !== null &&
        data.tolerance !== ""
        ? data.tolerance
        : DEFAULT_ATTENDANCE_SETTINGS.tolerance
    ),
    punchAccuracy: toSettingNumber(
      data.punchAccuracy !== undefined &&
        data.punchAccuracy !== null &&
        data.punchAccuracy !== ""
        ? data.punchAccuracy
        : DEFAULT_ATTENDANCE_SETTINGS.punchAccuracy
    ),
    gpsTolerance: toSettingBoolean(
      data.gpsTolerance,
      DEFAULT_ATTENDANCE_SETTINGS.gpsTolerance
    ),
  };
};

export const toSettingsPayload = (
  data = {}
) => {
  const settings = normalizeSettings(data);

  const toNumberOrNull = (value) => {
    if (value === "") {
      return null;
    }

    return Number(value);
  };

  const latitude = toNumberOrNull(
    settings.latitude
  );
  const longitude = toNumberOrNull(
    settings.longitude
  );
  const hasLocation =
    latitude != null ||
    longitude != null ||
    settings.accuracy !== "";

  return {
    lateComingTime: settings.lateComingTime,
    halfDayTime: settings.halfDayTime,
    latitude,
    longitude,
    accuracy: toNumberOrNull(
      settings.accuracy
    ),
    tolerance: hasLocation
      ? toNumberOrNull(
          settings.tolerance !== ""
            ? settings.tolerance
            : DEFAULT_ATTENDANCE_SETTINGS.tolerance
        )
      : null,
    punchAccuracy: toNumberOrNull(
      settings.punchAccuracy !== ""
        ? settings.punchAccuracy
        : DEFAULT_ATTENDANCE_SETTINGS.punchAccuracy
    ),
    gpsTolerance: Boolean(settings.gpsTolerance),
  };
};

export const isValidPunchAccuracy = (
  punchAccuracy
) => {
  if (
    punchAccuracy === "" ||
    punchAccuracy === undefined ||
    punchAccuracy === null
  ) {
    return true;
  }

  const value = Number(punchAccuracy);

  return Number.isFinite(value) && value >= 0;
};

export const isValidGpsSettings = ({
  latitude,
  longitude,
  accuracy,
  tolerance,
}) => {
  const hasLocation = [
    latitude,
    longitude,
    accuracy,
  ].some((value) => value !== "");

  if (!hasLocation) {
    return true;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  const acc = Number(accuracy);
  const tol = Number(
    tolerance !== "" && tolerance != null
      ? tolerance
      : DEFAULT_ATTENDANCE_SETTINGS.tolerance
  );

  return (
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180 &&
    Number.isFinite(acc) &&
    acc >= 0 &&
    Number.isFinite(tol) &&
    tol > 0
  );
};
