import React, {
  useCallback,
  useState,
} from "react";

import axios from "axios";

import {
  deleteStorageFiles,
  formatFileSize,
  getStoragePathFromPublicUrl,
  listAllStorageFiles,
  listPendingFiles,
} from "../../services/cleanupDrive";

import "./CleanupDrive.scss";

const ATTENDANCE_API =
  "https://attendance-backend-hs75.onrender.com/api/attendance";

const EMPLOYEE_API =
  "https://attendance-backend-hs75.onrender.com/api/employees";

const collectUsedPaths = (attendance, employees) => {
  const used = new Set();

  attendance.forEach((record) => {
    [
      record?.punchIn?.selfieUrl,
      record?.punchOut?.selfieUrl,
    ].forEach((url) => {
      const path = getStoragePathFromPublicUrl(url);

      if (path) {
        used.add(path);
      }
    });
  });

  employees.forEach((employee) => {
    const path = getStoragePathFromPublicUrl(
      employee?.profilePic
    );

    if (path) {
      used.add(path);
    }
  });

  return used;
};

const getFileKind = (path) => {
  if (String(path).startsWith("profilepic/")) {
    return "Profile photo";
  }

  if (String(path).startsWith("pending/")) {
    return "Pending selfie";
  }

  return "Punch selfie";
};

const startOfRange = (value) => new Date(`${value}T00:00:00`);

const endOfRange = (value) => new Date(`${value}T23:59:59.999`);

const isInRange = (date, fromDate, toDate) => {
  if (!date || Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.getTime() >= startOfRange(fromDate).getTime() &&
    date.getTime() <= endOfRange(toDate).getTime()
  );
};

