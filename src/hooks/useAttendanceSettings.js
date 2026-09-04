import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ATTENDANCE_SETTINGS_EVENT,
  loadAttendanceSettings,
  saveAttendanceSettings,
} from "../utils/attendanceSettings";

function useAttendanceSettings() {
  const [settings, setSettings] = useState(
    loadAttendanceSettings
  );

  useEffect(() => {
    const syncSettings = () => {
      setSettings(
        loadAttendanceSettings()
      );
    };

    window.addEventListener(
      ATTENDANCE_SETTINGS_EVENT,
      syncSettings
    );

    window.addEventListener(
      "storage",
      syncSettings
    );

    return () => {
      window.removeEventListener(
        ATTENDANCE_SETTINGS_EVENT,
        syncSettings
      );

      window.removeEventListener(
        "storage",
        syncSettings
      );
    };
  }, []);

  const saveSettings = useCallback(
    (nextSettings) => {
      const saved =
        saveAttendanceSettings(
          nextSettings
        );

      setSettings(saved);

      return saved;
    },
    []
  );

  return {
    lateComingTime:
      settings.lateComingTime,
    halfDayTime:
      settings.halfDayTime,
    saveSettings,
  };
}

export default useAttendanceSettings;
