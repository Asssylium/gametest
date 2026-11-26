export function createTransactionController(transactionService) {
  return {
    async deposit(req, res) {
      try {
        const { accountId, amount, description } = req.body;
        const result = await transactionService.processManualTransaction(accountId, 'DEPOSIT', amount, description);
        res.status(200).json({ message: 'Nạp tiền thành công', data: result });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },

    async withdraw(req, res) {
      try {
        const { accountId, amount, description } = req.body;
        const result = await transactionService.processManualTransaction(accountId, 'WITHDRAW', amount, description);
        res.status(200).json({ message: 'Rút tiền thành công', data: result });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },
    async getHistory(req, res) {
      try {
        const { accountId } = req.params;
        const history = await transactionService.getTransactionHistory(accountId);
        res.status(200).json({ data: history });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },
    async getMyHistory(req, res) {
      try {
        const accountId = req.user?.id || req.user?.userId;
        if (!accountId) {
          return res.status(401).json({ message: 'Không xác định được tài khoản' });
        }

        const history = await transactionService.getTransactionHistory(accountId);
        res.status(200).json({ data: history });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },
  };
}
