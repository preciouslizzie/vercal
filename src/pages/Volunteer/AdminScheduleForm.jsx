import React, { useState } from 'react';

const ROLES = ['Usher', 'Choir', 'Children Church', 'Media', 'Dance'];

export default function AdminScheduleForm({ onAdd }) {
  const [form, setForm] = useState({
    role: '',
    date: '',
    time: '',
    location: '',
  });

  const submit = () => {
    onAdd((prev) => [...prev, form]);
    setForm({ role: '', date: '', time: '', location: '' });
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-700 mb-3">
        Assign Schedule (Admin)
      </h3>

      <div className="flex flex-wrap gap-4">
        <select
          className="input"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="">Select role</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>

        <input
          type="date"
          className="input"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <input
          type="time"
          className="input"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
        />

        <input
          placeholder="Location"
          className="input"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <button
          type="button"
          onClick={submit}
          className="button"
        >
          Assign
        </button>
      </div>
    </div>
  );
}
