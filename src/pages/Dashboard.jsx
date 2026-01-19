import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaCalendarAlt,
  FaBible,
  FaDonate,
} from 'react-icons/fa';
import API from '../api/api';

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
    Donations: 0,
  });

  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [members, events, sermons, donations] = await Promise.all([
        API.get('/members').catch(() => ({ data: [] })),
        API.get('/events').catch(() => ({ data: [] })),
        API.get('/audio').catch(() => ({ data: [] })),
        API.get('/pay').catch(() => ({ data: [] })),
      ]);

      setStats({
        members: members.data.length,
        events: events.data.length,
        sermons: sermons.data.length,
        donations: donations.data.length,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
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
        </div>
      )}
    </div>
  );
};

export default Dashboard;
