import React, { useEffect, useMemo, useState } from 'react';
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

const formatDate = (value) => {
  if (!value) return 'No date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'No date';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const resolveSentDate = (announcement) => (
  announcement?.sent_at
  || announcement?.sent_date
  || announcement?.published_at
  || announcement?.created_at
  || announcement?.updated_at
  || announcement?.date
  || ''
);

const resolvePriority = (announcement) => {
  const raw = String(
    announcement?.priority
    || announcement?.level
    || announcement?.importance
    || 'normal',
  ).toLowerCase();

  if (raw.includes('high') || raw.includes('urgent') || raw.includes('critical')) return 'high';
  if (raw.includes('low')) return 'low';
  return 'normal';
};

const priorityStyles = {
  high: 'bg-rose-100 text-rose-700 ring-rose-200',
  normal: 'bg-amber-100 text-amber-700 ring-amber-200',
  low: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
};

const prettyPriority = {
  high: 'High Priority',
  normal: 'Normal',
  low: 'Low Priority',
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

  const sortedAnnouncements = useMemo(() => (
    [...announcements].sort((a, b) => {
      const aTime = new Date(a?.created_at || a?.updated_at || a?.date || 0).getTime();
      const bTime = new Date(b?.created_at || b?.updated_at || b?.date || 0).getTime();
      return bTime - aTime;
    })
  ), [announcements]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-orange-50 via-white to-cyan-50 p-5 md:p-7">
      <div className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-orange-200/50 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-cyan-200/50 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Volunteer Hub</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">Announcements</h2>
            <p className="mt-1 text-sm text-slate-600">Latest updates from your admin team.</p>
          </div>
          <span className="rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur">
            {sortedAnnouncements.length} {sortedAnnouncements.length === 1 ? 'Update' : 'Updates'}
          </span>
        </div>

        {sortedAnnouncements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center backdrop-blur-sm">
            <p className="text-base font-semibold text-slate-700">No announcements available</p>
            <p className="mt-1 text-sm text-slate-500">New notices will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {sortedAnnouncements.map((a, index) => {
              const id = a.id || a.announcement_id || `${a.title}-${a.created_at || index}`;
              const priority = resolvePriority(a);
              const sentOn = formatDate(resolveSentDate(a));

              return (
                <article
                  key={id}
                  className="group relative rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h4 className="text-base font-semibold text-slate-900 md:text-lg">
                      {a.title || 'Untitled Announcement'}
                    </h4>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${priorityStyles[priority]}`}>
                      {prettyPriority[priority]}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-700">
                    {a.message || a.body || 'No message provided.'}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
                    <span>Sent on {sentOn}</span>
                    {a.author_name && <span>By {a.author_name}</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
