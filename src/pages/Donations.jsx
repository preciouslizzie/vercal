import React, { useState } from 'react';
import { Header } from '../components';
import API from '../api/api';

const Donations = () => {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [eventId, setEventId] = useState(1);
  const [loading, setLoading] = useState(false);

  const donate = async () => {
    if (!email || !amount || !eventId) {
      alert('All fields are required');
      return;
    }

    try {
      setLoading(true);

      const res = await API.post('/pay', {
        email,
        amount: Number(amount),
        event_id: Number(eventId),
      });

      // Paystack redirect
      window.location.href = res.data.authorization_url;
    } catch (err) {
      console.error(err.response?.data);
      alert('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-2 md:m-10 mt-24 p-6 bg-white rounded-3xl">
      <Header category="Finance" title="Donations" />

      <div className="space-y-4 max-w-md">
        <input
          className="border p-2 rounded w-full"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="number"
          className="border p-2 rounded w-full"
          placeholder="Amount (NGN)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          type="number"
          className="border p-2 rounded w-full"
          placeholder="Event ID"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        />

        <button
          onClick={donate}
          className="bg-green-600 text-white px-6 py-2 rounded w-full"
        >
          {loading ? 'Redirecting to Paystack…' : 'Donate'}
        </button>
      </div>
    </div>
  );
};

export default Donations;
