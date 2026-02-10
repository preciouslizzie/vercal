import React, { useEffect, useState } from 'react';
import * as adminAPI from '../../api/adminApi';

export default function AdminTab() {
  const [managementSection, setManagementSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Stats
  const [stats, setStats] = useState({
    pendingApplications: 0,
    totalRoles: 0,
    scheduledEvents: 0,
    announcements: 0,
    groups: 0,
    hoursLogged: 0,
  });

  // Volunteers State
  const [applications, setApplications] = useState([]);

  // Roles State
  const [roles, setRoles] = useState([]);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', availability_required: '' });

  // Schedules State
  const [schedules, setSchedules] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ role_id: '', date: '', time_start: '', time_end: '', location: '' });

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', role_id: '', priority: 'normal' });

  // Groups State
  const [groups, setGroups] = useState([]);

  // Attendance State
  const [attendance, setAttendance] = useState([]);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    volunteer_id: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [apps, rolesRes, schedRes, annoRes, groupsRes, attRes] = await Promise.all([
        adminAPI.getApplications(),
        adminAPI.getRoles(),
        adminAPI.getSchedules(),
        adminAPI.getAnnouncements(),
        adminAPI.getGroups(),
        adminAPI.getAllAttendance(),
      ]);

      setStats({
        pendingApplications: apps.data?.filter(a => a.status !== 'approved').length || 0,
        totalRoles: rolesRes.data?.length || 0,
        scheduledEvents: schedRes.data?.length || 0,
        announcements: annoRes.data?.length || 0,
        groups: groupsRes.data?.length || 0,
        hoursLogged: attRes.data?.reduce((sum, a) => sum + (a.hours_worked || 0), 0) || 0,
      });
    } catch (err) {
      console.error('[AdminTab Stats]', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSection = async (section) => {
    try {
      setLoading(true);
      setError('');

      if (section === 'volunteers') {
        const res = await adminAPI.getApplications();
        setApplications(res.data || []);
      } else if (section === 'roles') {
        const res = await adminAPI.getRoles();
        setRoles(res.data || []);
      } else if (section === 'schedules') {
        const [schedRes, rolesRes] = await Promise.all([
          adminAPI.getSchedules(),
          adminAPI.getRoles(),
        ]);
        setSchedules(schedRes.data || []);
        setRoles(rolesRes.data || []);
      } else if (section === 'announcements') {
        const [annoRes, rolesRes] = await Promise.all([
          adminAPI.getAnnouncements(),
          adminAPI.getRoles(),
        ]);
        setAnnouncements(annoRes.data || []);
        setRoles(rolesRes.data || []);
      } else if (section === 'groups') {
        const res = await adminAPI.getGroups();
        setGroups(res.data || []);
      } else if (section === 'attendance') {
        const res = await adminAPI.getAllAttendance();
        setAttendance(res.data || []);
      }

      setManagementSection(section);
    } catch (err) {
      setError('Failed to load ' + section + ': ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // HANDLERS
  const handleApproveApp = async (appId) => {
    try {
      await adminAPI.approveApplication(appId);
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: 'approved' } : app))
      );
      loadStats();
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return alert('Role name required');
    try {
      const res = await adminAPI.createRole(roleForm);
      setRoles((prev) => [...prev, res.data]);
      setRoleForm({ name: '', availability_required: '' });
      setShowRoleForm(false);
      loadStats();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Delete?')) return;
    try {
      await adminAPI.deleteRole(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
      loadStats();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.role_id || !scheduleForm.date || !scheduleForm.time_start) {
      return alert('Role, date, time required');
    }
    try {
      const res = await adminAPI.createSchedule(scheduleForm);
      setSchedules((prev) => [...prev, res.data]);
      setScheduleForm({ role_id: '', date: '', time_start: '', time_end: '', location: '' });
      setShowScheduleForm(false);
      loadStats();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Delete?')) return;
    try {
      await adminAPI.deleteSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      loadStats();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      return alert('Title and message required');
    }
    try {
      const res = await adminAPI.createAnnouncement(announcementForm);
      setAnnouncements((prev) => [res.data, ...prev]);
      setAnnouncementForm({ title: '', message: '', role_id: '', priority: 'normal' });
      setShowAnnouncementForm(false);
      loadStats();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete?')) return;
    try {
      await adminAPI.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      loadStats();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleLogAttendance = async (e) => {
    e.preventDefault();
    if (!attendanceForm.volunteer_id || !attendanceForm.hours) return alert('Fill all fields');
    try {
      await adminAPI.logAttendance({
        volunteer_id: attendanceForm.volunteer_id,
        date: attendanceForm.date,
        hours_worked: parseFloat(attendanceForm.hours),
      });
      setAttendanceForm({ volunteer_id: '', date: new Date().toISOString().split('T')[0], hours: '' });
      setShowAttendanceForm(false);
      const res = await adminAPI.getAllAttendance();
      setAttendance(res.data || []);
      loadStats();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // If showing management section, return that content
  if (managementSection) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setManagementSection(null)}
          className="bg-gray-500 text-white px-4 py-2 rounded font-medium hover:bg-gray-600"
        >
          ← Back to Admin Dashboard
        </button>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* VOLUNTEERS */}
        {managementSection === 'volunteers' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">👥 Manage Volunteers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications.length === 0 ? (
                <p className="text-gray-500">No applications</p>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                    <h4 className="font-semibold text-sm">{app.user?.name}</h4>
                    <p className="text-xs text-gray-600">{app.user?.email}</p>
                    <p className="text-sm mt-2"><strong>Role:</strong> {app.role?.name}</p>
                    <p className={`text-xs mt-2 px-2 py-1 rounded inline-block ${app.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {app.status || 'pending'}
                    </p>
                    {app.status !== 'approved' && (
                      <button
                        onClick={() => handleApproveApp(app.id)}
                        className="w-full mt-3 bg-green-500 text-white py-2 rounded text-sm font-medium hover:bg-green-600"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ROLES */}
        {managementSection === 'roles' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">🎯 Manage Roles</h3>
              <button
                onClick={() => setShowRoleForm(!showRoleForm)}
                className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600"
              >
                {showRoleForm ? 'Cancel' : '+ Add Role'}
              </button>
            </div>
            {showRoleForm && (
              <form onSubmit={handleAddRole} className="bg-gray-50 rounded-lg p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Role name"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Availability"
                  value={roleForm.availability_required}
                  onChange={(e) => setRoleForm({ ...roleForm, availability_required: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded font-medium">
                  Add Role
                </button>
              </form>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.length === 0 ? (
                <p className="text-gray-500">No roles</p>
              ) : (
                roles.map((role) => (
                  <div key={role.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                    <h4 className="font-semibold">{role.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{role.availability_required || 'No availability'}</p>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="w-full mt-3 bg-red-500 text-white py-2 rounded text-sm font-medium hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SCHEDULES */}
        {managementSection === 'schedules' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">📅 Manage Schedules</h3>
              <button
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600"
              >
                {showScheduleForm ? 'Cancel' : '+ Add Schedule'}
              </button>
            </div>
            {showScheduleForm && (
              <form onSubmit={handleAddSchedule} className="bg-gray-50 rounded-lg p-4 space-y-3">
                <select value={scheduleForm.role_id} onChange={(e) => setScheduleForm({ ...scheduleForm, role_id: e.target.value })} className="w-full border rounded px-3 py-2" required>
                  <option value="">Select Role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })} className="w-full border rounded px-3 py-2" required />
                <input type="time" value={scheduleForm.time_start} onChange={(e) => setScheduleForm({ ...scheduleForm, time_start: e.target.value })} className="w-full border rounded px-3 py-2" required />
                <input type="time" value={scheduleForm.time_end} onChange={(e) => setScheduleForm({ ...scheduleForm, time_end: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="End time" />
                <input type="text" placeholder="Location" value={scheduleForm.location} onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })} className="w-full border rounded px-3 py-2" />
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded font-medium">Add Schedule</button>
              </form>
            )}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((sched) => (
                    <tr key={sched.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{roles.find((r) => r.id === sched.role_id)?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{sched.date?.split(' ')[0]}</td>
                      <td className="px-4 py-3">{sched.time_start} {sched.time_end && `- ${sched.time_end}`}</td>
                      <td className="px-4 py-3">{sched.location || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDeleteSchedule(sched.id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {managementSection === 'announcements' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">📢 Manage Announcements</h3>
              <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600">
                {showAnnouncementForm ? 'Cancel' : '+ New'}
              </button>
            </div>
            {showAnnouncementForm && (
              <form onSubmit={handleAddAnnouncement} className="bg-gray-50 rounded-lg p-4 space-y-3">
                <input type="text" placeholder="Title" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="w-full border rounded px-3 py-2" required />
                <textarea placeholder="Message" value={announcementForm.message} onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })} className="w-full border rounded px-3 py-2" rows="4" required />
                <select value={announcementForm.role_id} onChange={(e) => setAnnouncementForm({ ...announcementForm, role_id: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="">All Roles</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select value={announcementForm.priority} onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded font-medium">Send</button>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.map((anno) => (
                <div key={anno.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm flex-1">{anno.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ml-2 ${anno.priority === 'high' ? 'bg-red-100 text-red-700' : anno.priority === 'low' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {anno.priority || 'normal'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{anno.message}</p>
                  <button onClick={() => handleDeleteAnnouncement(anno.id)} className="w-full bg-red-500 text-white py-2 rounded text-sm font-medium hover:bg-red-600">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GROUPS */}
        {managementSection === 'groups' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">💬 Discussion Groups</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                  <h4 className="font-semibold">{group.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{group.description}</p>
                  <p className="text-xs text-gray-500 mt-3">👥 {group.members_count || 0} members</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ATTENDANCE */}
        {managementSection === 'attendance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">📋 Attendance Logs</h3>
              <button onClick={() => setShowAttendanceForm(!showAttendanceForm)} className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600">
                {showAttendanceForm ? 'Cancel' : '+ Log'}
              </button>
            </div>
            {showAttendanceForm && (
              <form onSubmit={handleLogAttendance} className="bg-gray-50 rounded-lg p-4 space-y-3">
                <input type="number" placeholder="Volunteer ID" value={attendanceForm.volunteer_id} onChange={(e) => setAttendanceForm({ ...attendanceForm, volunteer_id: e.target.value })} className="w-full border rounded px-3 py-2" required />
                <input type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })} className="w-full border rounded px-3 py-2" required />
                <input type="number" step="0.5" placeholder="Hours" value={attendanceForm.hours} onChange={(e) => setAttendanceForm({ ...attendanceForm, hours: e.target.value })} className="w-full border rounded px-3 py-2" required />
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded font-medium">Log</button>
              </form>
            )}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Volunteer</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{record.volunteer?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{record.date?.split('T')[0]}</td>
                      <td className="px-4 py-3 text-center">{record.hours_worked} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show Admin Dashboard Overview with stat cards
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🔧 Admin Management Dashboard</h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Admin Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Volunteers Card */}
        <button
          onClick={() => loadSection('volunteers')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left border-l-4 border-teal-500"
        >
          <div className="text-4xl mb-3">👥</div>
          <h3 className="font-bold text-lg mb-1">Volunteers</h3>
          <p className="text-sm text-gray-600 mb-3">Manage & approve applications</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-teal-600">{stats.pendingApplications}</span>
            <span className="text-xs text-gray-500">pending</span>
          </div>
        </button>

        {/* Roles Card */}
        <button
          onClick={() => loadSection('roles')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left border-l-4 border-blue-500"
        >
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="font-bold text-lg mb-1">Roles</h3>
          <p className="text-sm text-gray-600 mb-3">Create & manage roles</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-blue-600">{stats.totalRoles}</span>
            <span className="text-xs text-gray-500">total</span>
          </div>
        </button>

        {/* Schedules Card */}
        <button
          onClick={() => loadSection('schedules')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left border-l-4 border-purple-500"
        >
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-bold text-lg mb-1">Schedules</h3>
          <p className="text-sm text-gray-600 mb-3">Plan volunteer shifts</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-purple-600">{stats.scheduledEvents}</span>
            <span className="text-xs text-gray-500">scheduled</span>
          </div>
        </button>

        {/* Announcements Card */}
        <button
          onClick={() => loadSection('announcements')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left border-l-4 border-pink-500"
        >
          <div className="text-4xl mb-3">📢</div>
          <h3 className="font-bold text-lg mb-1">Announcements</h3>
          <p className="text-sm text-gray-600 mb-3">Send messages to volunteers</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-pink-600">{stats.announcements}</span>
            <span className="text-xs text-gray-500">total</span>
          </div>
        </button>

        {/* Groups Card */}
        <button
          onClick={() => loadSection('groups')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left border-l-4 border-indigo-500"
        >
          <div className="text-4xl mb-3">💬</div>
          <h3 className="font-bold text-lg mb-1">Groups</h3>
          <p className="text-sm text-gray-600 mb-3">Discussion & communities</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-indigo-600">{stats.groups}</span>
            <span className="text-xs text-gray-500">groups</span>
          </div>
        </button>

        {/* Attendance Card */}
        <button
          onClick={() => loadSection('attendance')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left border-l-4 border-green-500"
        >
          <div className="text-4xl mb-3">📋</div>
          <h3 className="font-bold text-lg mb-1">Attendance</h3>
          <p className="text-sm text-gray-600 mb-3">Track volunteer hours</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-green-600">{stats.hoursLogged.toFixed(1)}</span>
            <span className="text-xs text-gray-500">hours</span>
          </div>
        </button>
      </div>
    </div>
  );
}

  // VOLUNTEERS
  const handleApproveApp = async (appId) => {
    try {
      await adminAPI.approveApplication(appId);
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: 'approved' } : app))
      );
    } catch (err) {
      setError('Error approving: ' + err.message);
    }
  };

  // ROLES
  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      alert('Role name is required');
      return;
    }
    try {
      const res = await adminAPI.createRole(roleForm);
      setRoles((prev) => [...prev, res.data]);
      setRoleForm({ name: '', availability_required: '' });
      setShowRoleForm(false);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Delete this role?')) return;
    try {
      await adminAPI.deleteRole(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // SCHEDULES
  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.role_id || !scheduleForm.date || !scheduleForm.time_start) {
      alert('Role, date, and start time required');
      return;
    }
    try {
      const res = await adminAPI.createSchedule(scheduleForm);
      setSchedules((prev) => [...prev, res.data]);
      setScheduleForm({ role_id: '', date: '', time_start: '', time_end: '', location: '' });
      setShowScheduleForm(false);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await adminAPI.deleteSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // ANNOUNCEMENTS
  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      alert('Title and message required');
      return;
    }
    try {
      const res = await adminAPI.createAnnouncement(announcementForm);
      setAnnouncements((prev) => [res.data, ...prev]);
      setAnnouncementForm({ title: '', message: '', role_id: '', priority: 'normal' });
      setShowAnnouncementForm(false);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await adminAPI.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // ATTENDANCE
  const handleLogAttendance = async (e) => {
    e.preventDefault();
    if (!attendanceForm.volunteer_id || !attendanceForm.hours) {
      alert('Fill all fields');
      return;
    }
    try {
      await adminAPI.logAttendance({
        volunteer_id: attendanceForm.volunteer_id,
        date: attendanceForm.date,
        hours_worked: parseFloat(attendanceForm.hours),
      });
      setAttendanceForm({
        volunteer_id: '',
        date: new Date().toISOString().split('T')[0],
        hours: '',
      });
      setShowAttendanceForm(false);
      await loadAdminData();
      alert('Attendance logged');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const adminTabs = [
    { id: 'volunteers', label: '👥 Volunteers', icon: '👥' },
    { id: 'roles', label: '🎯 Roles', icon: '🎯' },
    { id: 'schedules', label: '📅 Schedules', icon: '📅' },
    { id: 'announcements', label: '📢 Announcements', icon: '📢' },
    { id: 'groups', label: '💬 Groups', icon: '💬' },
    { id: 'attendance', label: '📋 Attendance', icon: '📋' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 bg-white rounded-lg shadow p-4">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              adminTab === tab.id
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-4 rounded">
          <p className="font-semibold">⚠️ Error Loading Data</p>
          <p className="text-sm mt-1">{error}</p>
          <p className="text-xs mt-2 text-red-600">
            Tip: Make sure your backend is running at http://127.0.0.1:8000 and you're logged in as admin.
          </p>
        </div>
      )}

      {loading && <div className="text-center py-8 text-gray-500">Loading...</div>}

      {/* VOLUNTEERS */}
      {adminTab === 'volunteers' && !loading && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Volunteer Applications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.length === 0 ? (
              <p className="text-gray-500">No applications</p>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm">{app.user?.name || 'N/A'}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      app.status === 'approved' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {app.status || 'pending'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{app.user?.email}</p>
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Role:</strong> {app.role?.name}
                  </p>
                  {app.status !== 'approved' && (
                    <button
                      onClick={() => handleApproveApp(app.id)}
                      className="w-full bg-green-500 text-white py-2 rounded text-sm font-medium hover:bg-green-600"
                    >
                      Approve
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ROLES */}
      {adminTab === 'roles' && !loading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manage Roles</h3>
            <button
              onClick={() => setShowRoleForm(!showRoleForm)}
              className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600"
            >
              {showRoleForm ? 'Cancel' : '+ Add Role'}
            </button>
          </div>

          {showRoleForm && (
            <form onSubmit={handleAddRole} className="bg-gray-50 rounded-lg p-4 space-y-3">
              <input
                type="text"
                placeholder="Role name"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="Availability"
                value={roleForm.availability_required}
                onChange={(e) => setRoleForm({ ...roleForm, availability_required: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
              <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded font-medium">
                Add Role
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.length === 0 ? (
              <p className="text-gray-500">No roles</p>
            ) : (
              roles.map((role) => (
                <div key={role.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                  <h4 className="font-semibold mb-1">{role.name}</h4>
                  <p className="text-xs text-gray-600 mb-3">
                    {role.availability_required || 'No availability specified'}
                  </p>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="w-full bg-red-500 text-white py-2 rounded text-sm font-medium hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SCHEDULES */}
      {adminTab === 'schedules' && !loading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manage Schedules</h3>
            <button
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600"
            >
              {showScheduleForm ? 'Cancel' : '+ Add Schedule'}
            </button>
          </div>

          {showScheduleForm && (
            <form onSubmit={handleAddSchedule} className="bg-gray-50 rounded-lg p-4 space-y-3">
              <select
                value={scheduleForm.role_id}
                onChange={(e) => setScheduleForm({ ...scheduleForm, role_id: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Select Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={scheduleForm.date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="time"
                value={scheduleForm.time_start}
                onChange={(e) => setScheduleForm({ ...scheduleForm, time_start: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="time"
                value={scheduleForm.time_end}
                onChange={(e) => setScheduleForm({ ...scheduleForm, time_end: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Location"
                value={scheduleForm.location}
                onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
              <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded font-medium">
                Add Schedule
              </button>
            </form>
          )}

          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-center text-gray-500">
                      No schedules
                    </td>
                  </tr>
                ) : (
                  schedules.map((sched) => (
                    <tr key={sched.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{roles.find((r) => r.id === sched.role_id)?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{sched.date?.split(' ')[0] || 'N/A'}</td>
                      <td className="px-4 py-3">
                        {sched.time_start} {sched.time_end && `- ${sched.time_end}`}
                      </td>
                      <td className="px-4 py-3">{sched.location || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteSchedule(sched.id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      {adminTab === 'announcements' && !loading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manage Announcements</h3>
            <button
              onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
              className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600"
            >
              {showAnnouncementForm ? 'Cancel' : '+ New Announcement'}
            </button>
          </div>

          {showAnnouncementForm && (
            <form onSubmit={handleAddAnnouncement} className="bg-gray-50 rounded-lg p-4 space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
              <textarea
                placeholder="Message"
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows="4"
                required
              />
              <select
                value={announcementForm.role_id}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, role_id: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Send to all roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <select
                value={announcementForm.priority}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
              </select>
              <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded font-medium">
                Send
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.length === 0 ? (
              <p className="text-gray-500">No announcements</p>
            ) : (
              announcements.map((anno) => (
                <div key={anno.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm flex-1">{anno.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ml-2 ${
                      anno.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : anno.priority === 'low'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {anno.priority || 'normal'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {anno.role_id ? roles.find((r) => r.id === anno.role_id)?.name : 'All Roles'}
                  </p>
                  <p className="text-sm text-gray-700 mb-3">{anno.message}</p>
                  <button
                    onClick={() => handleDeleteAnnouncement(anno.id)}
                    className="w-full bg-red-500 text-white py-2 rounded text-sm font-medium hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* GROUPS */}
      {adminTab === 'groups' && !loading && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Discussion Groups</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.length === 0 ? (
              <p className="text-gray-500">No groups</p>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition ${
                    selectedGroup?.id === group.id ? 'ring-2 ring-teal-500' : ''
                  }`}
                >
                  <h4 className="font-semibold mb-2">{group.name}</h4>
                  <p className="text-xs text-gray-600">{group.description}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    👥 {group.members_count || 0} members
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ATTENDANCE */}
      {adminTab === 'attendance' && !loading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Log Attendance</h3>
            <button
              onClick={() => setShowAttendanceForm(!showAttendanceForm)}
              className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600"
            >
              {showAttendanceForm ? 'Cancel' : '+ Log Attendance'}
            </button>
          </div>

          {showAttendanceForm && (
            <form onSubmit={handleLogAttendance} className="bg-gray-50 rounded-lg p-4 space-y-3">
              <input
                type="number"
                placeholder="Volunteer ID"
                value={attendanceForm.volunteer_id}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, volunteer_id: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="date"
                value={attendanceForm.date}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                step="0.5"
                placeholder="Hours worked"
                value={attendanceForm.hours}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, hours: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
              <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded font-medium">
                Log
              </button>
            </form>
          )}

          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Volunteer</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-center text-gray-500">
                      No records
                    </td>
                  </tr>
                ) : (
                  attendance.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{record.volunteer?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{record.date?.split('T')[0] || 'N/A'}</td>
                      <td className="px-4 py-3">{record.hours_worked || 0} hrs</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );