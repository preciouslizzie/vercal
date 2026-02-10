import React, { useState } from 'react';
import API from '../../api/api';

export default function VolunteerSignup({ roles }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  const apply = () => {
    if (!selectedRole) return alert('Please select a role');
    setLoading(true);
    API.applyForVolunteerRole(selectedRole)
      .then(() => alert('Applied successfully'))
      .catch(() => alert('Failed to apply'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-700 mb-3">Select Volunteer Role</h3>

      <div className="flex gap-3 items-center">
        <select
          className="min-w-[260px] rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="">Select role</option>

          {roles.map((role, i) => (
            <option key={i} value={role.id || role.name}>
              {role.name} — {role.availability}
            </option>
          ))}
        </select>

        <button disabled={loading} onClick={apply} className="button">
          {loading ? 'Applying...' : 'Apply'}
        </button>
      </div>
    </div>
  );
}
