import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  useNavigate,
} from "react-router-dom";

import EmployeeInfoPop from "./employee_info_pop";

import "./Employees.scss";

// ==========================================
// MATERIAL UI
// ==========================================

import IconButton from "@mui/material/IconButton";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";


// ==========================================
// API URL
// ==========================================

const API_URL =
  "https://attendance-backend-hs75.onrender.com/api/employees";


// ==========================================
// GET INITIALS
// ==========================================

const getInitials = (name) => {

  if (!name) {
    return "U";
  }

  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

};


// ==========================================
// FORMAT DATE
// ==========================================

const formatDate = (date) => {

  if (!date) {
    return "—";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "—";
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

};


// ==========================================
// EMPLOYEES PAGE
// ==========================================

function Employees() {

  // ========================================
  // NAVIGATION
  // ========================================

  const navigate =
    useNavigate();


  // ========================================
  // EMPLOYEES
  // ========================================

  const [
    employees,
    setEmployees,
  ] = useState([]);


  // ========================================
  // SEARCH
  // ========================================

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");


  // ========================================
  // LOADING
  // ========================================

  const [
    loading,
    setLoading,
  ] = useState(true);


  // ========================================
  // ERROR
  // ========================================

  const [
    error,
    setError,
  ] = useState("");


  // ========================================
  // POPUP
  // ========================================

  const [
    openEmployeePopup,
    setOpenEmployeePopup,
  ] = useState(false);


  // ========================================
  // SELECTED EMPLOYEE
  // ========================================

  const [
    selectedEmployee,
    setSelectedEmployee,
  ] = useState(null);


  // ========================================
  // FETCH EMPLOYEES
  // ========================================

  const fetchEmployees =
    async () => {

      try {

        setLoading(true);

        setError("");

        const response =
          await axios.get(
            API_URL
          );

        console.log(
          "Employees API response:",
          response.data
        );

        const data =
          response.data?.data || [];

        setEmployees(data);

      }
      catch (err) {

        console.error(
          "Error fetching employees:",
          err
        );

        setError(
          "Unable to fetch employee data."
        );

      }
      finally {

        setLoading(false);

      }

    };


  // ========================================
  // FETCH ON PAGE LOAD
  // ========================================

  useEffect(() => {

    fetchEmployees();

  }, []);


  // ========================================
  // SEARCH FILTER
  // ========================================

  const filteredEmployees =
    employees.filter(
      (employee) => {

        const name =
          employee.name ||
          employee.employeeName ||
          "";

        const mobile =
          employee.mobileNumber ||
          employee.mobile ||
          "";

        const search =
          searchTerm
            .toLowerCase()
            .trim();

        return (
          name
            .toLowerCase()
            .includes(search) ||

          mobile
            .toString()
            .includes(search)
        );

      }
    );


  // ========================================
  // OPEN CREATE POPUP
  // ========================================

  const handleOpenCreateEmployee =
    () => {

      setSelectedEmployee(
        null
      );

      setOpenEmployeePopup(
        true
      );

    };


  // ========================================
  // OPEN EDIT POPUP
  // ========================================

  const handleEditEmployee =
    (employee) => {

      console.log(
        "Opening employee for edit:",
        employee
      );

      setSelectedEmployee(
        employee
      );

      setOpenEmployeePopup(
        true
      );

    };


  // ========================================
  // OPEN PROFILE
  // ========================================

  const handleEmployeeClick =
    (employee) => {

      const employeeId =
        employee._id ||
        employee.id;

      console.log(
        "Opening employee profile:",
        employeeId
      );

      if (!employeeId) {

        console.error(
          "Employee ID not found:",
          employee
        );

        return;

      }

      navigate(
        `/profile/${employeeId}`
      );

    };


  // ========================================
  // CLOSE POPUP
  // ========================================

  const handleCloseEmployeePopup =
    () => {

      setOpenEmployeePopup(
        false
      );

      setSelectedEmployee(
        null
      );

    };


  // ========================================
  // EMPLOYEE CREATED / UPDATED
  // ========================================

  const handleEmployeeSaved =
    (savedEmployee) => {

      console.log(
        "Employee saved:",
        savedEmployee
      );

      if (!savedEmployee) {

        fetchEmployees();

        return;

      }


      // ======================================
      // EDIT
      // ======================================

      if (selectedEmployee) {

        setEmployees(
          (previous) =>

            previous.map(
              (employee) => {

                const employeeId =
                  employee._id ||
                  employee.id;

                const savedId =
                  savedEmployee._id ||
                  savedEmployee.id;

                if (
                  employeeId ===
                  savedId
                ) {

                  return savedEmployee;

                }

                return employee;

              }
            )
        );

      }


      // ======================================
      // CREATE
      // ======================================

      else {

        setEmployees(
          (previous) => [

            savedEmployee,

            ...previous,

          ]
        );

      }


      setSelectedEmployee(
        null
      );

    };


  // ========================================
  // CLEAR SEARCH
  // ========================================

  const handleClearSearch =
    () => {

      setSearchTerm("");

    };


  // ========================================
  // DELETE EMPLOYEE
  // ========================================

  const handleDeleteEmployee =
    async (employee) => {

      console.log(
        "Delete employee:",
        employee
      );


      const employeeName =
        employee.name ||
        employee.employeeName ||
        "this employee";


      const confirmDelete =
        window.confirm(
          `Are you sure you want to delete ${employeeName}?`
        );


      if (!confirmDelete) {

        return;

      }


      try {

        const employeeId =
          employee._id ||
          employee.id;


        if (!employeeId) {

          alert(
            "Employee ID not found."
          );

          return;

        }


        await axios.delete(
          `${API_URL}/${employeeId}`
        );


        setEmployees(
          (previous) =>

            previous.filter(
              (item) => {

                const itemId =
                  item._id ||
                  item.id;

                return (
                  itemId !==
                  employeeId
                );

              }
            )
        );


        console.log(
          "Employee deleted successfully."
        );

      }
      catch (err) {

        console.error(
          "Delete employee error:",
          err
        );

        alert(
          err.response?.data?.message ||
          "Unable to delete employee."
        );

      }

    };


  // ========================================
  // UI
  // ========================================

  return (

    <div className="employees-page">


      {/* ======================================
          HEADER
      ====================================== */}

      <div className="employees-page__header">

        <div className="employees-title">

          <div className="employees-title__icon">
            👥
          </div>

          <div>

            <h1>
              Employee List
            </h1>

            <p>
              View and manage employees
            </p>

          </div>

        </div>


        <div className="employees-header-actions">

          <div className="employee-count">

            <span>
              Total Employees
            </span>

            <strong>
              {employees.length}
            </strong>

          </div>


          <button
            type="button"
            className="create-employee-button"
            onClick={
              handleOpenCreateEmployee
            }
          >

            <span className="create-button-icon">
              +
            </span>

            Create Employee

          </button>

        </div>

      </div>


      {/* ======================================
          SEARCH
      ====================================== */}

      <div className="employees-actions">

        <div className="employee-search">

          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search employee name or mobile number..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          {searchTerm && (

            <button
              type="button"
              className="search-clear"
              onClick={
                handleClearSearch
              }
            >
              ×
            </button>

          )}

        </div>

      </div>


      {/* ======================================
          TABLE
      ====================================== */}

      <div className="employees-table-card">

        <div className="employees-table-wrapper">


          {/* ====================================
              TABLE HEADER
          ==================================== */}

          <div className="employees-table__header">

            <div className="column-number">
              #
            </div>

            <div className="column-employee">
              Employee
            </div>

            <div className="column-mobile">
              Mobile Number
            </div>

            <div className="column-date">
              Joined Date
            </div>

            <div className="column-status">
              Status
            </div>

            <div className="column-actions">
              Actions
            </div>

          </div>


          {/* ====================================
              LOADING
          ==================================== */}

          {loading && (

            <div className="no-employees">

              <div className="no-employees__icon">
                ⏳
              </div>

              <h3>
                Loading employees...
              </h3>

            </div>

          )}


          {/* ====================================
              ERROR
          ==================================== */}

          {!loading &&
            error && (

              <div className="no-employees">

                <div className="no-employees__icon">
                  ⚠️
                </div>

                <h3>
                  {error}
                </h3>

                <button
                  type="button"
                  className="retry-button"
                  onClick={
                    fetchEmployees
                  }
                >
                  Try Again
                </button>

              </div>

            )}


          {/* ====================================
              EMPLOYEES
          ==================================== */}

          {!loading &&
            !error &&
            filteredEmployees.length > 0 &&

            filteredEmployees.map(
              (
                employee,
                index
              ) => {

                const name =
                  employee.name ||
                  employee.employeeName ||
                  "Unknown Employee";


                const mobile =
                  employee.mobileNumber ||
                  employee.mobile ||
                  "N/A";


                return (

                  <div
                    className="employees-table__row"
                    key={
                      employee._id ||
                      employee.id ||
                      index
                    }
                  >


                    {/* ==========================
                        NUMBER
                    ========================== */}

                    <div className="column-number">

                      {index + 1}

                    </div>


                    {/* ==========================
                        EMPLOYEE
                    ========================== */}

                    <div
                      className="column-employee employee-clickable"
                      onClick={() =>
                        handleEmployeeClick(
                          employee
                        )
                      }
                      title="View employee profile"
                    >

                      <div className="employee-avatar">

                        {
                          getInitials(
                            name
                          )
                        }

                      </div>


                      <div className="employee-info">

                        <span className="employee-name">

                          {
                            name
                          }

                        </span>


                        {employee.email && (

                          <span className="employee-email">

                            {
                              employee.email
                            }

                          </span>

                        )}

                      </div>

                    </div>


                    {/* ==========================
                        MOBILE
                    ========================== */}

                    <div className="column-mobile">

                      {
                        mobile
                      }

                    </div>


                    {/* ==========================
                        DATE
                    ========================== */}

                    <div className="column-date">

                      {
                        formatDate(
                          employee.joiningDate ||
                          employee.createdAt
                        )
                      }

                    </div>


                    {/* ==========================
                        STATUS
                    ========================== */}

                    <div className="column-status">

                      <span className="status status--active">

                        <span className="status-dot"></span>

                        Active

                      </span>

                    </div>


                    {/* ==========================
                        ACTIONS
                    ========================== */}

                    <div className="column-actions">

                      {/* ======================
                          EDIT
                      ====================== */}

                      <IconButton
                        type="button"
                        className="employee-edit-button"
                        onClick={(event) => {

                          event.stopPropagation();

                          handleEditEmployee(
                            employee
                          );

                        }}
                        title="Edit employee"
                        aria-label="Edit employee"
                      >

                        <EditIcon />

                      </IconButton>


                      {/* ======================
                          DELETE
                      ====================== */}

                      <IconButton
                        type="button"
                        className="employee-delete-button"
                        onClick={(event) => {

                          event.stopPropagation();

                          handleDeleteEmployee(
                            employee
                          );

                        }}
                        title="Delete employee"
                        aria-label="Delete employee"
                      >

                        <DeleteIcon />

                      </IconButton>

                    </div>

                  </div>

                );

              }

            )}


          {/* ====================================
              NO SEARCH RESULTS
          ==================================== */}

          {!loading &&
            !error &&
            employees.length > 0 &&
            filteredEmployees.length === 0 && (

              <div className="no-employees">

                <div className="no-employees__icon">
                  🔍
                </div>

                <h3>
                  No employees found
                </h3>

                <p>
                  No employee matches "
                  {searchTerm}
                  ".
                </p>

              </div>

            )}


          {/* ====================================
              NO EMPLOYEES
          ==================================== */}

          {!loading &&
            !error &&
            employees.length === 0 && (

              <div className="no-employees">

                <div className="no-employees__icon">
                  👥
                </div>

                <h3>
                  No employees
                </h3>

                <p>
                  No employees have been
                  added yet.
                </p>

                <button
                  type="button"
                  className="empty-create-button"
                  onClick={
                    handleOpenCreateEmployee
                  }
                >
                  + Create Employee
                </button>

              </div>

            )}

        </div>


        {/* ======================================
            FOOTER
        ====================================== */}

        {!loading &&
          !error &&
          employees.length > 0 && (

            <div className="employees-table__footer">

              <span>

                Showing:

                <strong>
                  {" "}
                  {filteredEmployees.length}
                </strong>

                {" "}of{" "}

                <strong>
                  {employees.length}
                </strong>

                {" "}
                Employees

              </span>

            </div>

          )}

      </div>


      {/* ======================================
          CREATE / EDIT POPUP
      ====================================== */}

      <EmployeeInfoPop

        open={
          openEmployeePopup
        }

        onClose={
          handleCloseEmployeePopup
        }

        employee={
          selectedEmployee
        }

        onEmployeeSaved={
          handleEmployeeSaved
        }

      />

    </div>

  );

}


export default Employees;