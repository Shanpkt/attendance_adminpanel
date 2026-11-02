import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
} from "@mui/material";

import {
  EMPLOYEES_API,
  employeeByIdApi,
} from "../../api";
import { useAdminMode } from "../../context/AdminModeContext";

// ==========================================
// EMPTY FORM
// ==========================================

const emptyEmployeeForm = {

  name: "",

  mobileNumber: "",

  email: "",

  joiningDate: "",

  workspace: "shop",

};

// ==========================================
// EMPLOYEE INFO POPUP
// ==========================================

function EmployeeInfoPop({
  open,
  onClose,
  employee,
  onEmployeeSaved,
}) {
  const { mode } = useAdminMode();

  // ========================================
  // FORM
  // ========================================

  const [
    employeeForm,
    setEmployeeForm,
  ] = useState({
    ...emptyEmployeeForm,
  });

  // ========================================
  // SUBMITTING
  // ========================================

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  // ========================================
  // ERROR
  // ========================================

  const [
    formError,
    setFormError,
  ] = useState("");

  // ========================================
  // EDIT MODE
  // ========================================

  const isEditMode =
    Boolean(employee);

  // ========================================
  // LOAD DATA
  // ========================================

  useEffect(() => {

    if (
      open &&
      employee
    ) {

      setEmployeeForm({

        name:
          employee.name ||
          "",

        mobileNumber:
          employee.mobileNumber ||
          employee.mobile ||
          "",

        email:
          employee.email ||
          "",

        joiningDate:
          employee.joiningDate
            ? String(
                employee.joiningDate
              ).substring(
                0,
                10
              )
            : "",

        workspace:
          employee.workspace === "company"
            ? "company"
            : "shop",

      });

      setFormError("");

    }

    if (
      open &&
      !employee
    ) {

      setEmployeeForm({
        ...emptyEmployeeForm,
        workspace: mode === "company" ? "company" : "shop",
      });

      setFormError("");

    }

  }, [
    open,
    employee,
    mode,
  ]);

  // ========================================
  // FORM CHANGE
  // ========================================

  const handleFormChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;

      setEmployeeForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );

      setFormError("");

    };

  // ========================================
  // CLOSE
  // ========================================

  const handleClose =
    () => {

      if (submitting) {
        return;
      }

      setEmployeeForm({
        ...emptyEmployeeForm,
      });

      setFormError("");

      onClose();

    };

  // ========================================
  // VALIDATION
  // ========================================

  const validateForm =
    () => {

      // NAME

      if (
        !employeeForm.name.trim()
      ) {

        setFormError(
          "Please enter employee name."
        );

        return false;

      }

      // MOBILE

      if (
        !employeeForm.mobileNumber.trim()
      ) {

        setFormError(
          "Please enter mobile number."
        );

        return false;

      }

      if (
        !/^\d{10}$/.test(
          employeeForm.mobileNumber.trim()
        )
      ) {

        setFormError(
          "Mobile number must be exactly 10 digits."
        );

        return false;

      }

      // EMAIL

      if (
        employeeForm.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          employeeForm.email.trim()
        )
      ) {

        setFormError(
          "Please enter a valid email address."
        );

        return false;

      }

      // JOINING DATE

      if (
        !employeeForm.joiningDate
      ) {

        setFormError(
          "Please select joining date."
        );

        return false;

      }

      return true;

    };

  // ========================================
  // SAVE EMPLOYEE
  // ========================================

  const handleSaveEmployee =
    async () => {

      const isValid =
        validateForm();

      if (!isValid) {
        return;
      }

      try {

        setSubmitting(true);

        setFormError("");

        const requestData = {

          name:
            employeeForm.name.trim(),

          mobileNumber:
            employeeForm.mobileNumber.trim(),

          email:
            employeeForm.email.trim(),

          joiningDate:
            employeeForm.joiningDate,

          workspace:
            employeeForm.workspace === "company"
              ? "company"
              : "shop",

        };

        let response;

        // ==================================
        // EDIT
        // ==================================

        if (isEditMode) {

          const employeeId =
            employee._id ||
            employee.id;

          if (!employeeId) {

            setFormError(
              "Employee ID not found."
            );

            return;

          }

          response =
            await axios.put(
              employeeByIdApi(employeeId),
              requestData
            );

        }

        // ==================================
        // CREATE
        // ==================================

        else {

          response =
            await axios.post(
              EMPLOYEES_API,
              requestData
            );

        }

        // ==================================
        // GET SAVED EMPLOYEE
        // ==================================

        const savedEmployee =
          response.data?.data;

        // ==================================
        // SEND TO PARENT
        // ==================================

        if (
          onEmployeeSaved
        ) {

          onEmployeeSaved(
            savedEmployee
          );

        }

        // ==================================
        // RESET
        // ==================================

        setEmployeeForm({
          ...emptyEmployeeForm,
        });

        // ==================================
        // CLOSE
        // ==================================

        onClose();

      }
      catch (error) {

        console.error(
          "Employee save error:",
          error
        );

        setFormError(
          error.response?.data?.message ||
          (
            isEditMode
              ? "Unable to update employee. Please try again."
              : "Unable to create employee. Please try again."
          )
        );

      }
      finally {

        setSubmitting(false);

      }

    };

  // ========================================
  // UI
  // ========================================

  return (

    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        className:
          "create-employee-dialog",
      }}
    >

      <DialogTitle
        className=
          "create-employee-dialog__title"
      >

        <div>

          <h2>

            {isEditMode
              ? "Edit Employee"
              : "Create Employee"}

          </h2>

          <p>

            {isEditMode
              ? "Update employee information"
              : "Add employee information"}

          </p>

        </div>

        <IconButton
          onClick={handleClose}
          disabled={submitting}
          aria-label="Close"
        >

          <span className="popup-close">
            ×
          </span>

        </IconButton>

      </DialogTitle>

      <DialogContent>

        <div className="employee-form">

          <div className="employee-form__section">

            <h3>
              Employee Information
            </h3>

            <div className="employee-form__grid">

              {/* NAME */}

              <TextField
                fullWidth
                required
                label="Full Name"
                name="name"
                value={
                  employeeForm.name
                }
                onChange={
                  handleFormChange
                }
                placeholder="Enter full name"
              />

              {/* MOBILE */}

              <TextField
                fullWidth
                required
                label="Mobile Number"
                name="mobileNumber"
                value={
                  employeeForm.mobileNumber
                }
                onChange={
                  handleFormChange
                }
                placeholder="10 digit mobile number"
                inputProps={{
                  maxLength: 10,
                  inputMode: "numeric",
                }}
              />

              {/* EMAIL */}

              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={
                  employeeForm.email
                }
                onChange={
                  handleFormChange
                }
                placeholder="Enter email address"
              />

              {/* JOINING DATE */}

              <TextField
                fullWidth
                required
                type="date"
                label="Joining Date"
                name="joiningDate"
                value={
                  employeeForm.joiningDate
                }
                onChange={
                  handleFormChange
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />

              {/* WORKSPACE */}

              <div className="employee-workspace-field">
                <p className="employee-workspace-field__label">
                  Workspace
                </p>
                <div
                  className="employee-workspace-field__options"
                  role="radiogroup"
                  aria-label="Workspace"
                >
                  <label className="employee-workspace-option">
                    <input
                      type="radio"
                      name="workspace"
                      value="shop"
                      checked={
                        employeeForm.workspace === "shop"
                      }
                      onChange={handleFormChange}
                    />
                    <span>Shop</span>
                  </label>
                  <label className="employee-workspace-option">
                    <input
                      type="radio"
                      name="workspace"
                      value="company"
                      checked={
                        employeeForm.workspace === "company"
                      }
                      onChange={handleFormChange}
                    />
                    <span>Company</span>
                  </label>
                </div>
              </div>

            </div>

          </div>

          {formError && (

            <div
              className=
                "employee-form-error"
            >
              {formError}
            </div>

          )}

        </div>

      </DialogContent>

      <DialogActions
        className=
          "create-employee-dialog__actions"
      >

        <Button
          onClick={handleClose}
          disabled={submitting}
          className=
            "cancel-employee-button"
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={
            handleSaveEmployee
          }
          disabled={submitting}
          className=
            "save-employee-button"
        >

          {submitting
            ? (
                isEditMode
                  ? "Updating..."
                  : "Creating..."
              )
            : (
                isEditMode
                  ? "Update Employee"
                  : "Create Employee"
              )
          }

        </Button>

      </DialogActions>

    </Dialog>

  );

}

export default EmployeeInfoPop;