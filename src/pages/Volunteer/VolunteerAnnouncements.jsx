import React, { useEffect, useState } from 'react';
import API, { getAnnouncements } from '../../api/api';

const toAnnouncementList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  if (Array.isArray(payload.announcements)) return payload.announcements;
  if (Array.isArray(payload.data)) return payload.data;

  if (payload.data && typeof payload.data === 'object') {
    if (Array.isArray(payload.data.announcements)) return payload.data.announcements;
    if (Array.isArray(payload.data.items)) return payload.data.items;
  }

  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadAnnouncements = async () => {
      try {
        const primary = await API.getMyAnnouncements();
        let list = toAnnouncementList(primary?.data);

        if (!Array.isArray(list) || list.length === 0) {
          const fallback = await getAnnouncements();
          list = toAnnouncementList(fallback?.data);
        }

        if (isMounted) {
          setAnnouncements(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('[VolunteerAnnouncements] Failed to load announcements:', err?.response?.data || err?.message || err);
        if (isMounted) {
          setAnnouncements([]);
        }
      }
    };

    loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <h2>Announcements</h2>
      {announcements.length === 0 && <p>No announcements available.</p>}
      {announcements.map((a) => {
        const id = a.id || a.announcement_id || `${a.title}-${a.created_at || Math.random()}`;
        return (
          <div key={id}>
            <h4>{a.title || 'Untitled Announcement'}</h4>
            <p>{a.message || a.body || ''}</p>
          </div>
        );
      })}
    </>
  );
}

