import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

import { api } from '../../api/client.js';
import { useAccounts } from '../../hooks/useAccounts.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import Pagination from '../../components/common/Pagination.jsx';
import Notice from '../../components/common/Notice.jsx';

import AccountFilters from './AccountsFilter.jsx';
import AccountTable from './AccountsTable.jsx';
import TransactionDialog from './TransactionDialog.jsx';

const PAGE_SIZE = 10;

export default function AccountsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [roleId, setRoleId] = useState(searchParams.get('role') || '');
  const [active, setActive] = useState(searchParams.get('active') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [notice, setNotice] = useState(null);

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [selectedTxAccount, setSelectedTxAccount] = useState(null);

  const debouncedSearch = useDebounce(search);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      roleId,
      isActive: active,
      page,
      limit: PAGE_SIZE,
    }),
    [debouncedSearch, roleId, active, page]
  );

  const { accounts, meta, loading, error, reload } = useAccounts(filters);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (roleId) params.role = roleId;
    if (active) params.active = active;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [search, roleId, active, page, setSearchParams]);

  const handleChangeRole = async (account, newRoleId) => {
    const confirmMsg = `Bạn có chắc chắn muốn đổi quyền của "${account.email}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateAccountRole(account.id, newRoleId);
      setNotice({ type: 'success', text: `Đã cập nhật quyền thành công!` });
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleToggleStatus = async (account, nextActiveStatus) => {
    const statusText = nextActiveStatus ? 'Mở khóa' : 'Khóa';
    const confirmMsg = `Bạn có chắc chắn muốn ${statusText} tài khoản "${account.email}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateAccountStatus(account.id, nextActiveStatus);
      setNotice({ type: 'success', text: `Đã ${statusText} tài khoản thành công!` });
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };
  const handleOpenTransaction = (account) => {
    setSelectedTxAccount(account);
    setTxDialogOpen(true);
  };
  const handleMessageUser = (account) => {
    window.dispatchEvent(
      new CustomEvent('open-dm-chat', {
        detail: {
          id: account.id,
          fullName: account.fullName || account.full_name,
          email: account.email,
        },
      })
    );
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Accounts
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {meta.total} accounts
        </Typography>
      </Box>

      <Notice type={notice?.type} onClose={() => setNotice(null)}>
        {notice?.text}
      </Notice>
      <Notice type="error">{error}</Notice>

      <AccountFilters
        search={search}
        roleId={roleId}
        active={active}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onRoleChange={(v) => {
          setRoleId(v);
          setPage(1);
        }}
        onActiveChange={(v) => {
          setActive(v);
          setPage(1);
        }}
      />

      <AccountTable
        accounts={accounts}
        loading={loading}
        onChangeRole={handleChangeRole}
        onToggleStatus={handleToggleStatus}
        onOpenTransaction={handleOpenTransaction}
        onMessageUser={handleMessageUser}
      />

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          page={page}
          totalPages={meta.totalPages || Math.ceil((meta.total || 0) / PAGE_SIZE)}
          onChange={setPage}
        />
      </Box>
      <TransactionDialog
        open={txDialogOpen}
        onClose={() => setTxDialogOpen(false)}
        account={selectedTxAccount}
        onSuccess={() => {
          setNotice({ type: 'success', text: `Giao dịch thành công!` });
          reload();
        }}
      />
    </Box>
  );
}
