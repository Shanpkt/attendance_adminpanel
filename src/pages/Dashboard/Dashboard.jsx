import React, { useState } from "react";

import EmployeePhoto from "../../components/EmployeePhoto";
import useAttendanceSettings from "../../hooks/useAttendanceSettings";
import useDashboardData from "./useDashboardData";
import useDashboardStats from "./useDashboardStats";
import downloadAttendancePdf from "./downloadAttendancePdf";
import StatsSection from "./StatsSection";
import AttendanceList from "./AttendanceList";

import "./Dashboard.scss";

function Dashboard() {
  const {
    lateComingTime,
    halfDayTime,
  } = useAttendanceSettings();

  const {
    attendanceList,
    employees,
    todayLeaves,
    todayHoliday,
    loading,
    refreshing,
    error,
    fetchData,
  } = useDashboardData();

  const {
    totalEmployees,
    presentCount,
    punchOutCount,
    totalPunches,
    pendingPunchOutEmployees,
    absentCount,
    stats,
    absentEmployees,
    onLeaveEmployees,
    halfDayEmployees,
    lateEmployees,
    getEmployeeName,
  } = useDashboardStats({
    attendanceList,
    employees,
    todayLeaves,
    lateComingTime,
    halfDayTime,
    isHoliday: Boolean(todayHoliday),
  });

  const [
    showPendingPunchOut,
    setShowPendingPunchOut,
  ] = useState(false);

  const handleDownloadPdf = () => {
    downloadAttendancePdf({
      attendanceList,
      totalEmployees,
      presentCount,
      absentCount,
      getEmployeeName,
    });
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1>Today Attendance</h1>
          <p>
            Overview of today&apos;s employee
            attendance
          </p>
        </div>

        <div className="dashboard__actions">
          <button
            className="report-button"
            onClick={handleDownloadPdf}
            disabled={
              loading ||
              refreshing ||
              attendanceList.length === 0
            }
          >
            📄
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {todayHoliday && (
        <div className="dashboard-holiday-banner">
          Today is a holiday
          {todayHoliday.name
            ? `: ${todayHoliday.name}`
            : ""}
          . Absent is not counted.
        </div>
      )}

      <div
        className={`punch-out-progress${
          showPendingPunchOut ? " is-open" : ""
        }`}
        onClick={() =>
          setShowPendingPunchOut(
            (current) => !current
          )
        }
      >
        <div className="punch-out-progress__header">
          <span>Punch Out</span>
          <strong>
            {punchOutCount} / {totalPunches}
          </strong>
        </div>

        <progress
          max={Math.max(totalPunches, 1)}
          value={
            totalPunches === 0
              ? 0
              : punchOutCount
          }
          aria-label="Punch out progress"
        />

        <small className="punch-out-progress__hint">
          Click to see who has not punched out
        </small>

        <div
          className="absent-popup punch-out-popup"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <div className="absent-popup__header">
            <h3>Not Punched Out</h3>
            <span>
              {pendingPunchOutEmployees.length}
            </span>
          </div>

          <div className="absent-popup__list">
            {pendingPunchOutEmployees.length > 0 ? (
              pendingPunchOutEmployees.map(
                (employee) => (
                  <div
                    className="absent-popup__employee"
                    key={employee.id}
                  >
                    <EmployeePhoto
                      className="absent-popup__avatar"
                      src={employee.profilePic}
                      name={employee.name}
                    />

                    <div>
                      <strong>
                        {employee.name}
                      </strong>
                      <span>
                        {employee.mobileNumber}
                      </span>
                      {employee.punchInTime &&
                        employee.punchInTime !==
                          "—" && (
                          <span className="punch-out-popup__meta">
                            Punched in{" "}
                            {employee.punchInTime}
                          </span>
                        )}
                    </div>
                  </div>
                )
              )
            ) : (
              <p className="no-absent">
                Everyone has punched out
              </p>
            )}
          </div>
        </div>
      </div>

      <StatsSection
        stats={stats}
        absentEmployees={absentEmployees}
        onLeaveEmployees={onLeaveEmployees}
        halfDayEmployees={halfDayEmployees}
        lateEmployees={lateEmployees}
      />

      <AttendanceList
        attendanceList={attendanceList}
        employees={employees}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={() => fetchData(true)}
        onDownloadPdf={handleDownloadPdf}
        getEmployeeName={getEmployeeName}
      />
    </div>
  );
}

export default Dashboard;
