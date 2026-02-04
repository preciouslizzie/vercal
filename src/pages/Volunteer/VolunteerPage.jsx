import React, { useState } from 'react';
import VolunteerLayout from './VolunteerDashboard';
import VolunteerSignup from './VolunteerSignup';
import VolunteerSchedule from './VolunteerSchedule';
import AdminScheduleForm from './AdminScheduleForm';
import AdminAnnouncementForm from './AdminAnnouncementForm';
import VolunteerAnnouncements from './VolunteerAnnouncements';
import VolunteerDiscussion from './VolunteerDiscussion';
import AdminRoleForm from './AdminRoleForm';

export default function VolunteerDashboard() {
  const [roles, setRoles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const isAdmin = true;

  return (
    <VolunteerLayout title="Volunteer">
      {isAdmin && (
        <AdminRoleForm roles={roles} onAdd={setRoles} />
      )}

      <VolunteerSignup roles={roles} />

      {isAdmin && (
        <>
          <AdminScheduleForm roles={roles} onAdd={setSchedules} />
          <AdminAnnouncementForm roles={roles} onAdd={setAnnouncements} />
        </>
      )}

      <VolunteerSchedule schedules={schedules} />
      <VolunteerAnnouncements announcements={announcements} />

      <VolunteerDiscussion />
    </VolunteerLayout>
  );
}
