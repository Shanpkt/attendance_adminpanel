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

        </Routes>

      </AdminLayout>

    </BrowserRouter>

  );

}


export default App;
