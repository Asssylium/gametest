export function createIdempotencyMiddleware(idempotencyRepository) {
  return async function idempotencyMiddleware(req, res, next) {
    const rawKey = req.get('Idempotency-Key');
    const key = typeof rawKey === 'string' ? rawKey.trim() : '';

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu header Idempotency-Key.',
      });
    }

    if (key.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Idempotency-Key không được vượt quá 128 ký tự.',
      });
    }

    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không xác định được người dùng cho Idempotency-Key.',
      });
    }

    const method = req.method.toUpperCase();
    const endpoint = req.baseUrl + req.path;

    try {
      let recordId = null;
      const insertRes = await idempotencyRepository.insertProcessing({
        key,
        userId,
        method,
        endpoint,
      });

      if (insertRes.inserted) {
        recordId = insertRes.id;
      } else {
        const existing = await idempotencyRepository.findByScope({
          key,
          userId,
          method,
          endpoint,
        });

        if (!existing) {
          return res.status(409).json({
            success: false,
            message: 'Giao dịch trùng lặp đang được xử lý.',
          });
        }

        if (existing.status === 'COMPLETED') {
          const parsedBody =
            typeof existing.response_body === 'string' ? JSON.parse(existing.response_body) : existing.response_body;

          res.set('X-Idempotency-Replayed', 'true');
          return res.status(existing.response_status || 200).json(parsedBody);
        }

        if (existing.status === 'PROCESSING') {
          return res.status(409).json({
            success: false,
            message: 'Giao dịch với Idempotency-Key này đang được xử lý, vui lòng không bấm lặp lại.',
          });
        }
        await idempotencyRepository.retryFromFailed(existing.id);
        recordId = existing.id;
      }

      let capturedBody;
      let isCompleted = false;

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        capturedBody = body;
        if (res.statusCode >= 200 && res.statusCode < 500) {
          isCompleted = true;
        }
        return originalJson(body);
      };

      res.on('finish', async () => {
        try {
          if (isCompleted && capturedBody !== undefined) {
            await idempotencyRepository.markCompleted(recordId, {
              responseStatus: res.statusCode,
              responseBody: capturedBody,
            });
          } else if (res.statusCode >= 500) {
            await idempotencyRepository.markFailed(recordId);
          }
        } catch (updateErr) {
          console.error('[Idempotency] Lỗi cập nhật trạng thái key:', updateErr.message);
        }
      });

      return next();
    } catch (err) {
      return next(err);
    }
  };
}
