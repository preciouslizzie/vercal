import React, { useEffect, useState } from 'react';
import API from '../../api/api';

export default function Hours() {
  const [hours, setHours] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [error, setError] = useState('');
  const hoursList = Array.isArray(hours) ? hours : [];

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await API.get('/volunteer/hours-worked');
        const payload = res.data || {};

        const records = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.attendance_records)
            ? payload.attendance_records
            : Array.isArray(payload.attendance_records?.data)
              ? payload.attendance_records.data
              : [];

        setHours(Array.isArray(records) ? records : []);
        setTotalHours(Number(payload.total_hours || 0));
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load hours');
        setHours([]);
        setTotalHours(0);
      }
    };

    fetchHours();
  }, []);

  return (
    <>
      <h2>My Hours</h2>
      <p>Total Hours: {totalHours}</p>
      {error && <p>{error}</p>}
      {hoursList.map((h) => (
        <div key={h.id}>
          <p>{h.schedule?.date || 'No date'}: {h.hours_worked ?? 0} hours</p>
        </div>
      ))}
    </>
  );
}
