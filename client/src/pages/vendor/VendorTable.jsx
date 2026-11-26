import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  IconButton,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function VendorTable({ vendors, onDelete }) {
  return (
    <TableContainer component={Card} sx={{ mb: 3 }}>
      <Table sx={{ minWidth: 500 }} aria-label="vendor table">
        <TableHead sx={{ backgroundColor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Tên Nhà Phát Hành</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Thao tác
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vendors && vendors.length > 0 ? (
            vendors.map((vendor) => (
              <TableRow key={vendor.id} hover>
                <TableCell sx={{ color: 'text.secondary' }}>#{vendor.id}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{vendor.name}</TableCell>
                <TableCell align="center">
                  <IconButton
                    color="error"
                    onClick={() => onDelete(vendor.id, vendor.name)}
                    title="Xóa Vendor"
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                <Typography variant="body1">Chưa có dữ liệu nhà phát hành.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
