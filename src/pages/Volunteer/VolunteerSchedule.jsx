import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { getSchedules as getAdminSchedules } from '../../api/adminApi';

const toArray = (payload, nestedKeys = []) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;

  for (const key of nestedKeys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object' && Array.isArray(value.data)) return value.data;
  }

  return [];
};

const looksLikeSchedule = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value).map((k) => k.toLowerCase());
  const markers = [
    'schedule_id',
    'role_id',
    'scheduled_date',
    'schedule_date',
    'date',
    'start_time',
    'end_time',
    'starts_at',
    'location',
    'venue',
    'place',
    'user_id',
    'volunteer_id',
    'member_id',
    'role_name',
  ];
  const score = markers.reduce((sum, marker) => (keys.includes(marker) ? sum + 1 : sum), 0);
  return score >= 2 || (keys.includes('id') && (keys.includes('date') || keys.includes('start_time')));
};

const isObjectMapOfSchedules = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const vals = Object.values(value);
  if (vals.length === 0) return false;
  return vals.some((v) => looksLikeSchedule(v));
};

const findSchedulesDeep = (payload, depth = 0) => {
  if (depth > 5 || payload === null || payload === undefined) return [];
  if (Array.isArray(payload)) {
    if (payload.some((item) => looksLikeSchedule(item))) return payload;
    for (const item of payload) {
      const found = findSchedulesDeep(item, depth + 1);
      if (found.length > 0) return found;
    }
    return [];
  }

  if (typeof payload !== 'object') return [];

  if (isObjectMapOfSchedules(payload)) {
    return Object.values(payload);
  }

  for (const value of Object.values(payload)) {
    const found = findSchedulesDeep(value, depth + 1);
    if (found.length > 0) return found;
  }

  return [];
};

const findAnyObjectArrayDeep = (payload, depth = 0) => {
  if (depth > 5 || payload === null || payload === undefined) return [];
  if (Array.isArray(payload)) {
    if (payload.some((item) => item && typeof item === 'object' && !Array.isArray(item))) return payload;
    for (const item of payload) {
      const found = findAnyObjectArrayDeep(item, depth + 1);
      if (found.length > 0) return found;
    }
    return [];
  }
  if (typeof payload !== 'object') return [];
  for (const value of Object.values(payload)) {
    const found = findAnyObjectArrayDeep(value, depth + 1);
    if (found.length > 0) return found;
  }
  return [];
};

const extractDateFromValue = (value) => {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().split('T')[0];
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  const isoMatch = trimmed.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];

  return '';
};

const resolveScheduleDate = (item) => {
  const candidates = [
    item?.date,
    item?.schedule_date,
    item?.scheduled_date,
    item?.scheduled_for,
    item?.service_date,
    item?.shift_date,
    item?.event_date,
    item?.starts_at,
    item?.start_at,
    item?.created_at,
  ];

  for (const value of candidates) {
    const extracted = extractDateFromValue(value);
    if (extracted) return extracted;
  }

  for (const [key, value] of Object.entries(item || {})) {
    const keyLower = String(key).toLowerCase();
    if (!keyLower.includes('date') && !keyLower.endsWith('_at') && !keyLower.endsWith('at')) continue;
    const extracted = extractDateFromValue(value);
    if (extracted) return extracted;
  }

  return '';
};

const resolveTime = (item, type = 'start') => {
  const candidates = type === 'start'
    ? [item?.start_time, item?.starts_at, item?.start_at, item?.time]
    : [item?.end_time, item?.ends_at, item?.end_at];

  for (const value of candidates) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const hhmmss = trimmed.match(/\b(\d{1,2}:\d{2})(:\d{2})?\b/);
    if (hhmmss) return hhmmss[1];
    return trimmed;
  }

  return '';
};

const normalizeRole = (role) => {
  if (!role || typeof role !== 'object') return null;
  const id = role.id ?? role.role_id;
  if (id === null || id === undefined) return null;
  return { ...role, id: String(id), name: role.name || role.title || role.role_name || '' };
};

const normalizeSchedule = (item) => {
  if (!item || typeof item !== 'object') return null;
  const sched = item?.data && typeof item.data === 'object' ? item.data : item;
  const generatedId = `${resolveScheduleDate(sched) || 'no-date'}-${sched.role_id ?? sched.role?.id ?? sched.role_name ?? 'no-role'}-${sched.user_id ?? sched.user?.id ?? sched.volunteer_id ?? 'no-user'}-${sched.location ?? sched.venue ?? sched.place ?? 'no-location'}`;
  const id = sched.id ?? sched.schedule_id ?? generatedId;

  return {
    ...sched,
    id: String(id),
    user_id: String(sched.user_id ?? sched.user?.id ?? sched.volunteer_id ?? sched.member_id ?? ''),
    role_id: String(sched.role_id ?? sched.role?.id ?? sched.volunteer_role_id ?? ''),
    role_name: sched.role?.name || sched.role_name || sched.roleTitle || '',
    date: resolveScheduleDate(sched),
    start_time: resolveTime(sched, 'start'),
    end_time: resolveTime(sched, 'end'),
    location: sched.location || sched.venue || sched.place || '-',
  };
};

