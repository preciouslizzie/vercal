import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaCalendarAlt,
  FaBible,
  FaDonate,
} from 'react-icons/fa';
import API from '../api/api';

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

const isAdminLike = (item) => {
  const roleValue = String(item?.role || item?.user_role || item?.type || '').toLowerCase();
  const normalized = roleValue.replace(/[_\s-]/g, '');
  return item?.is_admin === true || normalized === 'admin' || normalized === 'superadmin' || roleValue.includes('admin');
};

const normalizeMember = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ?? raw.member_id ?? raw.user_id;
  const fullName = [raw.first_name, raw.last_name].filter(Boolean).join(' ').trim();
  const name = raw.name || raw.full_name || fullName || raw.username || '';
  const email = raw.email || raw.mail || '';
  const role = raw.role || raw.user_role || raw.type || 'member';

  if (!id && !name && !email) return null;
  return {
    ...raw,
    id: id ?? `${email}-${name}`,
    name: name || '-',
    email: email || '-',
    role,
  };
};

const extractMembers = (payload) => (
  toArray(payload, ['members', 'items', 'users'])
    .map(normalizeMember)
    .filter(Boolean)
    .filter((m) => !isAdminLike(m))
);

const readRecentMembersCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem('recent_members') || '[]');
    return Array.isArray(cached)
      ? cached.map(normalizeMember).filter(Boolean).filter((m) => !isAdminLike(m))
      : [];
  } catch {
    return [];
  }
};

const mergeMembers = (apiMembers, cachedMembers) => Array.from(
  new Map(
    [...apiMembers, ...cachedMembers]
      .filter(Boolean)
      .map((m) => [String(m.id || `${m.email}-${m.name}`), m]),
  ).values(),
);

const StatCard = ({ title, value, icon, color, onClick }) => (
  <div
    onClick={onClick} // use the passed prop
    onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    role="button"
    tabIndex={0}
    className="
      bg-white
      p-5 sm:p-6
      rounded-2xl
      shadow
      cursor-pointer
      transition-all
      duration-300
      hover:shadow-xl
      hover:-translate-y-1
      focus:outline-none
      focus:ring-2
      focus:ring-indigo-500
      focus:ring-offset-2
    "
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">
          {value}
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          View details →
        </p>
      </div>

      <div
        className={`
          text-white
          text-xl sm:text-2xl
          p-3 sm:p-4
          rounded-full
          ${color}
        `}
      >
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    members: 0,
    events: 0,
    audios: 0,
    donations: 0,
    volunteer: 0,
  });

  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [members, users, events, sermons, donations, volunteer] = await Promise.all([
        API.get('/members').catch(() => ({ data: [] })),
        API.get('/admin/users').catch(() => ({ data: [] })),
        API.get('/events').catch(() => ({ data: [] })),
        API.get('/audio').catch(() => ({ data: [] })),
        API.get('/pay').catch(() => ({ data: [] })),
        API.get('/volunteer').catch(() => ({ data: [] })),
      ]);

      let membersList = mergeMembers(extractMembers(members.data), extractMembers(users.data));
      membersList = mergeMembers(membersList, readRecentMembersCache());
      const eventsList = toArray(events.data, ['events', 'items']);
      const sermonsList = toArray(sermons.data, ['audio', 'audios', 'sermons', 'items']);
      const donationsList = toArray(donations.data, ['donations', 'payments', 'items']);
      const volunteersList = toArray(volunteer.data, ['volunteers', 'users', 'items']);

      setStats({
        members: membersList.length,
        events: eventsList.length,
        sermons: sermonsList.length,
        donations: donationsList.length,
        volunteer: volunteersList.length,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    const handleMembersUpdated = () => {
      loadStats();
    };

    window.addEventListener('members:updated', handleMembersUpdated);
    window.addEventListener('focus', handleMembersUpdated);

    return () => {
      window.removeEventListener('members:updated', handleMembersUpdated);
      window.removeEventListener('focus', handleMembersUpdated);
    };
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Church Dashboard</h1>

      {loading ? (
        <div className="text-center py-20 text-gray-400">
          Loading dashboard...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Members"
            value={stats.members}
            icon={<FaUsers />}
            color="bg-indigo-600"
            onClick={() => navigate('/members')}
          />

          <StatCard
            title="Events"
            value={stats.events}
            icon={<FaCalendarAlt />}
            color="bg-emerald-600"
            onClick={() => navigate('/events')}
          />

          <StatCard
            title="Sermons"
            value={stats.sermons}
            icon={<FaBible />}
            color="bg-amber-600"
            onClick={() => navigate('/sermons')}
          />

          <StatCard
            title="Donations"
            value={stats.donations}
            icon={<FaDonate />}
            color="bg-rose-600"
            onClick={() => navigate('/donations')}
          />

          <StatCard
            title="Volunteers"
            value={stats.volunteer}
            icon={<FaUsers />}
            color="bg-blue-600"
            onClick={() => navigate('/volunteer')}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
