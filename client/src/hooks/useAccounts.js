import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';

export function useAccounts(filters) {
  const [accounts, setAccounts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAccounts(filters);
      setAccounts(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách tài khoản');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const replaceAccount = useCallback((updatedAccount) => {
    setAccounts((current) => current.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc)));
  }, []);

  return {
    accounts,
    meta,
    loading,
    error,
    reload: fetchAccounts,
    replaceAccount,
  };
}
