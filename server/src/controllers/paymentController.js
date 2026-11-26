export function createPaymentController(paymentService) {
  return {
    async createQR(req, res) {
      try {
        const accountId = req.body.accountId || req.user?.id || req.user?.userId;
        const { amount } = req.body;

        if (!accountId) {
          return res.status(400).json({ message: 'Thiếu thông tin tài khoản' });
        }

        const data = await paymentService.createDepositQR(accountId, amount);
        res.status(200).json({ success: true, data });
      } catch (error) {
        console.error('Create QR Error:', error);
        res.status(400).json({ success: false, message: error.message });
      }
    },

    async webhook(req, res) {
      try {
        const result = await paymentService.handleWebhook(req.body);
        res.status(200).json({ success: true, ...result });
      } catch (error) {
        console.error('Webhook Error:', error.message);
        res.status(400).json({ success: false, message: error.message });
      }
    },

    async checkStatus(req, res) {
      try {
        const { orderCode } = req.params;
        const data = await paymentService.getOrderStatus(orderCode);
        res.status(200).json({ success: true, data });
      } catch (error) {
        res.status(404).json({ success: false, message: error.message });
      }
    },
  };
}
