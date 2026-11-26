import PayOS from '@payos/node';

export function createPaymentService(pool) {
  const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID?.trim(),
    process.env.PAYOS_API_KEY?.trim(),
    process.env.PAYOS_CHECKSUM_KEY?.trim()
  );

  return {
    async createDepositQR(accountId, amount) {
      const numAmount = Math.round(Number(amount));
      if (!numAmount || numAmount < 2000) {
        throw new Error('Số tiền nạp tối thiểu là 2,000 VNĐ');
      }

      const orderCode = Number(`${Date.now().toString().slice(-7)}${Math.floor(10 + Math.random() * 90)}`);
      const description = `Nap tien ID ${accountId}`;

      await pool.query(
        `INSERT INTO transactions 
        (account_id, transaction_code, type, amount, balance_before, balance_after, status, description) 
        VALUES (?, ?, 'DEPOSIT', ?, 0, 0, 'PENDING', ?)`,
        [accountId, String(orderCode), numAmount, description]
      );

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

      const paymentLink = await payOS.createPaymentLink({
        orderCode,
        amount: numAmount,
        description,
        returnUrl: `${clientUrl}/accounts?payment=success`,
        cancelUrl: `${clientUrl}/accounts?payment=cancel`,
      });

      return {
        orderCode,
        amount: numAmount,
        description,
        qrCode: paymentLink.qrCode,
        checkoutUrl: paymentLink.checkoutUrl,
        accountNumber: paymentLink.accountNumber,
        accountName: paymentLink.accountName,
        bin: paymentLink.bin,
      };
    },

    async handleWebhook(webhookBody) {
      const verifiedData = payOS.verifyPaymentWebhookData(webhookBody);

      if (verifiedData.orderCode === 123) {
        return { message: 'Webhook test verified OK' };
      }

      const orderCode = String(verifiedData.orderCode);
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const [txRows] = await connection.query('SELECT * FROM transactions WHERE transaction_code = ? FOR UPDATE', [
          orderCode,
        ]);

        const tx = txRows[0];
        if (!tx) {
          await connection.rollback();
          return { message: 'Không tìm thấy giao dịch, bỏ qua' };
        }

        if (tx.status === 'SUCCESS') {
          await connection.rollback();
          return { message: 'Giao dịch đã được xử lý trước đó' };
        }

        const [accRows] = await connection.query('SELECT id, balance FROM accounts WHERE id = ? FOR UPDATE', [
          tx.account_id,
        ]);

        const account = accRows[0];
        if (!account) {
          throw new Error('Không tìm thấy tài khoản người dùng');
        }

        const balanceBefore = parseFloat(account.balance);
        const amountPaid = parseFloat(verifiedData.amount);
        const balanceAfter = balanceBefore + amountPaid;

        await connection.query('UPDATE accounts SET balance = ? WHERE id = ?', [balanceAfter, account.id]);

        await connection.query(
          `UPDATE transactions 
           SET status = 'SUCCESS', balance_before = ?, balance_after = ? 
           WHERE id = ?`,
          [balanceBefore, balanceAfter, tx.id]
        );

        await connection.commit();
        return { message: 'Cộng tiền tự động thành công', orderCode, balanceAfter };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },

    async getOrderStatus(orderCode) {
      const [rows] = await pool.query(
        'SELECT transaction_code, amount, status, created_at FROM transactions WHERE transaction_code = ?',
        [String(orderCode)]
      );
      if (!rows[0]) throw new Error('Không tìm thấy đơn hàng');
      return rows[0];
    },
  };
}
