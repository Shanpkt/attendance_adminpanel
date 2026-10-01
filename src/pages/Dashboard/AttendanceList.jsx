import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import EmployeePhoto from "../../components/EmployeePhoto";
import { formatShortTime } from "./useDashboardData";

const getSelfieUrl = (punch) => {
  if (!punch) {
    return "";
  }

  return (
    punch.selfieUrl ||
    punch.selfieURL ||
    punch.imageUrl ||
    ""
  );
};

const getStatusClass = (status) => {
  if (status === "Punched Out") {
    return "status-punched-out";
  }

  return "status-punched-in";
};

const renderPunchCell = (
  punch,
  type,
  timeLabel,
  showPhotos
) => {
  const selfieUrl = getSelfieUrl(punch);

  const punchClass =
    type === "in"
      ? "attendance-punch attendance-punch--in"
      : "attendance-punch attendance-punch--out";

  const punchLabel =
    type === "in" ? "Punch In" : "Punch Out";

  return (
    <Box
      className={`${punchClass}${
        showPhotos && selfieUrl
          ? " attendance-punch--has-photo"
          : ""
      }`}
    >
      <span className="punch-label">
        {punchLabel}
      </span>
      <strong>{timeLabel}</strong>

      {showPhotos && selfieUrl ? (
        <img
          className="attendance-punch__photo"
          src={selfieUrl}
          alt={`${punchLabel} selfie`}
        />
      ) : null}
    </Box>
  );
};

function AttendanceList({
  attendanceList,
  employees,
  loading,
  refreshing,
  error,
  onRefresh,
  onDownloadPdf,
  getEmployeeName,
}) {
  const [showPhotos, setShowPhotos] =
    useState(true);

  const getEmployeePhoto = (mobileNumber) => {
    const employee = employees.find(
      (emp) =>
        String(emp.mobileNumber) ===
        String(mobileNumber)
    );

    return employee?.profilePic || "";
  };

  return (
    <section className="dashboard-grid">
      <div className="attendance-card">
        <div className="card-header">
          <div>
            <h2>Today&apos;s Attendance List</h2>
            <p className="attendance-subtitle">
              Punch in and punch out details
            </p>
          </div>

          <div className="attendance-actions">
            <button
              className="refresh-button"
              onClick={onRefresh}
              disabled={refreshing}
            >
              {refreshing
                ? "↻ Refreshing..."
                : "↻ Refresh"}
            </button>

            <button
              className="view-all"
              onClick={onDownloadPdf}
              disabled={
                loading ||
                refreshing ||
                attendanceList.length === 0
              }
            >
              Download PDF
            </button>
          </div>
        </div>

        {!loading &&
          !error &&
          attendanceList.length > 0 && (
            <div className="photo-toggle">
              <span className="photo-toggle__label">
                Show punch photos
              </span>

              <div
                className="photo-toggle__radios"
                role="radiogroup"
                aria-label="Show punch photos"
              >
                <label
                  className={`photo-toggle__option${
                    showPhotos
                      ? " is-active"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="show-punch-photos"
                    value="show"
                    checked={showPhotos}
                    onChange={() =>
                      setShowPhotos(true)
                    }
                  />
                  Show
                </label>

                <label
                  className={`photo-toggle__option${
                    !showPhotos
                      ? " is-active"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="show-punch-photos"
                    value="hide"
                    checked={!showPhotos}
                    onChange={() =>
                      setShowPhotos(false)
                    }
                  />
                  Hide
                </label>
              </div>
            </div>
          )}

        {loading && (
          <div className="attendance-placeholder">
            <div className="dashboard-loader">
              <span></span>
            </div>
            Loading attendance...
          </div>
        )}

        {!loading && error && (
          <div className="attendance-placeholder">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          attendanceList.length === 0 && (
            <div className="attendance-placeholder">
              No attendance records found for
              today.
            </div>
          )}

        {!loading &&
          !error &&
          attendanceList.length > 0 && (
            <Box className="attendance-list">
              <Box className="attendance-list__header">
                <Typography>Employee</Typography>
                <Typography>Date</Typography>
                <Typography>Punch In</Typography>
                <Typography>
                  Punch Out
                </Typography>
                <Typography>Status</Typography>
              </Box>

              {attendanceList.map(
                (attendance) => {
                  const punchIn =
                    attendance.punchIn || {};
                  const punchOut =
                    attendance.punchOut || {};

                  const punchInTime =
                    formatShortTime(
                      punchIn.timestamp
                    );
                  const punchOutTime =
                    formatShortTime(
                      punchOut.timestamp
                    );
                  const employeeName =
                    getEmployeeName(
                      attendance.mobileNumber
                    );
                  const status =
                    attendance.status ||
                    "Punched In";

                  return (
                    <Box
                      key={attendance._id}
                      className="attendance-list__row"
                    >
                      <Box className="attendance-user">
                        <EmployeePhoto
                          src={getEmployeePhoto(
                            attendance.mobileNumber
                          )}
                          name={employeeName}
                        />

                        <Box>
                          <Typography className="attendance-user__number">
                            {employeeName}
                          </Typography>
                          <Typography className="attendance-user__label">
                            {
                              attendance.mobileNumber
                            }
                          </Typography>
                        </Box>
                      </Box>

                      <Typography className="attendance-date">
                        {attendance.date}
                      </Typography>

                      {renderPunchCell(
                        punchIn,
                        "in",
                        punchInTime,
                        showPhotos
                      )}

                      {renderPunchCell(
                        punchOut,
                        "out",
                        punchOutTime,
                        showPhotos
                      )}

                      <Chip
                        label={status}
                        size="small"
                        className={`attendance-status ${getStatusClass(
                          status
                        )}`}
                      />
                    </Box>
                  );
                }
              )}
            </Box>
          )}
      </div>
    </section>
  );
}

export default AttendanceList;
