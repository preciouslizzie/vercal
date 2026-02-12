import React, { useEffect, useState } from 'react';
import API from '../../api/api';

export default function Discussions() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    API.get('/volunteer/groups').then((res) => {
      setGroups(res.data);
    });
  }, []);

  return (
    <>
      <h2>Groups</h2>
      {groups.map((group) => (
        <div key={group.id}>
          <strong>{group.name}</strong>
        </div>
      ))}
    </>
  );
}

