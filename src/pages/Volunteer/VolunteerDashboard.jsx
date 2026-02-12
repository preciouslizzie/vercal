import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import VolunteerSignup from './VolunteerSignup';
import VolunteerSchedule from './VolunteerSchedule';
import VolunteerAnnouncements from './VolunteerAnnouncements';
import VolunteerDiscussion from './VolunteerDiscussion';
import Hours from './Hours';
import AdminTab from './AdminTab';

export default function VolunteerDashboard() {
  const [tab, setTab] = useState('overview');
  const [roles, setRoles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [hoursReport, setHoursReport] = useState({ week: 0, month: 0, year: 0 });
  const isAdmin = true; // keep current behaviour; replace with real auth in future

  useEffect(() => {
    API.getVolunteerRoles().then((res) => setRoles(res.data)).catch(() => {});
    API.getMySchedule().then((res) => setSchedules(res.data)).catch(() => {});
    API.get('/announcements').then((res) => setAnnouncements(res.data)).catch(() => {});
    API.get('/volunteer/hours-worked', { params: { period: 'week' } })
      .then((res) => setHoursReport((h) => ({ ...h, week: res.data.total_hours })))
      .catch(() => {});
    API.get('/volunteer/hours-worked', { params: { period: 'month' } })
      .then((res) => setHoursReport((h) => ({ ...h, month: res.data.total_hours })))
      .catch(() => {});
    API.get('/volunteer/hours-worked', { params: { period: 'year' } })
      .then((res) => setHoursReport((h) => ({ ...h, year: res.data.total_hours })))
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Volunteer Hub</h1>
          <p className="text-sm text-gray-500">Manage roles, schedules, announcements and reports</p>
        </div>

        <div className="flex items-center gap-3">
          <nav className="hidden md:flex bg-white shadow rounded-full p-1">
            {['overview','schedule','announcements','discussions','reports','admin'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full text-sm ${tab===t? 'bg-teal-500 text-white' : 'text-gray-600'}`}
              >
                {capitalize(t)}
              </button>
            ))}
          </nav>

          <div className="md:hidden">
            <select value={tab} onChange={(e) => setTab(e.target.value)} className="input">
              <option value="overview">Overview</option>
              <option value="schedule">Schedule</option>
              <option value="announcements">Announcements</option>
              <option value="discussions">Discussions</option>
              <option value="reports">Reports</option>
              {isAdmin && <option value="admin">Admin</option>}
            </select>
          </div>
        </div>
      </header>

      {tab === 'overview' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard 
                title="Available Roles" 
                value={roles.length} 
                subtitle="Ready to apply" 
                color="teal"
              />
              <StatCard 
                title="My Schedules" 
                value={schedules.length} 
                subtitle="Assigned shifts" 
                color="blue"
              />
              <StatCard 
                title="Announcements" 
                value={announcements.length} 
                subtitle="Unread messages" 
                color="purple"
              />
              <StatCard 
                title="Hours This Week" 
                value={`${hoursReport.week} hrs`} 
                subtitle="Your contribution" 
                color="green"
              />
            </div>

            <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
              <h3 className="font-semibold mb-4 text-lg">🚀 Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => setTab('schedule')} className="bg-teal-500 hover:bg-teal-600 text-white py-3 px-4 rounded-lg font-medium transition">
                  📅 View Schedule
                </button>
                <button onClick={() => setTab('announcements')} className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition">
                  📢 Announcements
                </button>
                <button onClick={() => setTab('discussions')} className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium transition">
                  💬 Discussions
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
              <h3 className="font-semibold mb-4 text-lg">📰 Latest Announcements</h3>
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">No announcements yet. Check back soon!</p>
                ) : (
                  announcements.slice(0, 5).map((a) => (
                    <div key={a.id} className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-teal-300 hover:shadow transition">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <strong className="text-sm flex-1 text-gray-800">{a.title}</strong>
                        <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded whitespace-nowrap">
                          {a.role || 'All'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{a.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{a.created_at?.split('T')[0]}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg shadow p-4 hover:shadow-lg transition border border-teal-200">
              <h4 className="font-semibold mb-4 text-teal-900"> Apply for a Role</h4>
              <VolunteerSignup roles={roles} />
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 hover:shadow-lg transition border border-blue-200">
              <h4 className="font-semibold mb-4 text-blue-900"> Hours Summary</h4>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="py-2 px-2 bg-white rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">Week</p>
                  <p className="text-lg font-bold text-blue-900">{hoursReport.week}h</p>
                </div>
                <div className="py-2 px-2 bg-white rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">Month</p>
                  <p className="text-lg font-bold text-blue-900">{hoursReport.month}h</p>
                </div>
                <div className="py-2 px-2 bg-white rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">Year</p>
                  <p className="text-lg font-bold text-blue-900">{hoursReport.year}h</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4 hover:shadow-lg transition border border-purple-200">
              <h4 className="font-semibold mb-3 text-purple-900">💡 Tip</h4>
              <p className="text-sm text-purple-800">
                Stay updated with announcements and manage your schedule efficiently by exploring each section of the hub.
              </p>
            </div>
          </aside>
        </section>
      )}

      {tab === 'schedule' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-4">My Schedule</h3>
          <VolunteerSchedule />
        </div>
      )}

      {tab === 'announcements' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-4">Announcements</h3>
          <VolunteerAnnouncements />
        </div>
      )}

      {tab === 'discussions' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-4">Discussions</h3>
          <VolunteerDiscussion />
        </div>
      )}

      {tab === 'reports' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-4">Hours Report</h3>
          <Hours />
        </div>
      )}

      {tab === 'admin' && isAdmin && (
        <AdminTab />
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color = 'teal' }) {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 bg-white shadow hover:shadow-lg transition ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs mt-2 opacity-60">{subtitle}</p>
        </div>
        <div className="text-4xl ml-4">{icon}</div>
      </div>
    </div>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
