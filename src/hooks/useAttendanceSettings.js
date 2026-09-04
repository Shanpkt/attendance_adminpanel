import {
  useCallback,
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  DEFAULT_ATTENDANCE_SETTINGS,
  SETTINGS_API,
  normalizeSettings,
  toSettingsPayload,
} from "../utils/attendanceSettings";

function useAttendanceSettings() {
  const [settings, setSettings] = useState(
    DEFAULT_ATTENDANCE_SETTINGS
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const fetchSettings = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await axios.get(
            SETTINGS_API
          );

        setSettings(
          normalizeSettings(
            response.data?.data
          )
        );
      } catch (fetchError) {
        console.error(
          "Error fetching settings:",
          fetchError
        );

        setError(
          "Unable to fetch settings."
        );

        setSettings(
          DEFAULT_ATTENDANCE_SETTINGS
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(
    async (nextSettings) => {
      const payload =
        toSettingsPayload({
          ...settings,
          ...nextSettings,
        });

      setSaving(true);
      setError("");

      try {
        const response =
          await axios.put(
            SETTINGS_API,
            payload
          );

        const saved =
          normalizeSettings(
            response.data?.data
          );

        setSettings(saved);

        return saved;
      } catch (saveError) {
        console.error(
          "Error saving settings:",
          saveError
        );

        const message =
          saveError.response?.data
            ?.message ||
          "Unable to save settings.";

        setError(message);

        throw saveError;
      } finally {
        setSaving(false);
      }
    },
    [settings]
  );

  return {
    lateComingTime:
      settings.lateComingTime,
    halfDayTime:
      settings.halfDayTime,
    latitude: settings.latitude,
    longitude: settings.longitude,
    accuracy: settings.accuracy,
    loading,
    saving,
    error,
    saveSettings,
    fetchSettings,
  };
}

export default useAttendanceSettings;
