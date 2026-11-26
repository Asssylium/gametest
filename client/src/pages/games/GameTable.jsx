import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card, // Thay Paper bằng Card
  Checkbox,
  Switch,
  IconButton,
  Chip,
  TableSortLabel,
  Typography,
  Box,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import InlineEdit from '../../components/common/InlineEdit.jsx';

export default function GameTable({
  games,
  vendors,
  loading,
  onUpdate,
  onDelete,
  sortBy,
  order,
  onSort,
  selectedIds,
  onSelect,
  onSelectAll,
  onViewDetail,
}) {
  const vendorNames = useMemo(() => new Map(vendors.map((v) => [v.id, v.name])), [vendors]);
  const vendorName = (code) => vendorNames.get(code) ?? code;

  const isAllSelected = games.length > 0 && games.every((game) => selectedIds.includes(game.id));
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < games.length;

  if (!loading && games.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
        <Typography variant="body1">No games found.</Typography>
      </Box>
    );
  }

  return (
    // 👉 ĐIỂM SỬA CHÍNH: Dùng Card thay vì Paper để nhận CSS từ Theme
    <TableContainer component={Card} sx={{ mb: 3 }}>
      <Table sx={{ minWidth: 900 }} size="small" aria-label="games table">
        <TableHead sx={{ backgroundColor: 'action.hover' }}>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                color="primary"
                indeterminate={isIndeterminate}
                checked={isAllSelected}
                onChange={() => onSelectAll(isAllSelected, games)}
              />
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              ID
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Vendor</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Image
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortBy === 'title'}
                direction={sortBy === 'title' ? order.toLowerCase() : 'asc'}
                onClick={() => onSort('title')}
              >
                Title
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Japanese title</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Type
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortBy === 'sort'}
                direction={sortBy === 'sort' ? order.toLowerCase() : 'asc'}
                onClick={() => onSort('sort')}
              >
                Sort
              </TableSortLabel>
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Created At
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Active
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          {games.map((game) => {
            const isSelected = selectedIds.includes(game.id);
            return (
              <TableRow
                key={game.id}
                hover
                selected={isSelected}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell padding="checkbox">
                  <Checkbox color="primary" checked={isSelected} onChange={() => onSelect(game.id)} />
                </TableCell>
                <TableCell align="center" sx={{ color: 'text.secondary' }}>
                  {game.id}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{vendorName(game.vendorId)}</TableCell>
                <TableCell align="center">
                  {game.imageUrl ? (
                    <Box
                      component="img"
                      src={game.imageUrl}
                      alt="img"
                      sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        No
                      </Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{game.gameCode}</TableCell>
                <TableCell>{game.title}</TableCell>
                <TableCell>
                  <InlineEdit value={game.titleJp ?? ''} onSave={(titleJp) => onUpdate(game, { titleJp })} />
                </TableCell>
                <TableCell align="center">
                  <Chip label={game.type} size="small" color="default" />
                </TableCell>
                <TableCell align="center">
                  <InlineEdit
                    value={String(game.sortOrder)}
                    inputType="number"
                    onSave={(value) => onUpdate(game, { sortOrder: Number(value) })}
                  />
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  {game.createdAt ? game.createdAt.slice(0, 10) : '-'}
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={game.isActive}
                    onChange={(e) => {
                      if (
                        window.confirm(
                          `Chuyển trạng thái game "${game.title}" thành ${e.target.checked ? 'Bật' : 'Tắt'}?`
                        )
                      ) {
                        onUpdate(game, { isActive: e.target.checked });
                      }
                    }}
                    color="success"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton color="info" size="small" onClick={() => onViewDetail(game)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton color="error" size="small" onClick={() => onDelete(game)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
