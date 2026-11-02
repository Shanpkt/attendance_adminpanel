import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";

import "./app.scss";

import Dashboard
  from "./pages/Dashboard/Dashboard";

import Profile
  from "./pages/Profile/Profile";

import Attendance
  from "./pages/Attendance/Attendance";

import Employees
  from "./pages/Employees/Employees";

import Settings
  from "./pages/Settings/Settings";

import CompanySettings
  from "./pages/CompanySettings/CompanySettings";

import Holidays
  from "./pages/Holidays/Holidays";

import CleanupDrive
  from "./pages/CleanupDrive/CleanupDrive";

import PunchEdit
  from "./pages/PunchEdit/PunchEdit";


function App() {

  return (

    <BrowserRouter>

      <AdminLayout>

        <Routes>

          <Route
            path="/"
            element={
              <Dashboard />
            }
          />

          <Route
            path="/dashboard"
            element={
              <Dashboard />
            }
          />

          <Route
            path="/attendance"
            element={
              <Attendance />
            }
          />

          <Route
            path="/employees"
            element={
              <Employees />
            }
          />

          <Route
            path="/profile/:employeeId"
            element={
              <Profile />
            }
          />

          <Route
            path="/profile"
            element={
              <Profile />
            }
          />

          <Route
            path="/settings"
            element={
              <Settings />
            }
          />

          <Route
            path="/company-settings"
            element={
              <CompanySettings />
            }
          />

          <Route
            path="/holidays"
            element={
              <Holidays />
            }
          />

          <Route
            path="/cleanup-drive"
            element={
              <CleanupDrive workspace="shop" />
            }
          />

          <Route
            path="/company-cleanup-drive"
            element={
              <CleanupDrive workspace="company" />
            }
          />

          <Route
            path="/punch-edit"
            element={
              <PunchEdit />
            }
          />

        </Routes>

      </AdminLayout>

    </BrowserRouter>

  );

}


export default App;