export default function Schedule() {
  const [schedule, setSchedule] = useState([]);
  const [rolesById, setRolesById] = useState({});

  useEffect(() => {
    let mounted = true;

    const getCurrentUserIds = () => {
      const ids = new Set();
      const sources = ['user', 'admin_user'];
      for (const key of sources) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || '{}');
          const possible = [parsed?.id, parsed?.user_id, parsed?.volunteer_id, parsed?.member_id];
          possible.forEach((val) => {
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              ids.add(String(val));
            }
          });
        } catch {
          // ignore malformed localStorage value
        }
      }
      return ids;
    };

    const isCurrentAdmin = () => {
      try {
        const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');
        const role = String(admin?.role || admin?.user_role || admin?.type || '').toLowerCase().replace(/[_\s-]/g, '');
        return admin?.is_admin === true || role === 'admin' || role === 'superadmin';
      } catch {
        return false;
      }
    };
    const adminView = isCurrentAdmin();

    const extractScheduleArray = (payload) => {
      const direct = toArray(payload, ['schedules', 'items', 'schedule']);
      if (direct.length > 0) return direct;
      const deepSchedule = findSchedulesDeep(payload);
      if (deepSchedule.length > 0) return deepSchedule;
      return findAnyObjectArrayDeep(payload);
    };

    const loadSchedule = async () => {
      try {
        const [primary, fallbackPhp, fallbackApi, adminSchedulesRes, rolesRes] = await Promise.all([
          API.getMySchedule().catch(() => ({ data: [] })),
          API.get('/volunteer/schedule/get.php').catch(() => ({ data: [] })),
          API.getSchedules().catch(() => ({ data: [] })),
          adminView ? getAdminSchedules().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          API.getVolunteerRoles().catch(() => ({ data: [] })),
        ]);
        const primaryList = extractScheduleArray(primary?.data);
        const phpList = extractScheduleArray(fallbackPhp?.data);
        const apiList = extractScheduleArray(fallbackApi?.data);
        const adminList = extractScheduleArray(adminSchedulesRes?.data);
        let list = [...primaryList, ...phpList, ...apiList, ...adminList];
        const rolesList = toArray(rolesRes?.data, ['roles', 'items']).map(normalizeRole).filter(Boolean);

        console.debug('[VolunteerSchedule] source counts', {
          primary: primaryList.length,
          php: phpList.length,
          api: apiList.length,
          admin: adminList.length,
          roles: rolesList.length,
          currentUser: localStorage.getItem('user'),
          currentAdmin: localStorage.getItem('admin_user'),
        });

        const normalized = list.map(normalizeSchedule).filter(Boolean);
        const deduped = Array.from(new Map(normalized.map((item) => [item.id, item])).values());
        const currentUserIds = getCurrentUserIds();

        let visible = deduped;
        if (!adminView && currentUserIds.size > 0) {
          const filtered = deduped.filter((item) => currentUserIds.has(String(item.user_id || '')));
          if (filtered.length > 0) {
            visible = filtered;
          } else if (primaryList.length > 0) {
            // If personal endpoint returned items without user_id, keep that as trusted source.
            visible = primaryList.map(normalizeSchedule).filter(Boolean);
          }
        }

        console.debug('[VolunteerSchedule] normalized counts', {
          merged: list.length,
          deduped: deduped.length,
          visible: visible.length,
          userIds: Array.from(currentUserIds),
        });

        if (mounted) {
          setSchedule(visible);
          setRolesById(
            rolesList.reduce((acc, role) => {
              acc[role.id] = role.name || '';
              return acc;
            }, {}),
          );
        }
      } catch (err) {
        console.error('[VolunteerSchedule] Failed to load schedule:', err?.response?.data || err?.message || err);
        if (mounted) {
          setSchedule([]);
        }
      }
    };

    loadSchedule();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4">
        <h2 className="text-xl font-semibold text-slate-900">My Schedule</h2>
        <p className="text-sm text-slate-600 mt-1"></p>
      </div>

      {schedule.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No schedule assigned yet.
        </div>
      )}

      {schedule.map((item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-full bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1">
              {item.date || 'No Date'}
            </span>
            {(item.start_time || item.end_time) && (
              <span className="rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1">
                {item.start_time || '--:--'}{item.end_time ? ` - ${item.end_time}` : ''}
              </span>
            )}
            <span className="rounded-full bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1">
              {item.role_name || rolesById[item.role_id] || 'Unassigned Role'}
            </span>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-800">Location: </span>
              {item.location || '-'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
