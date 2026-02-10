import React, { useState } from 'react';
import API from '../../api/api';

const ROLES = ['Usher', 'Choir', 'Children Church', 'Media', 'Dance'];

export default function AdminAnnouncementForm({ onAdd }) {
  const [form, setForm] = useState({ role: '', title: '', message: '' });
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!form.title || !form.message) return alert('Title and message are required');
    setLoading(true);
    API.createAnnouncement(form)
      .then((res) => {
        onAdd((prev) => [...prev, res.data]);
        setForm({ role: '', title: '', message: '' });
      })
      .catch(() => alert('Failed to send announcement'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-700 mb-3">Create Announcement (Admin)</h3>

      <div className="flex flex-wrap gap-4">
        <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="">Select role</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>

        <input placeholder="Title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <input placeholder="Message" className="input flex-1" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />

        <button type="button" onClick={submit} className="button" disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
      </div>
    </div>
  );
}
