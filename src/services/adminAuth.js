import adminApi from '../api/adminApi';

export const adminLogin = async (email, password) => {
  const response = await adminApi.post('/admin/login', {
    email,
    password,
  });

  return response.data;
};
