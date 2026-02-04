import React, { useEffect, useState } from 'react';
import API from '../../api/api';

export default function VolunteerDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('This Week');

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    API.getVolunteerRoles().then((res) => setRoles(res.data));
  }, []);

  const [myRole, setMyRole] = useState('No role yet');

  useEffect(() => {
    API.getVolunteerRoles().then((res) => {
      const assigned = res.data.find((r) => r.assigned === true);
      if (assigned) setMyRole(assigned.name);
    });
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2>👋 Welcome, Volunteer</h2>
        <select
          style={styles.dropdown}
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option>This Week</option>
          <option>This Month</option>
          <option>This Year</option>
        </select>
      </div>

      {/* Cards */}
      <div style={styles.cardGrid}>
        <Card
          title="My Role"
          emoji="🎭"
          value="Media Team"
          subtitle="Active role"
        />

        <Card
          title="My Role"
          emoji="🎭"
          value={myRole}
          subtitle="Assigned"
        />

        <Card
          title="Announcements"
          emoji="📣"
          value="2 New"
          subtitle="Unread messages"
        />

        <Card
          title="Discussions"
          emoji="💬"
          value="5 Topics"
          subtitle="Group chats"
        />

        <Card
          title="Hours Worked"
          emoji="⏱️"
          value="18 hrs"
          subtitle={selectedPeriod}
        />
      </div>

      {/* Sections */}
      <div style={styles.sectionGrid}>
        <Section title="📅 Upcoming Schedule">
          <ListItem text="Sunday Service – Media Booth" />
          <ListItem text="Wednesday Rehearsal" />
        </Section>

        <Section title="📣 Latest Announcements">
          <ListItem text="Arrive early this Sunday" />
          <ListItem text="Training session next week" />
        </Section>
      </div>
    </div>
  );
}

/* ====================== COMPONENTS ====================== */

function Card({ title, emoji, value, subtitle }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardEmoji}>{emoji}</div>
      <h4>{title}</h4>
      <h2>{value}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function ListItem({ text }) {
  return <div style={styles.listItem}>• {text}</div>;
}

/* ====================== STYLES ====================== */

const styles = {
  container: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dropdown: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    cursor: 'pointer',
  },

  cardGrid: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },

  card: {
    flex: '1 1 220px',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
    transition: 'transform 0.2s',
  },

  cardEmoji: {
    fontSize: '28px',
  },

  sectionGrid: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },

  section: {
    flex: '1 1 400px',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
  },

  listItem: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#555',
  },
};
