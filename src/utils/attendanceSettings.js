export const SETTINGS_API =
  "https://attendance-backend-hs75.onrender.com/api/settings";

export const DEFAULT_ATTENDANCE_SETTINGS = {
  lateComingTime: "10:00",
  halfDayTime: "13:30",
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
  };
};
