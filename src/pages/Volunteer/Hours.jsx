import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api/api';

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
const readCachedReports = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(REPORT_CACHE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const mergeUniqueReports = (primary, secondary) => {
  const seen = new Set();
  const merged = [];
  const source = [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])];

  source.forEach((item, index) => {
    const key = String(
      item?.id
      ?? `${resolveRecordUserId(item)}-${resolveRecordDate(item)}-${resolveHours(item)}-${index}`,
    );
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });

  return merged;
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
  || record?.attendanceDate
  || record?.logged_date
  || record?.work_date
  || record?.schedule?.date
  || ''
);

const resolveHours = (record) => Number(
  record?.hours_worked
  ?? record?.hoursWorked
  ?? record?.hours
  ?? 0,
);
const resolveRecordUserId = (record) => String(
  record?.target_user_id
  ?? record?.targetUserId
  ?? record?.volunteer_user_id
  ?? record?.volunteerUserId
  ?? record?.assigned_user_id
  ?? record?.assignedUserId
  ?? record?.user_id
  ?? record?.userId
  ?? record?.volunteer_id
  ?? record?.volunteerId
  ?? record?.member_id
  ?? record?.memberId
  ?? record?.target_user?.id
  ?? record?.target_user?.user_id
  ?? record?.target_user?.userId
  ?? record?.volunteer?.id
  ?? record?.volunteer?.user_id
  ?? record?.volunteer?.userId
  ?? record?.user?.id
  ?? record?.user?.user_id
  ?? record?.user?.userId
  ?? '',
);

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
  const isAdminViewer = useMemo(() => {
    try {
      const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');
      const role = String(admin?.role || admin?.user_role || admin?.userType || admin?.type || '')
        .toLowerCase()
        .replace(/[_\s-]/g, '');
      return role === 'admin' || role === 'superadmin' || !!localStorage.getItem('admin_token');
    } catch {
      return !!localStorage.getItem('admin_token');
    }
  }, []);
  const currentVolunteerContext = useMemo(() => {
    const ids = new Set();
    const names = new Set();
    const read = (key) => {
      try {
        return JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        return {};
      }
    };
    const normalizeRole = (value) => String(value || '').toLowerCase().replace(/[_\s-]/g, '');
    const sources = [read('user')].filter((src) => {
      const role = normalizeRole(src?.role || src?.user_role || src?.userType || src?.type);
      return role !== 'admin' && role !== 'superadmin';
    for (const src of sources) {
      const values = [src?.id, src?.user_id, src?.volunteer_id, src?.member_id];
      const name = String(
        src?.name
        || src?.full_name
        || [src?.first_name, src?.last_name].filter(Boolean).join(' ').trim()
        || '',
      ).trim().toLowerCase();
      if (name) names.add(name);
    }
    return { ids, names };
  }, []);
  const sortedHours = useMemo(() => (
    [...hoursList].sort((a, b) => (
      new Date(resolveRecordDate(b) || 0).getTime() - new Date(resolveRecordDate(a) || 0).getTime()
    ))
  ), [hoursList]);
  const visibleHours = useMemo(() => (
    isAdminViewer
      ? sortedHours
      :
    sortedHours.filter((item) => {
      const { ids, names } = currentVolunteerContext;
      if (ids.size === 0 && names.size === 0) return false;
      const recordUserId = resolveRecordUserId(item);
      if (recordUserId && ids.has(recordUserId)) return true;

      const recordName = String(
        item?.target_user_name
        || item?.volunteer_full_name
        || item?.volunteer_name
        || item?.user?.name
        || item?.volunteer?.name
        || '',
      ).trim().toLowerCase();
      return !!recordName && names.has(recordName);
    })
  ), [sortedHours, currentVolunteerContext, isAdminViewer]);

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

        if (normalized.records.length === 0 && isAdminViewer) {
          try {
            const adminFallback = await API.get('/admin/attendance');
            normalized = normalizeHoursPayload(adminFallback?.data || {});
          } catch {
            // ignore admin fallback failure
          }
        }

        if (!active) return;
        const cached = readCachedReports();
        setHours(mergeUniqueReports(normalized.records, cached));
        setError('');
      } catch (err) {
        if (!active) return;
        const cached = readCachedReports();
        setError(err?.response?.data?.message || 'Failed to load hours');
        setHours(mergeUniqueReports([], cached));
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
    window.addEventListener('volunteer-report-cache-updated', onFocus);

    return () => {
      active = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('volunteer-report-cache-updated', onFocus);
    };
  }, [isAdminViewer]);

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
                const recordUserId = resolveRecordUserId(item);
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
});
}
