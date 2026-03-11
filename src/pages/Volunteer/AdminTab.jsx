import React, { useEffect, useRef, useState } from 'react';
import * as adminAPI from '../../api/adminApi';
import { getAnnouncements as getVolunteerAnnouncements } from '../../api/api';
import axios from 'axios';

const REPORT_CACHE_KEY = 'volunteer_report_cache_v1';

export default function AdminTab() {
  const [managementSection, setManagementSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSection, setLoadingSection] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const successTimerRef = useRef(null);

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
  const [users, setUsers] = useState([]);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', availability_required: '' });

  // Schedules State
  const [schedules, setSchedules] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ user_id: '', role_id: '', date: '', start_time: '', end_time: '', location: '' });

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', role_id: '', priority: 'normal' });

  // Groups State
  const [groups, setGroups] = useState([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    department: '',
    description: '',
    whatsapp_link: '',
  });
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    volunteer_id: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
  });

  const parseApiError = (err, fallback = 'Something went wrong') => {
    const message = err?.response?.data?.message;
    if (message) return message;

    const errors = err?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
      const firstError = Object.values(errors).flat()[0];
      if (firstError) return firstError;
    }

    return err?.message || fallback;
  };

  const isValidWhatsAppUrl = (value) => /^https?:\/\/(chat\.whatsapp\.com|wa\.me)\//i.test(value || '');
  const getGroupWhatsAppLink = (group) => (
    group?.whatsapp_link
    || group?.whatsapp_url
    || group?.invite_link
    || group?.link
    || ''
  );
  const showSuccess = (message) => {
    setSuccessMessage(message);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      setSuccessMessage('');
      successTimerRef.current = null;
    }, 2500);
  };

  const toArray = (payload, nestedKeys = []) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    if (Array.isArray(payload.data)) return payload.data;

    for (const key of nestedKeys) {
      if (Array.isArray(payload[key])) return payload[key];
      if (payload[key] && typeof payload[key] === 'object' && Array.isArray(payload[key].data)) {
        return payload[key].data;
      }
    }

    return [];
  };

  const normalizeRole = (role) => {
    if (!role || typeof role !== 'object') return null;
    const id = role.id ?? role.role_id;
    if (id === null || id === undefined) return null;
    return { ...role, id };
  };

  const resolveScheduleDate = (sched) => {
    const extractDateFromString = (value) => {
      if (typeof value !== 'string') return '';
      const trimmed = value.trim();
      if (!trimmed) return '';
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) return '';

      const isoMatch = trimmed.match(/\d{4}-\d{2}-\d{2}/);
      if (isoMatch) return isoMatch[0];

      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];

      return '';
    };

    const candidates = [
      sched?.date,
      sched?.scheduleDate,
      sched?.schedule_date,
      sched?.scheduledDate,
      sched?.scheduled_date,
      sched?.scheduled_for,
      sched?.scheduledFor,
      sched?.service_day,
      sched?.day,
      sched?.event_date,
      sched?.eventDate,
      sched?.shift_date,
      sched?.shiftDate,
      sched?.duty_date,
      sched?.service_date,
      sched?.starts_at,
      sched?.startsAt,
      sched?.ends_at,
      sched?.endsAt,
      sched?.schedule?.date,
      sched?.schedule?.scheduleDate,
      sched?.schedule?.scheduled_date,
      sched?.schedule?.scheduledDate,
      sched?.schedule?.scheduled_for,
      sched?.schedule?.scheduledFor,
    ];

    for (const value of candidates) {
      if (!value) continue;
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().split('T')[0];
      }
      const extracted = extractDateFromString(value);
      if (extracted) return extracted;
    }

    // Heuristic fallback for unknown backend keys (e.g. *_date, *Date, *_at).
    for (const [key, value] of Object.entries(sched || {})) {
      if (value === null || value === undefined) continue;
      const keyLower = String(key).toLowerCase();
      const looksDateLike = keyLower.includes('date') || keyLower.endsWith('_at') || keyLower.endsWith('at');
      if (!looksDateLike) continue;
      const extracted = value instanceof Date
        ? value.toISOString().split('T')[0]
        : extractDateFromString(value);
      if (extracted) return extracted;
    }

    return '';
  };

  const buildSchedulePayload = (form) => {
    const normalizedDate = String(form?.date || '').trim();
    const startTime = String(form?.start_time || '').trim();
    const endTime = String(form?.end_time || '').trim();
    const userId = form?.user_id || '';
    const roleId = form?.role_id || '';

    const payload = {
      // Common user keys
      user_id: userId || undefined,
      volunteer_id: userId || undefined,
      userId: userId || undefined,

      // Common role keys
      role_id: roleId || undefined,
      volunteer_role_id: roleId || undefined,
      roleId: roleId || undefined,

      // Common date keys
      date: normalizedDate || undefined,
      scheduled_date: normalizedDate || undefined,
      schedule_date: normalizedDate || undefined,
      scheduled_for: normalizedDate || undefined,

      // Common time keys
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      starts_at: startTime || undefined,
      ends_at: endTime || undefined,
      time: startTime || undefined,

      // Misc
      location: form?.location?.trim() || undefined,
    };

    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
  };

  const buildAnnouncementPayload = (form) => {
    const selectedRole = String(form?.role_id || '').trim();
    const selectedRoleId = selectedRole ? Number(selectedRole) : null;
    const roleIds = selectedRole
      ? [Number.isNaN(selectedRoleId) ? selectedRole : selectedRoleId]
      : [];
    const targetRolesText = roleIds.length > 0
      ? roleIds.map(String).join(',')
      : 'all';

    const payload = {
      title: form?.title?.trim() || '',
      message: form?.message?.trim() || '',
      priority: form?.priority || 'normal',

      // Compatibility keys for different backend implementations.
      role_id: selectedRole || undefined,
      role_ids: roleIds.length > 0 ? roleIds : undefined,
      target_roles: targetRolesText,
      target_roles_list: roleIds.length > 0 ? roleIds : ['all'],
      target_role_ids: roleIds.length > 0 ? roleIds : undefined,
      send_to_all: roleIds.length === 0,
      all_roles: roleIds.length === 0,
    };

    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
  };

  const normalizeSchedule = (raw) => {
    const sched = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
    if (!sched || typeof sched !== 'object') return null;
    const id = sched.id ?? sched.schedule_id;
    if (id === null || id === undefined) return null;

    const roleId = sched.role_id ?? sched.role?.id ?? sched.volunteer_role_id ?? null;
    const userData = sched.user || sched.volunteer || null;
    const userId = sched.user_id ?? userData?.id ?? null;
    const dateValue = resolveScheduleDate(sched);

    return {
      ...sched,
      id,
      role_id: roleId,
      user_id: userId,
      user: userData,
      date: dateValue,
      location: sched.location || '',
    };
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
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

      console.log("Announcements response:", annoRes.data);

      const appsList = toArray(apps.data, ['applications', 'items']);
      const rolesList = toArray(rolesRes.data, ['roles', 'items']);
      const schedulesList = toArray(schedRes.data, ['schedules', 'items']);
      const announcementsList = toArray(annoRes.data, ['announcements', 'items']);
      const groupsList = toArray(groupsRes.data, ['groups', 'items']);
      const attendanceList = toArray(attRes.data, ['attendance', 'items']);

      setStats({
        pendingApplications: appsList.filter((a) => a.status !== 'approved').length || 0,
        totalRoles: rolesList.length || 0,
        scheduledEvents: schedulesList.length || 0,
        announcements: announcementsList.length || 0,
        groups: groupsList.length || 0,
        hoursLogged: attendanceList.reduce((sum, a) => sum + (a.hours_worked || 0), 0) || 0,
      });
    } catch (err) {
      console.error('[AdminTab Stats]', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSection = async (section) => {
    setManagementSection(section); // switch instantly for faster perceived navigation
    setLoadingSection(section);
    try {
      setLoading(true);
      setError('');

      if (section === 'volunteers') {
        const res = await adminAPI.getApplications();
        setApplications(res.data || []);
      } else if (section === 'roles') {

        const res = await adminAPI.getRoles();
        setRoles(toArray(res.data, ['roles', 'items']).map(normalizeRole).filter(Boolean));
      } else if (section === 'schedules') {
        const [schedRes, rolesRes, volunteersRes, usersRes, appsRes] = await Promise.allSettled([
          adminAPI.getSchedules(),
          adminAPI.getRoles(),
          adminAPI.getVolunteers(),
          adminAPI.getUsers(),
          adminAPI.getApplications(),
        ]);

        const scheduleUnauthorized = schedRes.status === 'rejected' && schedRes.reason?.response?.status === 401;
        const rolesUnauthorized = rolesRes.status === 'rejected' && rolesRes.reason?.response?.status === 401;
        const volunteersUnauthorized = volunteersRes.status === 'rejected' && volunteersRes.reason?.response?.status === 401;
        const usersUnauthorized = usersRes.status === 'rejected' && usersRes.reason?.response?.status === 401;

        if (schedRes.status === 'rejected' && !scheduleUnauthorized) throw schedRes.reason;
        if (rolesRes.status === 'rejected' && !rolesUnauthorized) throw rolesRes.reason;

        const schedulesPayload = schedRes.status === 'fulfilled' ? schedRes.value.data : [];
        const schedulesList = toArray(schedulesPayload, ['schedules', 'items']);
        setSchedules(schedulesList.map(normalizeSchedule).filter(Boolean));

        const rolesPayload = rolesRes.status === 'fulfilled' ? rolesRes.value.data : [];
        const rolesList = toArray(rolesPayload, ['roles', 'items']);
        setRoles(rolesList.map(normalizeRole).filter(Boolean));
        const normalizePeople = (list) =>
          (Array.isArray(list) ? list : [])
            .map((u) => {
              const firstLast = [u?.first_name, u?.last_name].filter(Boolean).join(' ').trim();
              const id = u?.id ?? u?.user_id ?? u?.volunteer_id;
              const name = u?.name || u?.full_name || firstLast || u?.username || u?.email;
              return id ? { ...u, id, name } : null;
            })
            .filter((u) => u && u.name);

        const isAdminUser = (u) => {
          const roleValue = String(u?.role || u?.user_type || u?.type || '').toLowerCase();
          return u?.is_admin === true || roleValue === 'admin' || roleValue.includes('admin');
        };

        if (volunteersRes.status === 'fulfilled') {
          const volunteersPayload = volunteersRes.value.data;
          const normalizedVolunteers = Array.isArray(volunteersPayload)
            ? volunteersPayload
            : volunteersPayload?.volunteers || volunteersPayload?.users || volunteersPayload?.data || [];
          const volunteers = normalizePeople(normalizedVolunteers).filter((u) => !isAdminUser(u));
          if (volunteers.length > 0) {
            setUsers(volunteers);
          } else if (usersRes.status === 'fulfilled') {
            const usersPayload = usersRes.value.data;
            const normalizedUsers = Array.isArray(usersPayload)
              ? usersPayload
              : usersPayload?.users || usersPayload?.data || [];
            const users = normalizePeople(normalizedUsers).filter((u) => !isAdminUser(u));
            const volunteerUsers = users.filter((u) => {
              const roleValue = String(u?.role || u?.user_type || u?.type || '').toLowerCase();
              return u?.is_volunteer === true || roleValue === 'volunteer' || roleValue.includes('volunteer');
            });
            setUsers(volunteerUsers.length > 0 ? volunteerUsers : users);
          } else {
            setUsers([]);
          }
        } else if (usersRes.status === 'fulfilled') {
          const usersPayload = usersRes.value.data;
          const normalizedUsers = Array.isArray(usersPayload)
            ? usersPayload
            : usersPayload?.users || usersPayload?.data || [];

          // Keep only volunteer accounts for schedule assignment.
          const users = normalizePeople(normalizedUsers).filter((u) => !isAdminUser(u));
          const volunteerUsers = users.filter((u) => {
            const roleValue = String(u?.role || u?.user_type || u?.type || '').toLowerCase();
            return u?.is_volunteer === true || roleValue === 'volunteer' || roleValue.includes('volunteer');
          });

          if (volunteerUsers.length > 0) {
            setUsers(volunteerUsers);
          } else if (appsRes.status === 'fulfilled') {
            const approvedUsers = (appsRes.value.data || [])
              .filter((app) => app?.status === 'approved')
              .map((app) => app?.user || app?.volunteer || app);
            const normalizedApproved = normalizePeople(approvedUsers).filter((u) => !isAdminUser(u));
            const uniqueUsers = Array.from(new Map(normalizedApproved.map((u) => [u.id, u])).values());
            setUsers(uniqueUsers);
          } else {
            setUsers(users);
          }
        } else if (appsRes.status === 'fulfilled') {
          const approvedUsers = (appsRes.value.data || [])
            .filter((app) => app?.status === 'approved')
            .map((app) => app?.user || app?.volunteer || app);
          const normalizedApproved = normalizePeople(approvedUsers).filter((u) => !isAdminUser(u));
          const uniqueUsers = Array.from(new Map(normalizedApproved.map((u) => [u.id, u])).values());
          setUsers(uniqueUsers);
        } else {
          setUsers([]);
        }

        if (scheduleUnauthorized || rolesUnauthorized || volunteersUnauthorized || usersUnauthorized) {
          setError('Some schedule data is restricted for this account.');
        }
      } else if (section === 'announcements') {
        const [annoRes, rolesRes] = await Promise.allSettled([
          adminAPI.getAnnouncements(),
          adminAPI.getRoles(),
        ]);

        let announcementsPayload = null;
        let announcementErr = null;

        if (annoRes.status === 'fulfilled') {
          announcementsPayload = annoRes.value?.data;
        } else {
          announcementErr = annoRes.reason;
          try {
            // Fallback endpoint in case /admin/announcements is temporarily unreachable.
            const fallback = await getVolunteerAnnouncements();
            announcementsPayload = fallback?.data;
            announcementErr = null;
          } catch (fallbackErr) {
            announcementErr = fallbackErr;
          }
        }

        if (announcementErr) {
          try {
            // Legacy fallback endpoint used by some deployments.
            const legacyBase = process.env.REACT_APP_API_URL || 'https://lizzy.altoservices.org/api';
            const legacyRes = await axios.get(`${legacyBase}/volunteer/announcements/get.php`, {
              headers: (() => {
                const token = localStorage.getItem('admin_token')
                  || localStorage.getItem('token')
                  || localStorage.getItem('user_token')
                  || '';
                return token ? { Authorization: `Bearer ${token}` } : {};
              })(),
            });
            announcementsPayload = legacyRes?.data;
            announcementErr = null;
          } catch (legacyErr) {
            announcementErr = legacyErr;
          }
        }

        if (announcementErr) {
          setAnnouncements([]);
          setError('Announcements are temporarily unavailable. Please try again.');
        } else {
          setAnnouncements(toArray(announcementsPayload, ['announcements', 'items']));
        }

        if (rolesRes.status === 'fulfilled') {
          setRoles(toArray(rolesRes.value.data, ['roles', 'items']).map(normalizeRole).filter(Boolean));
        } else {
          setRoles([]);
          setError('Announcements loaded, but roles could not be loaded.');
        }
      } else if (section === 'groups') {
        const res = await adminAPI.getGroups();
        setGroups(toArray(res.data, ['groups', 'items']));
      } else if (section === 'attendance') {
        const [volunteersRes, usersRes, appsRes] = await Promise.allSettled([
          adminAPI.getVolunteers(),
          adminAPI.getUsers(),
          adminAPI.getApplications(),
        ]);

        const normalizePeople = (list) =>
          (Array.isArray(list) ? list : [])
            .map((u) => {
              const firstLast = [u?.first_name, u?.last_name].filter(Boolean).join(' ').trim();
              const id = u?.id ?? u?.user_id ?? u?.volunteer_id;
              const name = u?.name || u?.full_name || firstLast || u?.username || u?.email;
              return id ? { ...u, id, name } : null;
            })
            .filter((u) => u && u.name);

        const isAdminUser = (u) => {
          const roleValue = String(u?.role || u?.user_type || u?.type || '').toLowerCase();
          return u?.is_admin === true || roleValue === 'admin' || roleValue.includes('admin');
        };

        if (volunteersRes.status === 'fulfilled') {
          const payload = volunteersRes.value?.data;
          const normalized = Array.isArray(payload)
            ? payload
            : payload?.volunteers || payload?.users || payload?.data || [];
          setUsers(normalizePeople(normalized).filter((u) => !isAdminUser(u)));
        } else if (usersRes.status === 'fulfilled') {
          const payload = usersRes.value?.data;
          const normalized = Array.isArray(payload) ? payload : payload?.users || payload?.data || [];
          const allUsers = normalizePeople(normalized).filter((u) => !isAdminUser(u));
          const volunteerUsers = allUsers.filter((u) => {
            const roleValue = String(u?.role || u?.user_type || u?.type || '').toLowerCase();
            return u?.is_volunteer === true || roleValue === 'volunteer' || roleValue.includes('volunteer');
          });
          setUsers(volunteerUsers.length > 0 ? volunteerUsers : allUsers);
        } else if (appsRes.status === 'fulfilled') {
          const approvedUsers = toArray(appsRes.value?.data, ['applications', 'items'])
            .filter((app) => app?.status === 'approved')
            .map((app) => app?.user || app?.volunteer || app);
          const uniqueUsers = Array.from(new Map(normalizePeople(approvedUsers).map((u) => [u.id, u])).values());
          setUsers(uniqueUsers);
        } else {
          setUsers([]);
        }
      }

    } catch (err) {
      setError('Failed to load ' + section + ': ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setLoadingSection('');
    }
  };

  // HANDLERS
  const handleApproveApp = async (appId) => {
    try {
      setError('');
      await adminAPI.approveApplication(appId);
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: 'approved' } : app))
      );
      loadStats();
    } catch (err) {
      setError('Failed to approve application: ' + parseApiError(err, 'Server rejected the approval request.'));
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return alert('Role name required');
    try {
      setError('');
      const payload = {
        name: roleForm.name.trim(),
      };
      if (roleForm.availability_required?.trim()) {
        payload.availability_required = roleForm.availability_required.trim();
      }
      await adminAPI.createRole(payload);
      setRoleForm({ name: '', availability_required: '' });
      setShowRoleForm(false);
      loadStats();
    } catch (err) {
      setError('Failed to add role: ' + parseApiError(err, 'Server error while creating role.'));
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Delete?')) return;
    try {
      setError('');
      await adminAPI.deleteRole(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
      loadStats();
    } catch (err) {
      setError('Failed to delete role: ' + parseApiError(err, 'Server error while deleting role.'));
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.role_id || !scheduleForm.date || !scheduleForm.start_time) {
      return alert('Role, date, time required');
    }
    try {
      setError('');
      const payload = buildSchedulePayload(scheduleForm);
      await adminAPI.createSchedule(payload);
      setScheduleForm({ user_id: '', role_id: '', date: '', start_time: '', end_time: '', location: '' });
      setShowScheduleForm(false);
      loadStats();
    } catch (err) {
      console.error('[Schedule create validation]', err?.response?.data || err);
      setError('Failed to add schedule: ' + parseApiError(err, 'Server error while creating schedule.'));
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Delete?')) return;
    try {
      setError('');
      await adminAPI.deleteSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      loadStats();
    } catch (err) {
      setError('Failed to delete schedule: ' + parseApiError(err, 'Server error while deleting schedule.'));
    }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      return alert('Title and message required');
    }
    try {
      setError('');
      const payload = buildAnnouncementPayload(announcementForm);
      const res = await adminAPI.createAnnouncement(payload);
      setAnnouncements((prev) => [res.data, ...prev]);
      setAnnouncementForm({ title: '', message: '', role_id: '', priority: 'normal' });
      setShowAnnouncementForm(false);
      loadStats();
    } catch (err) {
      console.error('[Announcement create validation]', err?.response?.data || err);
      setError('Failed to send announcement: ' + parseApiError(err, 'Server error while creating announcement.'));
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete?')) return;
    try {
      setError('');
      await adminAPI.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      loadStats();
    } catch (err) {
      setError('Failed to delete announcement: ' + parseApiError(err, 'Server error while deleting announcement.'));
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return alert('Group name required');
    if (!groupForm.whatsapp_link.trim()) return alert('WhatsApp group link required');
    if (!isValidWhatsAppUrl(groupForm.whatsapp_link.trim())) {
      return alert('Use a valid WhatsApp invite URL (chat.whatsapp.com or wa.me)');
    }

    try {
      setError('');
      const payload = {
        name: groupForm.name.trim(),
        department: groupForm.department.trim() || undefined,
        description: groupForm.description.trim() || undefined,
        whatsapp_link: groupForm.whatsapp_link.trim(),
        whatsapp_url: groupForm.whatsapp_link.trim(),
        invite_link: groupForm.whatsapp_link.trim(),
        link: groupForm.whatsapp_link.trim(),
      };
      const res = await adminAPI.createGroup(payload);
      const created = res?.data?.data ?? res?.data;
      setGroups((prev) => [created, ...prev].filter(Boolean));
      setGroupForm({ name: '', department: '', description: '', whatsapp_link: '' });
      setShowGroupForm(false);
      loadStats();
    } catch (err) {
      setError('Failed to create group: ' + parseApiError(err, 'Server error while creating group.'));
    }
  };

  const handleLogAttendance = async (e) => {
    e.preventDefault();
    if (!attendanceForm.volunteer_id || !attendanceForm.hours) return alert('Fill all fields');
    try {
      setError('');
      const selectedVolunteerId = String(attendanceForm.volunteer_id || '').trim();
      const selectedDate = String(attendanceForm.date || '').trim();
      const selectedVolunteer = users.find((u) => String(u?.id ?? '') === selectedVolunteerId);
      const selectedVolunteerName = selectedVolunteer?.name || selectedVolunteer?.full_name || '';
      const parsedHours = Number(attendanceForm.hours);
      if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
        return alert('Enter a valid number of hours');
      }

      const payload = {
        userId: selectedVolunteerId,
        hoursWorked: parsedHours,
        attendanceDate: selectedDate || undefined,
        user_id: selectedVolunteerId,
        volunteer_id: selectedVolunteerId,
        target_user_id: selectedVolunteerId,
        targetUserId: selectedVolunteerId,
        volunteer_user_id: selectedVolunteerId,
        target_user_name: selectedVolunteerName || undefined,
        volunteer_name: selectedVolunteerName || undefined,
        date: selectedDate,
        attendance_date: selectedDate,
        hours_worked: parsedHours,
        hours: parsedHours,
      };
      const response = await adminAPI.logAttendance(payload);

      try {
        const stored = JSON.parse(localStorage.getItem(REPORT_CACHE_KEY) || '[]');
        const cacheList = Array.isArray(stored) ? stored : [];
        const serverRecord = response?.data?.data ?? response?.data ?? {};
        const cacheRecord = {
          ...payload,
          ...serverRecord,
          id: serverRecord?.id ?? `${selectedVolunteerId}-${selectedDate}-${Date.now()}`,
          created_at: serverRecord?.created_at ?? new Date().toISOString(),
        };
        const next = [cacheRecord, ...cacheList].slice(0, 300);
        localStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('volunteer-report-cache-updated'));
      } catch {
        // ignore cache errors
      }

      setAttendanceForm({ volunteer_id: '', date: new Date().toISOString().split('T')[0], hours: '' });
      setShowAttendanceForm(false);
      showSuccess('Report posted successfully.');
      loadStats();
    } catch (err) {
      setError('Failed to post report: ' + parseApiError(err, 'Server error while posting report.'));
    }
  };

  // If showing management section, return that content
  if (managementSection) {
    return (
      <div className="space-y-4">
        {successMessage && (
          <div className="fixed right-5 top-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
            {successMessage}
          </div>
        )}
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

        {loading && (
          <div className="bg-white rounded-2xl shadow p-8 flex items-center justify-center gap-3 text-gray-700">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
            <span className="font-medium capitalize">Loading {managementSection}...</span>
          </div>
        )}

        {/* VOLUNTEERS */}
        {!loading && managementSection === 'volunteers' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">👥 Manage Volunteers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications.length === 0 ? (
                <p className="text-gray-500">No applications</p>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="bg-white rounded-2xl shadow p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
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
        {!loading && managementSection === 'roles' && (
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
                  <div key={role.id} className="bg-white rounded-2xl shadow p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
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
        {!loading && managementSection === 'schedules' && (
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
                <select value={scheduleForm.user_id} onChange={(e) => setScheduleForm({ ...scheduleForm, user_id: e.target.value })} className="w-full border rounded px-3 py-2" required>
                  <option value="">Select User</option>
                  {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
                <select value={scheduleForm.role_id} onChange={(e) => setScheduleForm({ ...scheduleForm, role_id: e.target.value })} className="w-full border rounded px-3 py-2" required>
                  <option value="">Select Role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })} className="w-full border rounded px-3 py-2" required />
                <input type="time" value={scheduleForm.start_time} onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} className="w-full border rounded px-3 py-2" required />
                <input type="time" value={scheduleForm.end_time} onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="End time" />
                <input type="text" placeholder="Location" value={scheduleForm.location} onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })} className="w-full border rounded px-3 py-2" />
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded font-medium">Add Schedule</button>
              </form>
            )}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(schedules) &&
              schedules.map((sched) => (
                    <tr key={sched.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{sched.user?.name || users.find((u) => String(u.id) === String(sched.user_id))?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{roles.find((r) => String(r.id) === String(sched.role_id ?? sched.role?.id))?.name || sched.role?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{sched.date || '-'}</td>
                      <td className="px-4 py-3">{sched.start_time} {sched.end_time && `- ${sched.end_time}`}</td>
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
        {!loading && managementSection === 'announcements' && (
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
              {Array.isArray(announcements) &&
                announcements.map((anno) => (
                <div key={anno.id} className="bg-white rounded-2xl shadow p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
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
        {!loading && managementSection === 'groups' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Discussion Groups</h3>
              <button
                onClick={() => setShowGroupForm(!showGroupForm)}
                className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600"
              >
                {showGroupForm ? 'Cancel' : '+ New Group'}
              </button>
            </div>

            {showGroupForm && (
              <form onSubmit={handleAddGroup} className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Department / Group name"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Department (optional)"
                  value={groupForm.department}
                  onChange={(e) => setGroupForm({ ...groupForm, department: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <textarea
                  placeholder="Group description"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full border rounded px-3 py-2 md:col-span-2"
                  rows="3"
                />
                <input
                  type="url"
                  placeholder="WhatsApp invite link (https://chat.whatsapp.com/...)"
                  value={groupForm.whatsapp_link}
                  onChange={(e) => setGroupForm({ ...groupForm, whatsapp_link: e.target.value })}
                  className="w-full border rounded px-3 py-2 md:col-span-2"
                  required
                />
                <button type="submit" className="md:col-span-2 bg-blue-500 text-white py-2 rounded font-medium">
                  Create Group
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => {
                const whatsappLink = getGroupWhatsAppLink(group);
                return (
                  <div key={group.id} className="bg-white rounded-2xl shadow p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <h4 className="font-semibold">{group.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{group.description}</p>
                    <p className="text-xs text-gray-500 mt-3">{group.members_count || 0} members</p>
                    {whatsappLink ? (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-3 text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded"
                      >
                        Open WhatsApp Link
                      </a>
                    ) : (
                      <p className="text-xs text-amber-600 mt-3">WhatsApp link not yet added.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && managementSection === 'attendance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Report</h3>
              <button
                onClick={() => setShowAttendanceForm((prev) => !prev)}
                className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600"
              >
                {showAttendanceForm ? 'Cancel' : '+ Post'}
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Hours worked
            </p>

            {showAttendanceForm && (
              <form onSubmit={handleLogAttendance} className="bg-gray-50 rounded-lg p-4 space-y-3">
                <select
                  value={attendanceForm.volunteer_id}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, volunteer_id: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Volunteer</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
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
                  placeholder="Hours"
                  value={attendanceForm.hours}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, hours: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded font-medium">
                  Report
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    );
  }

  // Show Admin Dashboard Overview with stat cards
  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="fixed right-5 top-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {successMessage}
        </div>
      )}
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
          disabled={!!loadingSection}
          className="bg-white p-5 sm:p-6 rounded-2xl shadow cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-left border-l-4 border-teal-500"
        >
          <div className="text-4xl mb-3">👥</div>
          <h3 className="font-bold text-lg mb-1">Volunteers</h3>
          <p className="text-sm text-gray-600 mb-3">Manage & approve applications</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-teal-600">{stats.pendingApplications}</span>
            <span className="text-xs text-gray-500">{loadingSection === 'volunteers' ? 'loading...' : 'pending'}</span>
          </div>
        </button>

        {/* Roles Card */}
        <button
          onClick={() => loadSection('roles')}
          disabled={!!loadingSection}
          className="bg-white p-5 sm:p-6 rounded-2xl shadow cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-left border-l-4 border-blue-500"
        >
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="font-bold text-lg mb-1">Roles</h3>
          <p className="text-sm text-gray-600 mb-3">Create & manage roles</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-blue-600">{stats.totalRoles}</span>
            <span className="text-xs text-gray-500">{loadingSection === 'roles' ? 'loading...' : 'total'}</span>
          </div>
        </button>

        {/* Schedules Card */}
        <button
          onClick={() => loadSection('schedules')}
          disabled={!!loadingSection}
          className="bg-white p-5 sm:p-6 rounded-2xl shadow cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-left border-l-4 border-purple-500"
        >
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-bold text-lg mb-1">Schedules</h3>
          <p className="text-sm text-gray-600 mb-3">Plan volunteer shifts</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-purple-600">{stats.scheduledEvents}</span>
            <span className="text-xs text-gray-500">{loadingSection === 'schedules' ? 'loading...' : 'scheduled'}</span>
          </div>
        </button>

        {/* Announcements Card */}
        <button
          onClick={() => loadSection('announcements')}
          disabled={!!loadingSection}
          className="bg-white p-5 sm:p-6 rounded-2xl shadow cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-left border-l-4 border-pink-500"
        >
          <div className="text-4xl mb-3">📢</div>
          <h3 className="font-bold text-lg mb-1">Announcements</h3>
          <p className="text-sm text-gray-600 mb-3">Send messages to volunteers</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-pink-600">{stats.announcements}</span>
            <span className="text-xs text-gray-500">{loadingSection === 'announcements' ? 'loading...' : 'total'}</span>
          </div>
        </button>

        {/* Groups Card */}
        <button
          onClick={() => loadSection('groups')}
          disabled={!!loadingSection}
          className="bg-white p-5 sm:p-6 rounded-2xl shadow cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-left border-l-4 border-indigo-500"
        >
          <div className="text-4xl mb-3">💬</div>
          <h3 className="font-bold text-lg mb-1">Groups</h3>
          <p className="text-sm text-gray-600 mb-3">Discussion & communities</p>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-indigo-600">{stats.groups}</span>
            <span className="text-xs text-gray-500">{loadingSection === 'groups' ? 'loading...' : 'groups'}</span>
          </div>
        </button>

        <button
          onClick={() => loadSection('attendance')}
          disabled={!!loadingSection}
          className="bg-white p-5 sm:p-6 rounded-2xl shadow cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-left border-l-4 border-green-500"
        >
          <div className="text-4xl mb-3"></div>
          <h3 className="font-bold text-lg mb-1">Post Report</h3>
          <p className="text-sm text-gray-600 mb-3">Submit volunteer hours for reports</p>
          {loadingSection === 'attendance' && (
            <span className="text-xs text-gray-500">loading...</span>
          )}
        </button>

      </div>
    </div>
  );
}
