import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Sidebar from "./components/sidebar/sidebar";

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

      <div className="admin-layout">

        {/* SIDEBAR */}

        <Sidebar />


        {/* CONTENT */}

        <main className="admin-content">

          <Routes>

            {/* DASHBOARD */}

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


            {/* ATTENDANCE */}

            <Route
              path="/attendance"
              element={
                <Attendance />
              }
            />


            {/* EMPLOYEES */}

            <Route
              path="/employees"
              element={
                <Employees />
              }
            />


            {/* EMPLOYEE PROFILE */}

            <Route
              path="/profile/:employeeId"
              element={
                <Profile />
              }
            />


            {/* OPTIONAL OLD PROFILE ROUTE */}

            <Route
              path="/profile"
              element={
                <Profile />
              }
            />


            {/* SETTINGS */}

            <Route
              path="/settings"
              element={
                <Settings />
              }
            />

          </Routes>

        </main>

      </div>

    </BrowserRouter>

  );

}


export default App;