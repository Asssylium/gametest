export function validateGame(req, res, next) {
  const { title, gameCode, type, vendorId, imageUrl } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Title là bắt buộc' });
  }

  if (!gameCode || gameCode.trim() === '') {
    return res.status(400).json({ message: 'Game code là bắt buộc' });
  }

  if (!vendorId) {
    return res.status(400).json({ message: 'Vendor ID là bắt buộc' });
  }
  if (imageUrl && typeof imageUrl !== 'string') {
    return res.status(400).json({ message: 'URL ảnh không hợp lệ' });
  }

  next();
}
