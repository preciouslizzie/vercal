import React, { useEffect, useState } from 'react';
import API from '../../api/api';

export default function Hours() {
  const [hours, setHours] = useState([]);

  useEffect(() => {
    API.get('/volunteer/hours-worked').then((res) => {
      setHours(res.data);
    });
  }, []);

  return (
    <>
      <h2>My Hours</h2>
      {hours.map((h) => (
        <div key={h.id}>
          <p>{h.date}: {h.hours} hours</p>
        </div>
      ))}
    </>
  );
}
