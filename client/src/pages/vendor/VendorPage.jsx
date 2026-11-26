import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

import { api } from '../../api/client.js';
import Notice from '../../components/common/Notice.jsx';

import CreateVendorForm from './CreateVendorForm.jsx';
import VendorTable from './VendorTable.jsx';

export default function VendorPage() {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const data = await api.getVendors();
      setVendors(Array.isArray(data) ? data : []);
    } catch (error) {
      setNotice({ type: 'error', text: 'Lỗi tải danh sách: ' + error.message });
    }
  };

  const handleCreate = async (vendorData) => {
    setIsLoading(true);
    try {
      await api.createVendor(vendorData);
      setNotice({ type: 'success', text: `Đã thêm nhà phát hành "${vendorData.name}"` });
      fetchVendors();
    } catch (error) {
      setNotice({ type: 'error', text: 'Lỗi khi thêm: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`⚠️ Bạn có chắc chắn muốn xóa nhà phát hành "${name}" không?`)) return;

    try {
      await api.deleteVendor(id);
      setNotice({ type: 'success', text: `Đã xóa "${name}"` });
      fetchVendors();
    } catch (error) {
      setNotice({ type: 'error', text: 'Lỗi khi xóa: ' + error.message });
    }
  };

  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto', pb: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý Vendors
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {vendors.length} vendors
        </Typography>
      </Box>

      <Notice type={notice?.type} onClose={() => setNotice(null)}>
        {notice?.text}
      </Notice>

      <CreateVendorForm onCreated={handleCreate} isLoading={isLoading} />

      <VendorTable vendors={vendors} onDelete={handleDelete} />
    </Box>
  );
}
