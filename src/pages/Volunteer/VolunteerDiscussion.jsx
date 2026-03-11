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

export default function Discussions() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    API.getVolunteerGroups()
      .then((res) => {
        setGroups(toArray(res?.data, ['groups', 'items']));
      })
      .catch(() => {
        setGroups([]);
      });
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Department Groups</h2>
      {groups.length === 0 && <p>No groups available yet.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => {
          const whatsappLink = group.whatsapp_link || group.whatsapp_url || group.invite_link || group.link || '';
          return (
            <div key={group.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <strong className="block text-base">{group.name}</strong>
              <p className="text-sm text-gray-600 mt-1">{group.description || 'No description'}</p>
              <p className="text-xs text-gray-500 mt-2">Department: {group.department || group.name || '-'}</p>

              {whatsappLink ? (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700"
                >
                  Join WhatsApp Group
                </a>
              ) : (
                <p className="text-xs text-amber-600 mt-3">WhatsApp link not yet provided.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
