export const ATTENDANCE_SETTINGS_KEY =
  "adminpanel.attendanceLimits";

export const ATTENDANCE_SETTINGS_EVENT =
  "attendance-settings-updated";

export const DEFAULT_ATTENDANCE_SETTINGS = {
  lateComingTime: "10:00",
  halfDayTime: "13:30",
};

export const loadAttendanceSettings = () => {
  try {
    const raw = localStorage.getItem(
      ATTENDANCE_SETTINGS_KEY
    );

    if (!raw) {
      return {
        ...DEFAULT_ATTENDANCE_SETTINGS,
      };
    }

    const parsed = JSON.parse(raw);

    return {
      lateComingTime:
        parsed.lateComingTime ||
        DEFAULT_ATTENDANCE_SETTINGS.lateComingTime,
      halfDayTime:
        parsed.halfDayTime ||
        DEFAULT_ATTENDANCE_SETTINGS.halfDayTime,
    };
  } catch (error) {
    return {
      ...DEFAULT_ATTENDANCE_SETTINGS,
    };
  }
};

export const saveAttendanceSettings = (
  settings
) => {
  const nextSettings = {
    lateComingTime:
      settings.lateComingTime ||
      DEFAULT_ATTENDANCE_SETTINGS.lateComingTime,
    halfDayTime:
      settings.halfDayTime ||
      DEFAULT_ATTENDANCE_SETTINGS.halfDayTime,
  };

  localStorage.setItem(
    ATTENDANCE_SETTINGS_KEY,
    JSON.stringify(nextSettings)
  );

  window.dispatchEvent(
    new CustomEvent(
      ATTENDANCE_SETTINGS_EVENT,
      {
        detail: nextSettings,
      }
    )
  );

  return nextSettings;
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
