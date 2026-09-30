import React, { useState } from "react";
import ContrastIcon from "@mui/icons-material/Contrast";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmployeePhoto from "../../components/EmployeePhoto";

const POPUP_TYPES = new Set([
  "absent",
  "leave",
  "halfday",
  "late",
]);

function getStatIcon(stat) {
  if (stat.icon === "halfday") {
    return <ContrastIcon fontSize="inherit" />;
  }

  if (stat.icon === "late") {
    return (
      <AccessTimeIcon fontSize="inherit" />
    );
  }

  return stat.icon;
}

function StatsSection({
  stats,
  absentEmployees,
  onLeaveEmployees,
  halfDayEmployees,
  lateEmployees,
}) {
  const [openStatPopup, setOpenStatPopup] =
    useState("");

  return (
    <section className="stats">
      {stats.map((stat) => (
        <div
          className={`stat-card stat-card--${stat.type}${
            openStatPopup === stat.type
              ? " is-open"
              : ""
          }`}
          key={stat.title}
          onClick={() => {
            if (!POPUP_TYPES.has(stat.type)) {
              return;
            }

            setOpenStatPopup((current) =>
              current === stat.type
                ? ""
                : stat.type
            );
          }}
        >
          <div className="stat-card__icon">
            {getStatIcon(stat)}
          </div>

          <div className="stat-card__content">
            <p>{stat.title}</p>
            <h2>{stat.value}</h2>
          </div>

          {stat.type === "absent" && (
            <div
              className="absent-popup"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="absent-popup__header">
                <h3>Absent Employees</h3>
                <span>
                  {absentEmployees.length}
                </span>
              </div>

              <div className="absent-popup__list">
                {absentEmployees.length > 0 ? (
                  absentEmployees.map(
                    (employee) => {
                      const employeeName =
                        employee.name ||
                        employee.fullName ||
                        employee.employeeName ||
                        employee.firstName ||
                        "Unknown Employee";

                      return (
                        <div
                          className="absent-popup__employee"
                          key={
                            employee._id ||
                            employee.mobileNumber
                          }
                        >
                          <EmployeePhoto
                            className="absent-popup__avatar"
                            src={
                              employee.profilePic
                            }
                            name={employeeName}
                          />

                          <div>
                            <strong>
                              {employeeName}
                            </strong>
                            <span>
                              {
                                employee.mobileNumber
                              }
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )
                ) : (
                  <p className="no-absent">
                    No absent employees 🎉
                  </p>
                )}
              </div>
            </div>
          )}

          {stat.type === "leave" && (
            <div
              className="absent-popup leave-popup"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="absent-popup__header">
                <h3>On Leave Today</h3>
                <span>
                  {onLeaveEmployees.length}
                </span>
              </div>

              <div className="absent-popup__list">
                {onLeaveEmployees.length > 0 ? (
                  onLeaveEmployees.map(
                    (employee) => (
                      <div
                        className="absent-popup__employee"
                        key={employee.id}
                      >
                        <EmployeePhoto
                          className="absent-popup__avatar"
                          src={
                            employee.profilePic
                          }
                          name={employee.name}
                        />

                        <div>
                          <strong>
                            {employee.name}
                          </strong>
                          <span>
                            {
                              employee.mobileNumber
                            }
                          </span>

                          {(employee.leaveType ||
                            employee.reason) && (
                            <span className="leave-popup__meta">
                              {
                                employee.leaveType
                              }
                              {employee.reason
                                ? ` · ${employee.reason}`
                                : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <p className="no-absent">
                    No employees on leave today
                  </p>
                )}
              </div>
            </div>
          )}

          {stat.type === "halfday" && (
            <div
              className="absent-popup halfday-popup"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="absent-popup__header">
                <h3>Half Day Employees</h3>
                <span>
                  {halfDayEmployees.length}
                </span>
              </div>

              <div className="absent-popup__list">
                {halfDayEmployees.length > 0 ? (
                  halfDayEmployees.map(
                    (employee) => (
                      <div
                        className="absent-popup__employee"
                        key={employee.id}
                      >
                        <EmployeePhoto
                          className="absent-popup__avatar"
                          src={
                            employee.profilePic
                          }
                          name={employee.name}
                        />

                        <div>
                          <strong>
                            {employee.name}
                          </strong>
                          <span>
                            {
                              employee.mobileNumber
                            }
                          </span>

                          {employee.reason && (
                            <span className="halfday-popup__meta">
                              {employee.reason}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <p className="no-absent">
                    No half day employees today
                  </p>
                )}
              </div>
            </div>
          )}

          {stat.type === "late" && (
            <div
              className="absent-popup late-popup"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="absent-popup__header">
                <h3>Late Comers</h3>
                <span>
                  {lateEmployees.length}
                </span>
              </div>

              <div className="absent-popup__list">
                {lateEmployees.length > 0 ? (
                  lateEmployees.map(
                    (employee) => (
                      <div
                        className="absent-popup__employee"
                        key={employee.id}
                      >
                        <EmployeePhoto
                          className="absent-popup__avatar"
                          src={
                            employee.profilePic
                          }
                          name={employee.name}
                        />

                        <div>
                          <strong>
                            {employee.name}
                          </strong>
                          <span>
                            {
                              employee.mobileNumber
                            }
                          </span>

                          {employee.punchInTime &&
                            employee.punchInTime !==
                              "—" && (
                              <span className="late-popup__meta">
                                Punch in:{" "}
                                {
                                  employee.punchInTime
                                }
                              </span>
                            )}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <p className="no-absent">
                    No late comers today 🎉
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

export default StatsSection;
