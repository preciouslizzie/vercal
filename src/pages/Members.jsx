import React, { useEffect, useState } from 'react';
import API from '../api/api';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'member',
    position: 'None',
  });

  const [editingId, setEditingId] = useState(null);

  // Load Members
  const loadMembers = async () => {
    try {
      const res = await API.get('/members');
      setMembers(res.data);
    } catch (err) {
      console.error('Failed to load members:', err);
      const message = err.response?.data?.message || err.message || 'Failed to load members';
      alert(`Error loading members: ${message}`);
      setMembers([]);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Create or Update Member
  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      alert('Name and email required');
      return;
    }

    setLoading(true);

    try {
      const payload = { ...form };

      if (editingId) {
        await API.put(`/members/${editingId}`, payload);
      } else {
        await API.post('/members', payload);
      }

      setForm({
        name: '',
        email: '',
        role: 'member',
        position: 'None',
      });

      setEditingId(null);
      await loadMembers();
    } catch (e) {
      console.error(e);
      alert('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Delete Member
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this member?')) return;
    await API.delete(`/members/${id}`);
    loadMembers();
  };

  // Start Edit
  const startEdit = (m) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      email: m.email,
      role: m.role || 'member',
      position: m.position || 'None',
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Church Members</h2>

      {/* Form */}
      <div className="bg-white p-6 rounded-xl shadow mb-10">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          {editingId ? 'Update Member' : 'Add Member'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            className="border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <select
            className="border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="member">Member</option>
            <option value="worker">Worker</option>
            <option value="admin">Admin</option>
          </select>

          <select
            className="border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
          >
            <option value="None">None</option>
            <option value="Pastor">Pastor</option>
            <option value="Usher">Usher</option>
            <option value="Choir">Choir</option>
            <option value="Media">Media</option>
            <option value="Protocol">Protocol</option>
            <option value="Children Ministry">Children Ministry</option>
          </select>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow transition"
          >
            {loading
              ? 'Saving...'
              : editingId
                ? 'Update Member'
                : 'Add Member'}
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Position</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50 transition">
                <td className="p-4 font-medium">{m.name}</td>
                <td className="p-4 text-gray-600">{m.email}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700">
                    {m.role}
                  </span>
                </td>
                <td className="p-4">
                  {m.position !== 'None' ? (
                    <span className="px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700">
                      {m.position}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="p-4 text-right space-x-3">
                  <button
                    onClick={() => startEdit(m)}
                    className="text-indigo-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {members.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">
                  No members yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Members;
