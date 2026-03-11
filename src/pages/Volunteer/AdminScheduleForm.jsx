import React, { useState } from 'react';
import API from '../../api/api';

export default function AdminScheduleForm({ roles = [], onAdd }) {
  const [form, setForm] = useState({ role: '', date: '', time: '', location: '' });
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!form.role || !form.date || !form.time) return alert('Role, date and time are required');
    setLoading(true);
    API.createSchedule(form)
      .then((res) => {
        onAdd((prev) => [...prev, res.data]);
        setForm({ role: '', date: '', time: '', location: '' });
      })
      .catch(() => alert('Failed to assign schedule'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-700 mb-3">Assign Schedule (Admin)</h3>

      <div className="flex flex-wrap gap-4">
        <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="">Select role</option>
          {roles.map((r) => <option key={r.id || r.name} value={r.id || r.name}>{r.name}</option>)}
        </select>

        <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />

        <input type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />

        <input placeholder="Location" className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />

        <button type="button" onClick={submit} className="button" disabled={loading}>{loading ? 'Assigning...' : 'Assign'}</button>
      </div>
    </div>
  );
}
