import React, { useState } from 'react';

export default function AdminRoleForm({ roles, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    availability: '',
  });

  const submit = () => {
    if (!form.name || !form.availability) return;

    onAdd((prev) => [...prev, form]);
    setForm({ name: '', availability: '' });
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-700 mb-3">
        Create Volunteer Role
      </h3>

      <div className="flex flex-wrap gap-4">
        <input
          placeholder="Role name (e.g Choir)"
          className="rounded-lg border px-4 py-2 text-sm"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Availability (e.g Sundays 7am – 10am)"
          className="rounded-lg border px-4 py-2 text-sm flex-1"
          value={form.availability}
          onChange={(e) => setForm({ ...form, availability: e.target.value })}
        />

        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-teal-500 px-5 py-2 text-sm text-white"
        >
          Add Role
        </button>
      </div>

      {roles.length > 0 && (
        <div className="mt-4 space-y-2 text-sm">
          {roles.map((r, i) => (
            <div
              key={i}
              className="flex justify-between rounded-md bg-gray-50 px-4 py-2"
            >
              <span className="font-medium">{r.name}</span>
              <span className="text-gray-500">{r.availability}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