const getFileCreatedDate = (file) => {
  if (file?.createdAt) {
    const parsed = new Date(file.createdAt);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const stamp = String(file?.name || "").match(/^(\d{10,13})/);

  if (!stamp) {
    return null;
  }

  const value = Number(stamp[1]);

  return new Date(value < 1e12 ? value * 1000 : value);
};

const parseAttendanceDate = (record) => {
  if (record?.punchIn?.timestamp) {
    const punchDate = new Date(record.punchIn.timestamp);

    if (!Number.isNaN(punchDate.getTime())) {
      return punchDate;
    }
  }

  const value = String(record?.date || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDisplayDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  if (!value || Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const pendingFileFromUrl = (url) => {
  const path = getStoragePathFromPublicUrl(url);

  if (!path.startsWith("pending/")) {
    return null;
  }

  const name = path.split("/").pop();

  return {
    name,
    path,
    folder: "pending",
    size: 0,
    createdAt: "",
    publicUrl: url,
  };
};

function CleanupDrive() {
  const [files, setFiles] = useState([]);
  const [usedPaths, setUsedPaths] = useState(new Set());
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [mongoFromDate, setMongoFromDate] = useState("");
  const [mongoToDate, setMongoToDate] = useState("");
  const [rangeBusy, setRangeBusy] = useState(false);
  const [popup, setPopup] = useState("");
  const [rangeFiles, setRangeFiles] = useState([]);
  const [rangeAttendance, setRangeAttendance] = useState([]);

  const scanDrive = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [attendanceResponse, employeeResponse, storageFiles] =
        await Promise.all([
          axios.get(ATTENDANCE_API),
          axios.get(EMPLOYEE_API),
          listAllStorageFiles(),
        ]);

      const attendance = attendanceResponse.data?.data || [];
      const employees = employeeResponse.data?.data || [];
      const nextUsed = collectUsedPaths(attendance, employees);

      setUsedPaths(nextUsed);
      setFiles(storageFiles);
      setSelected([]);
      setMessage(
        `Found ${storageFiles.length} file${
          storageFiles.length === 1 ? "" : "s"
        } in the ATTENDANCE drive.`
      );
    } catch (scanError) {
      console.error("Cleanup drive scan error:", scanError);
      setError(
        scanError.response?.data?.message ||
          scanError.message ||
          "Unable to scan the storage drive."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFile = (path) => {
    setSelected((previous) =>
      previous.includes(path)
        ? previous.filter((item) => item !== path)
        : [...previous, path]
    );
  };

  const toggleVisible = () => {
    const visiblePaths = files.map((file) => file.path);
    const allSelected = visiblePaths.every((path) =>
      selected.includes(path)
    );

    setSelected((previous) => {
      if (allSelected) {
        return previous.filter(
          (path) => !visiblePaths.includes(path)
        );
      }

      return [...new Set([...previous, ...visiblePaths])];
    });
  };

  const validateRange = (start, end, label) => {
    if (!start || !end) {
      setError(`Select both from date and to date for ${label}.`);
      return false;
    }

    if (startOfRange(start) > endOfRange(end)) {
      setError(`From date should be before to date for ${label}.`);
      return false;
    }

    return true;
  };

  const loadRangeAttendance = async (start, end) => {
    const response = await axios.get(ATTENDANCE_API);
    const attendance = response.data?.data || [];

    return attendance.filter((record) =>
      isInRange(parseAttendanceDate(record), start, end)
    );
  };

  const previewDateRange = async () => {
    if (!validateRange(fromDate, toDate, "Supabase pending files")) {
      return;
    }

    try {
      setRangeBusy(true);
      setError("");
      setMessage("");

      const [pendingFiles, attendanceResponse] = await Promise.all([
        listPendingFiles(),
        axios.get(ATTENDANCE_API),
      ]);

      const attendance = attendanceResponse.data?.data || [];
      const byPath = new Map();

      pendingFiles.forEach((file) => {
        byPath.set(file.path, file);
      });

      attendance.forEach((record) => {
        [
          record?.punchIn?.selfieUrl,
          record?.punchOut?.selfieUrl,
        ].forEach((url) => {
          const file = pendingFileFromUrl(url);

          if (file && !byPath.has(file.path)) {
            byPath.set(file.path, file);
          }
        });
      });

      const matchedFiles = [...byPath.values()].filter((file) =>
        isInRange(getFileCreatedDate(file), fromDate, toDate)
      );

      setRangeFiles(matchedFiles);
      setPopup("storage");
    } catch (rangeError) {
      console.error("Date range preview error:", rangeError);
      setError(
        rangeError.response?.data?.message ||
          rangeError.message ||
          "Unable to list pending files for this date range."
      );
    } finally {
      setRangeBusy(false);
    }
  };

  const confirmStorageCleanup = async () => {
    try {
      setRangeBusy(true);
      setError("");

      if (rangeFiles.length > 0) {
        await deleteStorageFiles(
          rangeFiles.map((file) => file.path)
        );

        const deletedPaths = new Set(
          rangeFiles.map((file) => file.path)
        );

        setFiles((previous) =>
          previous.filter((file) => !deletedPaths.has(file.path))
        );
      }

      setPopup("");
      setRangeFiles([]);
      setMessage(
        rangeFiles.length
          ? `Deleted ${rangeFiles.length} pending file${
              rangeFiles.length === 1 ? "" : "s"
            } from Supabase.`
          : "No pending files in this range."
      );
    } catch (deleteError) {
      console.error("Pending file cleanup error:", deleteError);
      setError(
        deleteError.message ||
          "Unable to delete pending files."
      );
    } finally {
      setRangeBusy(false);
    }
  };

  const previewAttendanceRange = async () => {
    if (
      !validateRange(
        mongoFromDate,
        mongoToDate,
        "MongoDB attendance"
      )
    ) {
      return;
    }

    try {
      setRangeBusy(true);
      setError("");
      setMessage("");

      const matchedAttendance = await loadRangeAttendance(
        mongoFromDate,
        mongoToDate
      );

      setRangeAttendance(matchedAttendance);
      setPopup("mongo");
    } catch (rangeError) {
      console.error("Attendance range preview error:", rangeError);
      setError(
        rangeError.response?.data?.message ||
          rangeError.message ||
          "Unable to list attendance for this date range."
      );
    } finally {
      setRangeBusy(false);
    }
  };

  const confirmAttendanceCleanup = async () => {
    try {
      setRangeBusy(true);
      setError("");

      if (rangeAttendance.length > 0) {
        const ids = rangeAttendance
          .map((record) => record._id)
          .filter(Boolean);

        await axios.delete(ATTENDANCE_API, {
          data: { ids },
        });
      }

      setPopup("");
      setRangeFiles([]);
      setRangeAttendance([]);
      setMessage(
        `Deleted ${rangeAttendance.length} attendance record${
          rangeAttendance.length === 1 ? "" : "s"
        } from MongoDB.`
      );
    } catch (deleteError) {
      console.error("Attendance cleanup error:", deleteError);
      setError(
        deleteError.response?.data?.message ||
          deleteError.message ||
          "Unable to delete attendance records."
      );
    } finally {
      setRangeBusy(false);
    }
  };

  const closePopup = () => {
    if (rangeBusy) {
      return;
    }

    setPopup("");
  };

  return (
    <div className="cleanup-page">
      <div className="cleanup-page__header">
        <div>
          <h1>Cleanup Drive</h1>
          <p>
            Delete pending selfies or MongoDB attendance records
            by date range. Each section is separate.
          </p>
        </div>

        <button
          type="button"
          className="cleanup-scan"
          onClick={scanDrive}
          disabled={loading || rangeBusy}
        >
          {loading ? "Scanning..." : "Scan Drive"}
        </button>
      </div>

      {(error || message) && (
        <p className={error ? "cleanup-warning" : "cleanup-status"}>
          {error || message}
        </p>
      )}

      <section className="cleanup-range">
        <div>
          <h2>Supabase pending files</h2>
          <p>
            List files in the pending folder by creation date,
            then confirm in a popup before deleting them from
            Supabase.
          </p>
        </div>

        <div className="cleanup-range__fields">
          <label>
            From date
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              disabled={rangeBusy}
            />
          </label>
          <label>
            To date
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              disabled={rangeBusy}
            />
          </label>
          <button
            type="button"
            onClick={previewDateRange}
            disabled={rangeBusy || loading}
          >
            {rangeBusy && popup === "storage"
              ? "Working..."
              : "Preview pending files"}
          </button>
        </div>
      </section>

      <section className="cleanup-range cleanup-range--mongo">
        <div>
          <h2>MongoDB attendance</h2>
          <p>
            List punch records in this date range, then confirm
            in a popup before deleting them from MongoDB.
          </p>
        </div>

        <div className="cleanup-range__fields">
          <label>
            From date
            <input
              type="date"
              value={mongoFromDate}
              onChange={(event) =>
                setMongoFromDate(event.target.value)
              }
              disabled={rangeBusy}
            />
          </label>
          <label>
            To date
            <input
              type="date"
              value={mongoToDate}
              onChange={(event) =>
                setMongoToDate(event.target.value)
              }
              disabled={rangeBusy}
            />
          </label>
          <button
            type="button"
            onClick={previewAttendanceRange}
            disabled={rangeBusy || loading}
          >
            {rangeBusy && popup === "mongo"
              ? "Working..."
              : "Preview attendance"}
          </button>
        </div>
      </section>

      {files.length > 0 && (
        <div className="cleanup-table">
          <div className="cleanup-table__header">
            <label>
              <input
                type="checkbox"
                checked={
                  files.length > 0 &&
                  files.every((file) =>
                    selected.includes(file.path)
                  )
                }
                onChange={toggleVisible}
              />
              File
            </label>
            <span>Type</span>
            <span>Size</span>
            <span>Status</span>
          </div>

          {files.map((file) => {
            const inUse = usedPaths.has(file.path);

            return (
              <label
                key={file.path}
                className="cleanup-table__row"
              >
                <span className="cleanup-file">
                  <input
                    type="checkbox"
                    checked={selected.includes(file.path)}
                    onChange={() => toggleFile(file.path)}
                  />
                  {file.publicUrl ? (
                    <img
                      src={file.publicUrl}
                      alt={file.name}
                    />
                  ) : null}
                  <span>
                    <strong>{file.name}</strong>
                    <small>{file.path}</small>
                  </span>
                </span>
                <span>{getFileKind(file.path)}</span>
                <span>{formatFileSize(file.size)}</span>
                <span
                  className={
                    inUse
                      ? "cleanup-badge cleanup-badge--used"
                      : "cleanup-badge"
                  }
                >
                  {inUse ? "In use" : "Unused"}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {popup === "storage" && (
        <CleanupPopup
          title="Supabase pending files"
          subtitle={`${rangeFiles.length} file${
            rangeFiles.length === 1 ? "" : "s"
          } in pending from ${fromDate} to ${toDate}.`}
          confirmLabel={
            rangeFiles.length
              ? "Delete pending files"
              : "Close"
          }
          busy={rangeBusy}
          onClose={closePopup}
          onConfirm={
            rangeFiles.length
              ? confirmStorageCleanup
              : closePopup
          }
        >
          {rangeFiles.length === 0 ? (
            <p className="cleanup-popup__empty">
              No pending files fall in this date range.
            </p>
          ) : (
            rangeFiles.map((file) => (
              <div
                key={file.path}
                className="cleanup-popup__item"
              >
                {file.publicUrl ? (
                  <img src={file.publicUrl} alt={file.name} />
                ) : null}
                <div>
                  <strong>{file.name}</strong>
                  <span>{file.path}</span>
                  <span>
                    Created{" "}
                    {formatDisplayDate(getFileCreatedDate(file))}
                  </span>
                </div>
              </div>
            ))
          )}
        </CleanupPopup>
      )}

      {popup === "mongo" && (
        <CleanupPopup
          title="MongoDB attendance"
          subtitle={`${rangeAttendance.length} attendance record${
            rangeAttendance.length === 1 ? "" : "s"
          } from ${mongoFromDate} to ${mongoToDate}.`}
          confirmLabel={
            rangeAttendance.length
              ? "Delete attendance records"
              : "Close"
          }
          busy={rangeBusy}
          onClose={closePopup}
          onConfirm={
            rangeAttendance.length
              ? confirmAttendanceCleanup
              : closePopup
          }
        >
          {rangeAttendance.length === 0 ? (
            <p className="cleanup-popup__empty">
              No attendance records fall in this date range.
            </p>
          ) : (
            rangeAttendance.map((record) => (
              <div
                key={record._id}
                className="cleanup-popup__item"
              >
                <div>
                  <strong>
                    {record.mobileNumber || "Unknown"}
                  </strong>
                  <span>Date: {record.date || "—"}</span>
                  <span>
                    Punch in:{" "}
                    {formatDisplayDate(record.punchIn?.timestamp)}
                  </span>
                  <span>
                    Status: {record.status || "—"}
                  </span>
                </div>
              </div>
            ))
          )}
        </CleanupPopup>
      )}
    </div>
  );
}

function CleanupPopup({
  title,
  subtitle,
  confirmLabel,
  busy,
  onClose,
  onConfirm,
  children,
}) {
  return (
    <div
      className="cleanup-popup-overlay"
      onClick={onClose}
    >
      <div
        className="cleanup-popup"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cleanup-popup__header">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Close
          </button>
        </div>
        <div className="cleanup-popup__body">
          {children}
        </div>
        <div className="cleanup-popup__footer">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cleanup-popup__confirm"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CleanupDrive;
