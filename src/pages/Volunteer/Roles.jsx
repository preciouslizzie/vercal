import React, { useEffect, useState } from 'react';
import API from '../../api/api';

export default function Roles() {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    API.get('/volunteer/roles').then((res) => {
      setRoles(res.data);
    });
  }, []);

  const apply = (id) => {
    API.post(`/volunteer/apply/${id}`)
      .then(() => alert('Applied successfully'))
      .catch(() => alert('Error applying'));
  };

  return (
    <>
      <h2>Available Roles</h2>
      {roles.map((role) => (
        <div key={role.id}>
          <strong>{role.name}</strong>
          <p>{role.availability_required}</p>
          <button
            type="button"
            onClick={() => apply(role.id)}
          >Apply
          </button>
        </div>
      ))}
    </>
  );
}
