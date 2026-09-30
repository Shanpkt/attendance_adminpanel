import React from "react";

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
