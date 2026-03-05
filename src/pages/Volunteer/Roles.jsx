import React, { useEffect, useState } from 'react';
import API from '../../api/api';

const toArray = (payload, nestedKeys = []) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;

  for (const key of nestedKeys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object' && Array.isArray(value.data)) return value.data;
  }

  return [];
};

const normalizeRole = (role) => {
  if (!role || typeof role !== 'object') return null;
  const id = role.id ?? role.role_id;
  if (id === null || id === undefined) return null;
  return { ...role, id };
};

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [applyingRoleId, setApplyingRoleId] = useState(null);

  useEffect(() => {
    let mounted = true;

    API.getVolunteerRoles()
      .then((res) => {
        const list = toArray(res?.data, ['roles', 'items']);
        if (mounted) {
          setRoles(list.map(normalizeRole).filter(Boolean));
        }
      })
      .catch((err) => {
        console.error('[VolunteerRoles] Failed to load roles:', err?.response?.data || err?.message || err);
        if (mounted) {
          setRoles([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const apply = (id) => {
    setApplyingRoleId(id);
    API.applyForVolunteerRole(id)
      .then(() => alert('Applied successfully'))
      .catch(() => alert('Error applying'))
      .finally(() => setApplyingRoleId(null));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4">
        <h2 className="text-xl font-semibold text-slate-900">Available Roles</h2>
        <p className="text-sm text-slate-600 mt-1">Choose a ministry role and submit your application.</p>
      </div>

      {roles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No available roles right now.
        </div>
      )}

      {roles.map((role) => (
        <div key={role.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between gap-3">
            <strong className="block text-lg text-slate-900">{role.name}</strong>
            <span className="rounded-full bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 whitespace-nowrap">
              Role #{role.id}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            {role.availability_required || 'No specific availability requirement provided.'}
          </p>
          <div className="border-t border-slate-200 mt-4 pt-4">
            <button
              type="button"
              onClick={() => apply(role.id)}
              disabled={applyingRoleId === role.id}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-60"
            >
              {applyingRoleId === role.id ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
