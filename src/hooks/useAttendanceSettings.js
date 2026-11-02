import {
  useCallback,
  useEffect,
  useState,
} from "react";

import axios from "axios";

import { SETTINGS_API } from "../api";
import {
  DEFAULT_ATTENDANCE_SETTINGS,
  normalizeSettings,
  toSettingsPayload,
} from "../utils/attendanceSettings";
import { normalizeAdminMode } from "../utils/adminMode";

function useAttendanceSettings(workspace = "shop") {
  const safeWorkspace = normalizeAdminMode(workspace);

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
            SETTINGS_API,
            {
              params: {
                workspace: safeWorkspace,
              },
            }
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
    [safeWorkspace]
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(
    async (nextSettings) => {
      const payload = {
        ...toSettingsPayload({
          ...settings,
          ...nextSettings,
        }),
        workspace: safeWorkspace,
      };

      setSaving(true);
      setError("");

      try {
        const response =
          await axios.put(
            SETTINGS_API,
            payload,
            {
              params: {
                workspace: safeWorkspace,
              },
            }
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
    [settings, safeWorkspace]
  );

  return {
    lateComingTime:
      settings.lateComingTime,
    halfDayTime:
      settings.halfDayTime,
    sundayLateComingTime:
      settings.sundayLateComingTime,
    sundayHalfDayTime:
      settings.sundayHalfDayTime,
    latitude: settings.latitude,
    longitude: settings.longitude,
    accuracy: settings.accuracy,
    tolerance: settings.tolerance,
    punchAccuracy: settings.punchAccuracy,
    gpsTolerance: settings.gpsTolerance,
    showMonthlyAttendance:
      settings.showMonthlyAttendance,
    paidLeaves: settings.paidLeaves,
    loading,
    saving,
    error,
    saveSettings,
    fetchSettings,
  };
}

export default useAttendanceSettings;
