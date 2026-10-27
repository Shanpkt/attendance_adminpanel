export const DEFAULT_ATTENDANCE_SETTINGS = {
  lateComingTime: "10:00",
  halfDayTime: "13:30",
  sundayLateComingTime: "10:00",
  sundayHalfDayTime: "13:30",
  latitude: "",
  longitude: "",
  accuracy: "",
  tolerance: "30",
  punchAccuracy: "30",
  gpsTolerance: true,
  showMonthlyAttendance: false,
  paidLeaves: "0",
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

export const isPunchBeforeTime = (
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

  return punchMinutes < timeToMinutes(time);
};

export const isHalfDayByPunchTimes = ({
  punchInTimestamp,
  punchOutTimestamp,
  halfDayTime,
}) => {
  const latePunchIn = isPunchAfterTime(
    punchInTimestamp,
    halfDayTime
  );

  const earlyPunchOut = isPunchBeforeTime(
    punchOutTimestamp,
    halfDayTime
  );

  return latePunchIn || earlyPunchOut;
};

export const parseAttendanceDate = (value) => {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [year, month, day] = raw
      .slice(0, 10)
      .split("-")
      .map(Number);

    return new Date(year, month - 1, day);
  }

  const parts = raw.split("/");

  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);

    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }

  return null;
};

export const isSundayDate = (value) => {
  const date = parseAttendanceDate(value);

  return Boolean(
    date &&
      !Number.isNaN(date.getTime()) &&
      date.getDay() === 0
  );
};

export const getCompanyLimitsForDate = (
  settings = DEFAULT_ATTENDANCE_SETTINGS,
  date
) => {
  const weekdayLate =
    settings.lateComingTime ||
    DEFAULT_ATTENDANCE_SETTINGS.lateComingTime;
  const weekdayHalf =
    settings.halfDayTime ||
    DEFAULT_ATTENDANCE_SETTINGS.halfDayTime;

  if (!isSundayDate(date)) {
    return {
      lateComingTime: weekdayLate,
      halfDayTime: weekdayHalf,
    };
  }

  return {
    lateComingTime:
      settings.sundayLateComingTime || weekdayLate,
    halfDayTime:
      settings.sundayHalfDayTime || weekdayHalf,
  };
};

export const getRecordDayLimits = (
  record,
  fallbackSettings = DEFAULT_ATTENDANCE_SETTINGS,
  employee,
  options = {}
) => {
  const companyLimits = getCompanyLimitsForDate(
    fallbackSettings,
    record?.date
  );

  const savedLate = record?.limits?.lateComingTime;
  const savedHalf = record?.limits?.halfDayTime;

  if (
    options.respectSavedLimits &&
    (savedLate || savedHalf)
  ) {
    return {
      lateComingTime: savedLate || companyLimits.lateComingTime,
      halfDayTime: savedHalf || companyLimits.halfDayTime,
    };
  }

  if (isSundayDate(record?.date)) {
    return {
      lateComingTime:
        employee?.lateComingTime ||
        companyLimits.lateComingTime,
      halfDayTime:
        employee?.halfDayTime ||
        companyLimits.halfDayTime,
    };
  }

  return {
    lateComingTime:
      savedLate || companyLimits.lateComingTime,
    halfDayTime:
      savedHalf || companyLimits.halfDayTime,
  };
};

export const getPunchInTimestampFromRecord = (
  record
) => {
  return (
    record?.punchIn?.timestamp ||
    record?.timestamp ||
    record?.createdAt ||
    null
  );
};

export const getPunchOutTimestampFromRecord = (
  record
) => {
  return record?.punchOut?.timestamp || null;
};

export const evaluateAttendanceRecord = (
  record,
  fallbackSettings = DEFAULT_ATTENDANCE_SETTINGS,
  employee,
  options
) => {
  const hasSavedLimits = Boolean(
    record?.limits?.lateComingTime ||
      record?.limits?.halfDayTime
  );

  const limits = getRecordDayLimits(
    record,
    fallbackSettings,
    employee,
    options
  );

  const punchInTimestamp =
    getPunchInTimestampFromRecord(record);
  const punchOutTimestamp =
    getPunchOutTimestampFromRecord(record);

  // Prefer computing from the day's saved limits in response data
  if (hasSavedLimits) {
    const isHalfDay = isHalfDayByPunchTimes({
      punchInTimestamp,
      punchOutTimestamp,
      halfDayTime: limits.halfDayTime,
    });

    const isLate =
      isPunchAfterTime(
        punchInTimestamp,
        limits.lateComingTime
      ) && !isHalfDay;

    return {
      limits,
      isHalfDay,
      isLate,
      source: "record-limits",
    };
  }

  const hasSavedFlags =
    record?.flags &&
    (typeof record.flags.isLate === "boolean" ||
      typeof record.flags.isHalfDay === "boolean");

  if (
    hasSavedFlags &&
    !isSundayDate(record?.date)
  ) {
    const isHalfDay = Boolean(
      record.flags.isHalfDay
    );
    const isLate = Boolean(record.flags.isLate);

    return {
      limits,
      isHalfDay,
      isLate: isLate && !isHalfDay,
      source: "record-flags",
    };
  }

  const isHalfDay = isHalfDayByPunchTimes({
    punchInTimestamp,
    punchOutTimestamp,
    halfDayTime: limits.halfDayTime,
  });

  const isLate =
    isPunchAfterTime(
      punchInTimestamp,
      limits.lateComingTime
    ) && !isHalfDay;

  return {
    limits,
    isHalfDay,
    isLate,
    source: "fallback-settings",
  };
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
    sundayLateComingTime:
      data.sundayLateComingTime ||
      DEFAULT_ATTENDANCE_SETTINGS.sundayLateComingTime,
    sundayHalfDayTime:
      data.sundayHalfDayTime ||
      DEFAULT_ATTENDANCE_SETTINGS.sundayHalfDayTime,
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
    showMonthlyAttendance: toSettingBoolean(
      data.showMonthlyAttendance,
      DEFAULT_ATTENDANCE_SETTINGS.showMonthlyAttendance
    ),
    paidLeaves: toSettingNumber(
      data.paidLeaves !== undefined &&
        data.paidLeaves !== null &&
        data.paidLeaves !== ""
        ? data.paidLeaves
        : DEFAULT_ATTENDANCE_SETTINGS.paidLeaves
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
    sundayLateComingTime:
      settings.sundayLateComingTime,
    sundayHalfDayTime: settings.sundayHalfDayTime,
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
    showMonthlyAttendance: Boolean(
      settings.showMonthlyAttendance
    ),
    paidLeaves: Number(
      settings.paidLeaves !== ""
        ? settings.paidLeaves
        : DEFAULT_ATTENDANCE_SETTINGS.paidLeaves
    ),
  };
};

export const isValidPaidLeaves = (paidLeaves) => {
  if (
    paidLeaves === "" ||
    paidLeaves === undefined ||
    paidLeaves === null
  ) {
    return false;
  }

  const value = Number(paidLeaves);

  return (
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 366
  );
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
