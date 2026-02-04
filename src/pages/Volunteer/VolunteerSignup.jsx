import React, { useState } from 'react';

export default function VolunteerSignup({ roles }) {
  const [selectedRole, setSelectedRole] = useState('');

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-700 mb-3">
        Select Volunteer Role
      </h3>

      <select
        className="
          min-w-[260px]
          rounded-lg
          border
          px-4 py-2
          text-sm
          focus:outline-none
          focus:ring-2
          focus:ring-teal-500
        "
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        <option value="">Select role</option>

        {roles.map((role, i) => (
          <option key={i} value={role.name}>
            {role.name} — {role.availability}
          </option>
        ))}
      </select>
    </div>
  );
}
