import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VolunteerSchedule from './VolunteerSchedule';
import VolunteerAnnouncements from './VolunteerAnnouncements';
import VolunteerDiscussion from './VolunteerDiscussion';
import Roles from './Roles';
import Hours from './Hours';
import AdminTab from './AdminTab';

const DEFAULT_TAB = 'schedule';

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const { tab: routeTab } = useParams();

  let authUser = {};
  try {
    authUser = JSON.parse(localStorage.getItem('admin_user') || localStorage.getItem('user') || '{}');
  } catch {
    authUser = {};
  }

  const rawRole = authUser?.role || authUser?.user_role || authUser?.userType || authUser?.type || '';
  const role = String(rawRole).toLowerCase().replace(/[_\s-]/g, '');
  const isAdmin = role === 'admin' || role === 'superadmin' || authUser?.is_admin === true;

  const volunteerTabs = useMemo(
    () => (isAdmin
      ? ['roles', 'schedule', 'announcements', 'discussions', 'reports', 'admin']
      : ['roles', 'schedule', 'announcements', 'discussions', 'reports']),
    [isAdmin],
  );

  const [tab, setTab] = useState(volunteerTabs.includes(routeTab) ? routeTab : DEFAULT_TAB);

  useEffect(() => {
    if (!routeTab) {
      setTab(DEFAULT_TAB);
      navigate(`/dashboard/volunteer/${DEFAULT_TAB}`, { replace: true });
      return;
    }

    if (volunteerTabs.includes(routeTab)) {
      setTab(routeTab);
      return;
    }

    setTab(DEFAULT_TAB);
    navigate(`/dashboard/volunteer/${DEFAULT_TAB}`, { replace: true });
  }, [routeTab, volunteerTabs, navigate]);

  if (tab === 'admin' && isAdmin) {
    return <AdminTab />;
  }

  const sectionConfig = {
    roles: {
      title: 'Volunteer Roles',
      description: 'See available roles and apply directly.',
      content: <Roles />,
    },
    schedule: {
      title: 'My Schedule',
      description: 'View your assigned volunteer shifts.',
      content: <VolunteerSchedule />,
    },
    announcements: {
      title: 'Announcements',
      description: 'Read updates relevant to your volunteer role.',
      content: <VolunteerAnnouncements />,
    },
    discussions: {
      title: 'Discussions',
      description: 'Collaborate with your volunteer group.',
      content: <VolunteerDiscussion />,
    },
    reports: {
      title: 'Hours Report',
      description: 'Track your submitted and approved hours.',
      content: <Hours />,
    },
  };

  const activeSection = sectionConfig[tab] || sectionConfig[DEFAULT_TAB];

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{activeSection.title}</h1>
        <p className="text-sm text-gray-500">{activeSection.description}</p>
      </header>

      <div className="bg-white rounded-lg shadow p-4">{activeSection.content}</div>
    </div>
  );
}
