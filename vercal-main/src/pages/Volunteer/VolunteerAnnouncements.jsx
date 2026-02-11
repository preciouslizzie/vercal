import React, { useEffect, useState } from 'react';
import API from '../../api/api';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    API.get('/announcements').then((res) => {
      setAnnouncements(res.data);
    });
  }, []);

  return (
    <>
      <h2>Announcements</h2>
      {announcements.map((a) => (
        <div key={a.id}>
          <h4>{a.title}</h4>
          <p>{a.message}</p>
        </div>
      ))}
    </>
  );
}
