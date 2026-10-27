import { useCallback, useEffect, useState } from "react";

import axios from "axios";

import { EMPLOYEES_API } from "../../api";

const formatRequestedAt = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function MonthlyAccessBell() {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      const response = await axios.get(
        `${EMPLOYEES_API}/monthly-access/requests`
      );

      setRequests(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
      setError("");
    } catch (loadError) {
      setError("Unable to load requests.");
    }
  }, []);

  useEffect(() => {
    loadRequests();

    const timer = setInterval(loadRequests, 20000);

    return () => clearInterval(timer);
  }, [loadRequests]);

  const pendingCount = requests.filter(
    (employee) =>
      employee.monthlyAttendanceAccess === "requested"
  ).length;

  const rejectRequest = async (employeeId) => {
    try {
      setSavingId(employeeId);
      setError("");

      await axios.delete(
        `${EMPLOYEES_API}/${employeeId}/monthly-access`
      );

      await loadRequests();
    } catch (rejectError) {
      setError(
        rejectError.response?.data?.message ||
          "Unable to reject the request."
      );
    } finally {
      setSavingId("");
    }
  };

  const updateAccess = async (employeeId, enabled) => {
    try {
      setSavingId(employeeId);
      setError("");

      await axios.patch(
        `${EMPLOYEES_API}/${employeeId}/monthly-access`,
        { enabled }
      );

      await loadRequests();
    } catch (updateError) {
      setError(
        updateError.response?.data?.message ||
          "Unable to update access."
      );
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="access-bell">
      <button
        type="button"
        className="access-bell__button"
        aria-label="Monthly attendance requests"
        onClick={() => setOpen((current) => !current)}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="access-bell__icon"
        >
          <path
            d="M12 3a5 5 0 0 0-5 5v2.1c0 .7-.2 1.4-.7 2L4.6 14.2A1.5 1.5 0 0 0 5.8 16.5h12.4a1.5 1.5 0 0 0 1.2-2.3l-1.7-2.1c-.5-.6-.7-1.3-.7-2V8a5 5 0 0 0-5-5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M9.5 16.5a2.5 2.5 0 0 0 5 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {pendingCount > 0 && (
          <span className="access-bell__badge">
            {pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="access-bell__panel">
          <div className="access-bell__header">
            <strong>Attendance requests</strong>
            <span>{pendingCount} new</span>
          </div>

          {error && (
            <p className="access-bell__error">{error}</p>
          )}

          {requests.length === 0 ? (
            <p className="access-bell__empty">
              No monthly attendance requests.
            </p>
          ) : (
            <div className="access-bell__list">
              {requests.map((employee) => {
                const enabled =
                  employee.monthlyAttendanceAccess ===
                  "enabled";
                const groupName = `monthly-access-${employee._id}`;

                return (
                  <div
                    className="access-bell__item"
                    key={employee._id}
                  >
                    <div>
                      <strong>{employee.name}</strong>
                      <span>{employee.mobileNumber}</span>
                      {employee.monthlyAttendanceRequestedAt && (
                        <small>
                          {formatRequestedAt(
                            employee.monthlyAttendanceRequestedAt
                          )}
                        </small>
                      )}
                    </div>

                    <div className="access-bell__actions">
                      <div
                        className="access-bell__radios"
                        role="radiogroup"
                        aria-label={`Monthly attendance for ${employee.name}`}
                      >
                        <label>
                          <input
                            type="radio"
                            name={groupName}
                            checked={enabled}
                            disabled={
                              savingId === employee._id
                            }
                            onChange={() =>
                              updateAccess(
                                employee._id,
                                true
                              )
                            }
                          />
                          Enable
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={groupName}
                            checked={
                              employee.monthlyAttendanceAccess ===
                              "disabled"
                            }
                            disabled={
                              savingId === employee._id
                            }
                            onChange={() =>
                              updateAccess(
                                employee._id,
                                false
                              )
                            }
                          />
                          Disable
                        </label>
                      </div>

                      <button
                        type="button"
                        className="access-bell__reject"
                        disabled={
                          savingId === employee._id
                        }
                        onClick={() =>
                          rejectRequest(employee._id)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MonthlyAccessBell;
