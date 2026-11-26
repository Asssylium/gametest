import React, { useEffect, useRef, useState } from 'react';
import { Box, TextField, Autocomplete, Typography, CircularProgress, Button, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Icon màu đỏ nổi bật dành riêng cho Trụ sở công ty
const hqIcon = L.divIcon({
  className: 'hq-custom-marker',
  html: `<div style="
    background:#d32f2f;
    color:#fff;
    width:32px;
    height:32px;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    display:flex;
    align-items:center;
    justify-content:center;
    border:2px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,0.4);
  "><span style="transform:rotate(45deg);font-size:14px;">🏢</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const DEFAULT_CENTER = [21.0055, 105.8433];

function formatPhotonAddress(properties = {}) {
  const parts = [
    properties.name,
    [properties.housenumber, properties.street].filter(Boolean).join(' '),
    properties.district || properties.locality,
    properties.city || properties.county,
    properties.state,
    properties.country,
  ].filter(Boolean);
  return [...new Set(parts)].join(', ');
}

// Tìm địa chỉ: ưu tiên Photon, nếu rỗng thì fallback sang Nominatim (chuẩn cho VN hơn)
async function searchPlaces(query, biasCenter, signal) {
  const [biasLat, biasLng] = biasCenter;

  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lat=${biasLat}&lon=${biasLng}`,
      { signal }
    );
    if (res.ok) {
      const data = await res.json();
      const features = (data?.features || [])
        .map((f, idx) => ({
          id: `photon-${f.properties?.osm_id || idx}-${idx}`,
          label: formatPhotonAddress(f.properties),
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
        }))
        .filter((item) => item.label);
      if (features.length > 0) return features;
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }

  // Fallback Nominatim (ưu tiên Việt Nam)
  const nomRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=6&countrycodes=vn&accept-language=vi`,
    { signal }
  );
  if (!nomRes.ok) return [];
  const nomData = await nomRes.json();
  return (nomData || []).map((item, idx) => ({
    id: `nom-${item.place_id || idx}`,
    label: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

export default function MapLibreLocationPicker({
  headquarters, // { companyName, address, lat, lng }
  height = 480,
  onSelectLocation,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const hqMarkerRef = useRef(null);
  const onSelectRef = useRef(onSelectLocation);

  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');

  const centerCoords =
    headquarters?.lat && headquarters?.lng ? [Number(headquarters.lat), Number(headquarters.lng)] : DEFAULT_CENTER;

  useEffect(() => {
    onSelectRef.current = onSelectLocation;
  }, [onSelectLocation]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
      );
      const data = await res.json();
      const address = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSelectedAddress(address);
      setInputValue(address);
      onSelectRef.current?.({ lat, lng, address });
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSelectedAddress(fallback);
      onSelectRef.current?.({ lat, lng, address: fallback });
    }
  };

  const placeUserMarker = (lat, lng, fly = false) => {
    if (!mapRef.current) return;

    if (!userMarkerRef.current) {
      const marker = L.marker([lat, lng], { draggable: true })
        .addTo(mapRef.current)
        .bindPopup('Vị trí bạn chọn (có thể kéo thả)');
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });
      userMarkerRef.current = marker;
    } else {
      userMarkerRef.current.setLatLng([lat, lng]);
    }

    if (fly) {
      mapRef.current.flyTo([lat, lng], 16);
    }
  };

  // 1. Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current).setView(centerCoords, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      placeUserMarker(lat, lng, false);
      reverseGeocode(lat, lng);
    });

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      hqMarkerRef.current = null;
    };
  }, []);

  // 2. Ghim / cập nhật Marker Trụ sở công ty mỗi khi dữ liệu headquarters thay đổi
  useEffect(() => {
    if (!mapRef.current || !headquarters?.lat || !headquarters?.lng) return;

    const hqPos = [Number(headquarters.lat), Number(headquarters.lng)];
    const popupHtml = `
      <div style="min-width:180px">
        <b>🏢 ${headquarters.companyName || 'Trụ sở công ty'}</b><br/>
        <span style="font-size:12px;color:#555">${headquarters.address || ''}</span>
      </div>
    `;

    if (!hqMarkerRef.current) {
      hqMarkerRef.current = L.marker(hqPos, { icon: hqIcon }).addTo(mapRef.current).bindPopup(popupHtml).openPopup();
    } else {
      hqMarkerRef.current.setLatLng(hqPos).setPopupContent(popupHtml);
    }

    mapRef.current.setView(hqPos, 15);
  }, [headquarters?.lat, headquarters?.lng, headquarters?.companyName, headquarters?.address]);

  // 3. Gợi ý địa chỉ tự động khi gõ (debounce 400ms)
  useEffect(() => {
    const query = inputValue.trim();
    if (query.length < 2) {
      setOptions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const results = await searchPlaces(query, centerCoords, controller.signal);
        setOptions(results);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Search address error:', err);
      } finally {
        setLoadingSearch(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputValue]);

  const applyLocation = (option) => {
    placeUserMarker(option.lat, option.lng, true);
    setSelectedAddress(option.label);
    setInputValue(option.label);
    onSelectRef.current?.({
      lat: option.lat,
      lng: option.lng,
      address: option.label,
    });
  };

  // Tìm trực tiếp khi user bấm nút Tìm hoặc nhấn Enter
  const handleManualSearch = async () => {
    const query = inputValue.trim();
    if (query.length < 2) return;

    setLoadingSearch(true);
    try {
      const results = await searchPlaces(query, centerCoords);
      setOptions(results);
      if (results.length > 0) {
        applyLocation(results[0]);
      }
    } catch (err) {
      console.error('Manual search error:', err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelectOption = (_, option) => {
    if (!option) return;
    if (typeof option === 'string') {
      handleManualSearch();
      return;
    }
    applyLocation(option);
  };

  const handleFocusHQ = () => {
    if (!mapRef.current || !hqMarkerRef.current) return;
    const pos = hqMarkerRef.current.getLatLng();
    mapRef.current.flyTo(pos, 16);
    hqMarkerRef.current.openPopup();
  };

  return (
    <Box>
      {/* Thanh tìm kiếm + nút Tìm + nút Về trụ sở */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.5 }}>
        <Autocomplete
          freeSolo
          fullWidth
          options={options}
          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label)}
          filterOptions={(x) => x}
          inputValue={inputValue}
          onInputChange={(_, newValue) => setInputValue(newValue)}
          onChange={handleSelectOption}
          loading={loadingSearch}
          noOptionsText="Không tìm thấy địa chỉ phù hợp"
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return (
              <li key={option.id} {...rest}>
                <Typography variant="body2">{option.label}</Typography>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tìm kiếm địa chỉ..."
              placeholder="VD: Hồ Hoàn Kiếm, 1 Đại Cồ Việt..."
              size="small"
              slotProps={{
                ...params.slotProps,
                input: {
                  ...(params.slotProps?.input || params.InputProps),
                  endAdornment: (
                    <>
                      {loadingSearch ? <CircularProgress size={18} /> : null}
                      {params.slotProps?.input?.endAdornment ?? params.InputProps?.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />

        <Button
          variant="contained"
          size="small"
          startIcon={<SearchIcon />}
          onClick={handleManualSearch}
          disabled={loadingSearch}
          sx={{ whiteSpace: 'nowrap', px: 2 }}
        >
          Tìm
        </Button>

        {headquarters?.lat && headquarters?.lng && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<BusinessIcon />}
            onClick={handleFocusHQ}
            sx={{ whiteSpace: 'nowrap', px: 2 }}
          >
            Trụ sở
          </Button>
        )}
      </Stack>

      {/* Khung bản đồ Leaflet */}
      <Box
        ref={mapContainerRef}
        sx={{
          height,
          width: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          zIndex: 0,
        }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {selectedAddress
          ? `Vị trí đã chọn: ${selectedAddress}`
          : 'Ghim đỏ 🏢 là trụ sở công ty. Gõ địa chỉ rồi nhấn Enter/Tìm, hoặc click lên bản đồ để chọn vị trí của bạn.'}
      </Typography>
    </Box>
  );
}
