// Thin fetch wrapper: every API call goes through here so errors are handled the same way.
async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const { idempotencyKey, ...fetchOptions } = options;

  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    ...fetchOptions.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // const res = await fetch(`https://cognition-dean-octagon.ngrok-free.dev/api${path}`, {
  // const res = await fetch(`http://localhost:3001/api${path}`, {
  //   ...options,
  //   headers,
  //   body: options.body ? JSON.stringify(options.body) : undefined,
  // });
  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }

    const error = new Error(body.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.errors = body.errors;
    throw error;
  }

  return body;
}

export const api = {
  // --- AUTH APIs ---
  login(credentials) {
    return request('/auth/login', { method: 'POST', body: credentials }).then((body) => body.data);
  },

  register(userData) {
    return request('/auth/register', { method: 'POST', body: userData }).then((body) => body.data);
  },
  verifyEmail(data) {
    return request('/auth/verify-email', { method: 'POST', body: data });
  },
  googleLogin(idToken) {
    return request('/auth/google', { method: 'POST', body: { idToken } });
  },

  googleRegister(data) {
    return request('/auth/google-register', { method: 'POST', body: data }).then((body) => body.data);
  },

  // --- GAMES APIs ---
  getGames(params = {}, { signal } = {}) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
    );
    const queryString = query.toString();

    return request(`/games${queryString ? `?${queryString}` : ''}`, { signal });
  },
  getStats() {
    return request('/games/stats').then((body) => body.data);
  },

  updateGame(id, changes) {
    return request(`/games/${id}`, { method: 'PATCH', body: changes }).then((body) => body.data);
  },

  createGame(data) {
    return request('/games', { method: 'POST', body: data }).then((body) => body.data);
  },

  deleteGame(id) {
    return request(`/games/${id}`, { method: 'DELETE' });
  },

  bulkUpdateGames(ids, active) {
    return request('/games/bulk', {
      method: 'PATCH',
      body: { ids, isActive: active },
    }).then((body) => body.data);
  },

  // --- VENDORS APIs ---
  getVendors() {
    return request('/vendors').then((body) => body.data);
  },

  createVendor(data) {
    return request('/vendors', { method: 'POST', body: data }).then((body) => body.data);
  },

  updateVendor(id, changes) {
    return request(`/vendors/${id}`, { method: 'PUT', body: changes }).then((body) => body.data);
  },

  deleteVendor(id) {
    return request(`/vendors/${id}`, { method: 'DELETE' });
  },
  changePassword(data) {
    return request('/auth/change-password', { method: 'POST', body: data }).then((body) => body.data);
  },

  // --- PROFILE APIs ---
  getProfile() {
    return request('/auth/profile').then((body) => body.data);
  },
  updateProfile(userData) {
    return request('/auth/profile', {
      method: 'PUT',
      body: userData,
    }).then((body) => body.data);
  },
  // --- ACCOUNTS API ---

  getAccounts: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(query ? `/accounts?${query}` : '/accounts');
  },

  updateAccountRole: (id, roleId) => {
    return request(`/accounts/${id}/role`, {
      method: 'PATCH',
      body: { roleId },
    });
  },

  updateAccountStatus: (id, isActive) => {
    return request(`/accounts/${id}/status`, {
      method: 'PATCH',
      body: { isActive },
    });
  },
  scheduleEmail: (data) => {
    return request('/emails/schedule', {
      method: 'POST',
      body: data,
    });
  }, // --- TRANSACTIONS APIs ---
  deposit: (data) => {
    return request('/transactions/deposit', {
      method: 'POST',
      body: data,
    }).then((body) => body.data);
  },

  withdraw: (data) => {
    return request('/transactions/withdraw', {
      method: 'POST',
      body: data,
    }).then((body) => body.data);
  },
  getTransactionHistory: (accountId) => {
    return request(`/transactions/${accountId}`).then((body) => body.data);
  },
  // --- DASHBOARD API ---
  getDashboardStats: () => {
    return request('/dashboard/stats').then((body) => body.data);
  },

  // --- WALLET & PAYMENT APIs ---
  getMyTransactions: () => {
    return request('/transactions/my').then((body) => body.data);
  },

  createDepositQR: (amount) => {
    return request('/payments/create-qr', {
      method: 'POST',
      body: { amount },
    }).then((body) => body.data);
  },

  checkPaymentStatus: (orderCode) => {
    return request(`/payments/status/${orderCode}`).then((body) => body.data);
  },
  // --- CONTACT APIs ---
  getContactInfo() {
    return request('/contact/info').then((body) => body.data);
  },
  updateContactInfo(data) {
    return request('/contact/info', { method: 'PUT', body: data }).then((body) => body.data);
  },
  sendContactMessage(data) {
    return request('/contact/send', { method: 'POST', body: data });
  },
  // --- TRANSACTIONS APIs ---
  deposit: (data, { idempotencyKey } = {}) => {
    return request('/transactions/deposit', {
      method: 'POST',
      body: data,
      idempotencyKey,
    }).then((body) => body.data);
  },

  withdraw: (data, { idempotencyKey } = {}) => {
    return request('/transactions/withdraw', {
      method: 'POST',
      body: data,
      idempotencyKey,
    }).then((body) => body.data);
  }, // --- ADMIN INBOX APIs ---
  getContactMessages() {
    return request('/contact/messages').then((body) => body.data);
  },
  markContactMessageRead(id) {
    return request(`/contact/messages/${id}/read`, { method: 'PATCH' }).then((body) => body.data);
  },
  replyContactMessage(id, reply) {
    return request(`/contact/messages/${id}/reply`, { method: 'POST', body: { reply } }).then((body) => body.data);
  },

  // --- DIRECT MESSAGES APIs ---
  getChatPartners() {
    return request('/messages/partners').then((body) => body.data);
  },
  getMessagesWith(otherUserId) {
    return request(`/messages/${otherUserId}`).then((body) => body.data);
  },
  sendDirectMessage(receiverId, content) {
    return request('/messages', {
      method: 'POST',
      body: { receiverId, content },
    }).then((body) => body.data);
  },
  markConversationRead(otherUserId) {
    return request(`/messages/read/${otherUserId}`, { method: 'PATCH' }).then((body) => body.data);
  },
};
