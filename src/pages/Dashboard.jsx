import React, { useEffect, useState } from 'react';
import {
  FaUsers,
  FaCalendarAlt,
  FaBible,
  FaDonate,
} from 'react-icons/fa';
import API from '../api/api';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-6 hover:shadow-lg transition">
    <div className={`p-4 rounded-full text-white ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    members: 0,
    events: 0,
    audio: 0,
    pay: 0,
  });

  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);

    try {
      const membersRes = await API.get('/members').catch(() => ({ data: [] }));
      const eventsRes = await API.get('/events').catch(() => ({ data: [] }));
      const sermonsRes = await API.get('/audio').catch(() => ({ data: [] }));
      const donationsRes = await API.get('/pay').catch(() => ({ data: [] }));

      setStats({
        members: membersRes.data?.length || 0,
        events: eventsRes.data?.length || 0,
        audio: sermonsRes.data?.length || 0,
        pay: donationsRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Church Dashboard
        </h1>
        <p className="text-gray-500">
          Overview of church activities and records
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="text-center text-gray-400 py-20">
          Loading dashboard...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Members"
            value={stats.members}
            icon={<FaUsers size={28} />}
            color="bg-indigo-600"
          />
          <StatCard
            title="Events"
            value={stats.events}
            icon={<FaCalendarAlt size={28} />}
            color="bg-emerald-600"
          />
          <StatCard
            title="Sermons"
            value={stats.audio}
            icon={<FaBible size={28} />}
            color="bg-amber-600"
          />
          <StatCard
            title="Donations"
            value={stats.pay}
            icon={<FaDonate size={28} />}
            color="bg-rose-600"
          />
        </div>
      )}

      {/* Welcome, Panel */}
      <div className="mt-10 bg-white rounded-2xl shadow p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Welcome 👋
        </h2>
        <p className="text-gray-600 max-w-3xl">
          This dashboard gives you a quick overview of your church operations.
          Use the sidebar to manage members, events, sermons, and donations.
          All data updates automatically from the backend.
        </p>
      </div>

    </div>
  );
};

export default Dashboard;
