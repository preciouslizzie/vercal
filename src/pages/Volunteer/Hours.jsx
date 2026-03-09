import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api/api';
<<<<<<< HEAD
import { getAllAttendance } from '../../api/adminApi';
=======
>>>>>>> c34cbd09882f2cc43469ce0127c26fed8b4fecc2

const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object' && Array.isArray(value.data)) return value.data;
  }

  return [];
};

const normalizeHoursPayload = (payload) => {
  const records = toArray(payload, ['attendance_records', 'attendance', 'items', 'records']);
  const totalHours = Number(
    payload?.total_hours
    ?? payload?.totalHours
    ?? payload?.hours_total
    ?? records.reduce((sum, item) => sum + Number(item?.hours_worked ?? item?.hours ?? 0), 0)
    ?? 0,
  );

  return {
    records: Array.isArray(records) ? records : [],
    totalHours: Number.isFinite(totalHours) ? totalHours : 0,
  };
};

const resolveRecordDate = (record) => (
  record?.logged_at
  || record?.created_at
  || record?.updated_at
  || record?.date
  || record?.attendance_date
  || record?.schedule?.date
  || ''
);

const resolveHours = (record) => Number(record?.hours_worked ?? record?.hours ?? 0);

const formatDisplayDate = (value) => {
  if (!value) return 'No date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No date';
  const raw = String(value);
  const hasTime = raw.includes('T') || /\d{1,2}:\d{2}/.test(raw);
  return parsed.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(hasTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
};

export default function Hours() {
  const [hours, setHours] = useState([]);
  const [error, setError] = useState('');
  const [nameByUserId, setNameByUserId] = useState({});
  const hoursList = Array.isArray(hours) ? hours : [];
  const currentVolunteerIds = useMemo(() => {
    const ids = new Set();
    const read = (key) => {
      try {
        return JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        return {};
      }
    };
    const sources = [read('user'), read('admin_user')];
    for (const src of sources) {
      const values = [src?.id, src?.user_id, src?.volunteer_id, src?.member_id];
      values.forEach((v) => {
        if (v !== undefined && v !== null && String(v).trim() !== '') ids.add(String(v));
      });
    }
    return ids;
  }, []);
  const sortedHours = useMemo(() => (
    [...hoursList].sort((a, b) => (
      new Date(resolveRecordDate(b) || 0).getTime() - new Date(resolveRecordDate(a) || 0).getTime()
    ))
  ), [hoursList]);
<<<<<<< HEAD
  const [visibleHours, setVisibleHours] = useState([]);
=======
  const visibleHours = useMemo(() => (
    sortedHours.filter((item) => {
      if (currentVolunteerIds.size === 0) return false;
      const recordUserId = String(
        item?.target_user_id
        ?? item?.targetUserId
        ?? item?.volunteer_user_id
        ?? item?.user_id
        ?? item?.volunteer_id
        ?? item?.member_id
        ?? item?.target_user?.id
        ?? item?.volunteer?.id
        ?? item?.user?.id
        ?? '',
      );
      return recordUserId && currentVolunteerIds.has(recordUserId);
    })
  ), [sortedHours, currentVolunteerIds]);
>>>>>>> c34cbd09882f2cc43469ce0127c26fed8b4fecc2

  useEffect(() => {
    let active = true;

    const fetchHours = async () => {
      try {
        const primary = await API.get('/volunteer/hours-worked');
        let normalized = normalizeHoursPayload(primary?.data || {});

        if (normalized.records.length === 0) {
          try {
            const fallback = await API.getMyHoursWorked();
            normalized = normalizeHoursPayload(fallback?.data || {});
          } catch {
            // ignore fallback failure
          }
        }

        if (!active) return;
        setHours(normalized.records);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || 'Failed to load hours');
        setHours([]);
      }
    };

    const intervalId = setInterval(fetchHours, 15000);
    const onFocus = () => fetchHours();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchHours();
    };

    fetchHours();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const normalizePerson = (raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const id = raw.id ?? raw.user_id ?? raw.member_id ?? raw.volunteer_id;
      if (id === undefined || id === null) return null;
      const fullName = [raw.first_name, raw.last_name].filter(Boolean).join(' ').trim();
      const name = raw.name || raw.full_name || raw.user_name || raw.username || fullName || '';
      if (!name) return null;
      return { id: String(id), name: String(name) };
    };

    const loadNames = async () => {
      try {
        const [membersRes, usersRes] = await Promise.allSettled([
          API.getMembers(),
          API.get('/admin/users'),
        ]);
        const membersList = membersRes.status === 'fulfilled'
          ? toArray(membersRes.value?.data, ['members', 'users', 'items'])
          : [];
        const usersList = usersRes.status === 'fulfilled'
          ? toArray(usersRes.value?.data, ['users', 'members', 'items'])
          : [];
        const merged = [...membersList, ...usersList]
          .map(normalizePerson)
          .filter(Boolean);
        if (!active) return;
        setNameByUserId(
          merged.reduce((acc, item) => {
            acc[item.id] = item.name;
            return acc;
          }, {}),
        );
      } catch {
        if (!active) return;
        setNameByUserId({});
      }
    };

    loadNames();
    return () => {
      active = false;
    };
  }, []);

