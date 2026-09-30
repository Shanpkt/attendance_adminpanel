import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
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
  timeLabel
) => {
  const selfieUrl = getSelfieUrl(punch);

  const punchClass =
    type === "in"
      ? "attendance-punch attendance-punch--in"
      : "attendance-punch attendance-punch--out";

  const punchLabel =
    type === "in" ? "Punch In" : "Punch Out";

  const cell = (
    <Box
      className={`${punchClass}${
        selfieUrl
          ? " attendance-punch--has-photo"
          : ""
      }`}
    >
      <span className="punch-label">
        {punchLabel}
      </span>
      <strong>{timeLabel}</strong>
    </Box>
  );

  if (!selfieUrl) {
    return cell;
  }

  return (
    <Tooltip
      arrow
      placement="top"
      enterDelay={120}
      leaveDelay={80}
      slotProps={{
        tooltip: {
          className: "selfie-tooltip",
          sx: {
            bgcolor: "#ffffff",
            color: "#111827",
            padding: "8px",
            maxWidth: "none",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow:
              "0 16px 40px rgba(15, 23, 42, 0.18)",
          },
        },
        arrow: {
          sx: {
            color: "#ffffff",
          },
        },
      }}
      title={
        <div className="selfie-popup">
          <p className="selfie-popup__title">
            {punchLabel} photo
          </p>
          <img
            src={selfieUrl}
            alt={`${punchLabel} selfie`}
          />
        </div>
      }
    >
      <span className="attendance-punch__hit">
        {cell}
      </span>
    </Tooltip>
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
                        punchInTime
                      )}

                      {renderPunchCell(
                        punchOut,
                        "out",
                        punchOutTime
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
