import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { api } from '../../api/client.js';
import { useGames } from '../../hooks/useGames.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import Pagination from '../../components/common/Pagination.jsx';
import Notice from '../../components/common/Notice.jsx';

import GameFilters from './GameFilters.jsx';
import GameTable from './GameTable.jsx';
import CreateGameForm from './CreateGameForm.jsx';
import GameStatsBanner from './GameStatsBanner.jsx';
import GameDetailDialog from './GameDetailDialog.jsx';
const PAGE_SIZE = 10;

export default function GamesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [vendor, setVendor] = useState(searchParams.get('vendor') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [active, setActive] = useState(searchParams.get('active') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '');
  const [order, setOrder] = useState(searchParams.get('order') || 'ASC');

  const [notice, setNotice] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedGameForDetail, setSelectedGameForDetail] = useState(null);

  const debouncedSearch = useDebounce(search);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      vendorId: vendor,
      isActive: active,
      type,
      page,
      limit: PAGE_SIZE,
      sortBy,
      order,
    }),
    [debouncedSearch, vendor, active, type, page, sortBy, order]
  );

  const { games, meta, loading, error, reload, replaceGame } = useGames(filters);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (vendor) params.vendorId = vendor;
    if (type) params.type = type;
    if (active) params.isActive = active;
    if (page > 1) params.page = String(page);
    if (sortBy) params.sortBy = sortBy;
    if (order !== 'ASC') params.order = order;

    setSearchParams(params, { replace: true });
  }, [search, vendor, type, active, page, sortBy, order, setSearchParams]);

  useEffect(() => {
    api
      .getVendors()
      .then(setVendors)
      .catch(() => setVendors([]));
  }, []);

  async function handleUpdate(game, changes) {
    try {
      replaceGame(await api.updateGame(game.id, changes));
      setNotice({ type: 'success', text: `Updated "${game.title}"` });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  }

  function handleSelectGame(gameId) {
    setSelectedIds((prev) => (prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]));
  }

  function handleSelectAll(isAllSelected, currentGames) {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(currentGames.map((game) => game.id));
  }

  async function handleBulkUpdate(activeStatus) {
    if (selectedIds.length === 0) return;
    try {
      await api.bulkUpdateGames(selectedIds, activeStatus);
      setNotice({
        type: 'success',
        text: `Successfully ${activeStatus ? 'Activated' : 'Deactivated'} ${selectedIds.length} games.`,
      });
      setSelectedIds([]);
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  }

  useEffect(() => {
    setSelectedIds([]);
  }, [page, search, vendor, type, active, sortBy, order]);

  function handleCreated(game) {
    setNotice({ type: 'success', text: `Created "${game.title}"` });
    reload();
  }

  function handleSort(column) {
    const nextOrder = sortBy !== column ? 'ASC' : order === 'ASC' ? 'DESC' : 'ASC';
    setSortBy(column);
    setOrder(nextOrder);
    setPage(1);
  }

  async function handleDelete(game) {
    if (window.confirm(`Bạn có chắc chắn muốn xóa game "${game.title}" không?`)) {
      try {
        await api.deleteGame(game.id);
        setNotice({ type: 'success', text: `Đã xóa "${game.title}"` });
        reload();
      } catch (err) {
        setNotice({ type: 'error', text: err.message });
      }
    }
  }

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Games
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {meta.total} games
        </Typography>
      </Box>

      <GameStatsBanner />

      <Notice type={notice?.type} onClose={() => setNotice(null)}>
        {notice?.text}
      </Notice>

      <CreateGameForm vendors={vendors} onCreated={handleCreated} />

      {/* Bulk Action Panel (MUI version) */}
      {selectedIds.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography fontWeight="bold">{selectedIds.length} games selected</Typography>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleBulkUpdate(true)}
          >
            Set Active
          </Button>
          <Button
            variant="contained"
            color="inherit"
            size="small"
            startIcon={<CancelIcon />}
            onClick={() => handleBulkUpdate(false)}
          >
            Set Inactive
          </Button>
        </Paper>
      )}

      <GameFilters
        vendors={vendors}
        search={search}
        vendor={vendor}
        active={active}
        type={type}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onVendorChange={(val) => {
          setVendor(val);
          setPage(1);
        }}
        onActiveChange={(val) => {
          setActive(val);
          setPage(1);
        }}
        onTypeChange={(val) => {
          setType(val);
          setPage(1);
        }}
        sortBy={sortBy}
        order={order}
        onSort={handleSort}
      />

      <Notice>{error}</Notice>

      <GameTable
        games={games}
        vendors={vendors}
        loading={loading}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        sortBy={sortBy}
        order={order}
        onSort={handleSort}
        selectedIds={selectedIds}
        onSelect={handleSelectGame}
        onSelectAll={handleSelectAll}
        onViewDetail={setSelectedGameForDetail}
      />

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          page={page}
          totalPages={meta.totalPages || Math.ceil((meta.total || 0) / PAGE_SIZE)}
          onChange={setPage}
        />
      </Box>
      <GameDetailDialog
        game={selectedGameForDetail}
        vendors={vendors}
        onUpdate={handleUpdate}
        vendorName={selectedGameForDetail ? vendors.find((v) => v.id === selectedGameForDetail.vendorId)?.name : ''}
        onClose={() => setSelectedGameForDetail(null)}
      />
    </Box>
  );
}
