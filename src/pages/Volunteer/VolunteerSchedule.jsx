import React, { useEffect, useState } from 'react';
import API from '../../api/api';

export default function Schedule() {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    API.get('/my-schedule').then((res) => {
      setSchedule(res.data);
    });
  }, []);

  return (
    <>
      <h2>My Schedule</h2>
      {schedule.map((item) => (
        <div key={item.id}>
          <p>{item.date} - {item.location}</p>
        </div>
      ))}
    </>
  );
}
