  // Test API configuration
const testAPI = async () => {
  const baseURL = 'http://127.0.0.1:8000/api';
  const token = localStorage.getItem('admin_token');

  console.log('=== API Test Debug ===');
  console.log('Base URL:', baseURL);
  console.log('Token exists:', !!token);
  console.log('Token value:', token ? token.substring(0, 50) + '...' : 'NO TOKEN');

  if (!token) {
    console.warn('⚠️  No admin token found! Make sure you are logged in as admin.');
    return;
  }

  try {
    // Test /admin/roles endpoint
    const testEndpoint = '/admin/roles';
    const fullURL = baseURL + testEndpoint;
    console.log(`Testing endpoint: ${fullURL}`);

    const response = await fetch(fullURL, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok) {
      console.log('✅ API is working correctly!');
    } else {
      console.log('❌ API returned error:', data.message || data);
    }
  } catch (err) {
    console.error('❌ API test failed:', err.message);
  }
};

// Run test if needed
if (typeof window !== 'undefined' && window.__DEBUG_API__) {
  testAPI();
}

export { testAPI };
