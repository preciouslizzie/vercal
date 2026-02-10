import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FiSettings } from 'react-icons/fi';
import { TooltipComponent } from '@syncfusion/ej2-react-popups';

import { Navbar, Footer, Sidebar, ThemeSettings } from './components';
import {
  Kanban,
  Line, Area, Bar, Pie, Financial, ColorPicker,
  ColorMapping, Pyramid, Stacked,
} from './pages';

import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import Sermons from './pages/Sermons';
import Donations from './pages/Donations';
import Members from './pages/Members';
import Events from './pages/Events';
import Blogs from './pages/Blogs';
import VolunteerDashboard from './pages/Volunteer/VolunteerDashboard';

import AdminProtectedRoute from './components/AdminProtectedRoute';
import { useStateContext } from './contexts/ContextProvider';

import './App.css';

// 🔹 RENAMED: this is a LAYOUT, not the Dashboard page
const AdminLayout = () => {
  const {
    activeMenu,
    currentColor,
    themeSettings,
    setThemeSettings,
  } = useStateContext();

  return (
    <div className="flex relative dark:bg-main-dark-bg">
      {/* Settings Button */}
      <div className="fixed right-4 bottom-4 z-50">
        <TooltipComponent content="Settings" position="Top">
          <button
            type="button"
            onClick={() => setThemeSettings(true)}
            style={{ background: currentColor }}
            className="text-3xl text-white p-3 rounded-full hover:drop-shadow-xl"
          >
            <FiSettings />
          </button>
        </TooltipComponent>
      </div>

      {/* Sidebar */}
      {activeMenu && (
        <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <div className={`min-h-screen w-full ${activeMenu ? 'md:ml-72' : ''}`}>
        <Navbar />
        {themeSettings && <ThemeSettings />}

        <div className="p-4">
          <Routes>
            <Route index element={<Sermons />} />
            <Route path="sermons" element={<Sermons />} />
            <Route path="donations" element={<Donations />} />
            <Route path="volunteer" element={<VolunteerDashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="adminLogin" element={<AdminLogin />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="kanban" element={<Kanban />} />
            <Route path="events" element={<Events />} />
            <Route path="color-picker" element={<ColorPicker />} />

            {/* Charts */}
            <Route path="line" element={<Line />} />
            <Route path="area" element={<Area />} />
            <Route path="bar" element={<Bar />} />
            <Route path="pie" element={<Pie />} />
            <Route path="financial" element={<Financial />} />
            <Route path="color-mapping" element={<ColorMapping />} />
            <Route path="pyramid" element={<Pyramid />} />
            <Route path="stacked" element={<Stacked />} />
          </Routes>

          <Footer />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const { setCurrentColor, setCurrentMode, currentMode } = useStateContext();

  useEffect(() => {
    const color = localStorage.getItem('colorMode');
    const mode = localStorage.getItem('themeMode');

    if (color && mode) {
      setCurrentColor(color);
      setCurrentMode(mode);
    }
  }, [setCurrentColor, setCurrentMode]);

  return (
    <div className={currentMode === 'Dark' ? 'dark' : ''}>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC */}
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />

          {/* ADMIN ONLY */}
          <Route
            path="/dashboard/*"
            element={(
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
                          )}
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