<<<<<<< HEAD
  useEffect(() => {
          async function fetchAdminReports() {
            try {
              const response = await getAllAttendance(); // Fetch data from the Admin Dashboard API
              console.log('Admin Dashboard Attendance Data:', response.data); // Log the response to verify the structure

              const attendanceList = toArray(response.data, ['attendance', 'items']);

              // Directly use the data from the Admin Dashboard without filtering by user
              setVisibleHours(attendanceList);
            } catch (error) {
              console.error('Error fetching admin reports:', error);
            }
          }

          fetchAdminReports();
        }, []);

=======
>>>>>>> c34cbd09882f2cc43469ce0127c26fed8b4fecc2
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-5 md:p-7">
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-200/50 blur-3xl" />
      <div className="absolute -left-16 -bottom-20 h-48 w-48 rounded-full bg-emerald-200/50 blur-3xl" />

      <div className="relative z-10 space-y-5">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Report</h2>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {visibleHours.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
            <p className="text-base font-semibold text-slate-700">No report available yet</p>
            <p className="mt-1 text-sm text-slate-500">Your posted hours will appear here once assigned to your account.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
            <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <div className="col-span-5">Volunteer</div>
              <div className="col-span-4">Date</div>
              <div className="col-span-3 text-right">Hours</div>
            </div>
            <div className="divide-y divide-slate-100">
              {visibleHours.map((item, index) => {
                const rowId = item?.id || `${resolveRecordDate(item)}-${resolveHours(item)}-${index}`;
                const recordUserId = String(
                  item?.target_user_id
                  ?? item?.targetUserId
                  ?? item?.volunteer_user_id
                  ?? item?.user_id
                  ?? item?.volunteer_id
                  ?? item?.member_id
                  ?? item?.target_user?.id
                  ?? '',
                );
                const nestedVolunteerName = (
                  String(item?.volunteer?.id ?? '') === recordUserId
                    ? item?.volunteer?.name
                    : ''
                );
                const nestedUserName = (
                  String(item?.user?.id ?? '') === recordUserId
                    ? item?.user?.name
                    : ''
                );
                const volunteerName = nestedVolunteerName
                  || nestedUserName
                  || item?.target_user_name
                  || item?.volunteer_full_name
                  || nameByUserId[recordUserId]
                  || item?.volunteer_name
                  || 'N/A';
                return (
                  <div key={rowId} className="grid grid-cols-12 px-4 py-3 transition-colors hover:bg-slate-50">
                    <div className="col-span-5 text-sm text-slate-700">{volunteerName}</div>
                    <div className="col-span-4 text-sm text-slate-700">{formatDisplayDate(resolveRecordDate(item))}</div>
                    <div className="col-span-3 text-right text-sm font-semibold text-slate-900">
                      {resolveHours(item).toFixed(2)} hrs
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
