export function createTransactionService(pool) {
  return {
    async processManualTransaction(accountId, type, amount, description) {
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
          throw new Error('Số tiền không hợp lệ');
        }

        const [accounts] = await connection.query('SELECT id, balance FROM accounts WHERE id = ? FOR UPDATE', [
          accountId,
        ]);

        const account = accounts[0];
        if (!account) {
          throw new Error('Không tìm thấy tài khoản người dùng');
        }

        const balanceBefore = parseFloat(account.balance);
        let balanceAfter = balanceBefore;

        if (type === 'DEPOSIT') {
          balanceAfter = balanceBefore + numAmount;
        } else if (type === 'WITHDRAW') {
          if (balanceBefore < numAmount) {
            throw new Error('Số dư không đủ để thực hiện lệnh rút');
          }
          balanceAfter = balanceBefore - numAmount;
        } else {
          throw new Error('Loại giao dịch không hợp lệ');
        }

        await connection.query('UPDATE accounts SET balance = ? WHERE id = ?', [balanceAfter, accountId]);

        const [txResult] = await connection.query(
          `INSERT INTO transactions 
          (account_id, transaction_code, type, amount, balance_before, balance_after, status, description) 
          VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', ?)`,
          [
            accountId,
            `MANUAL_${Date.now()}`,
            type,
            numAmount,
            balanceBefore,
            balanceAfter,
            description || 'Admin xử lý thủ công',
          ]
        );

        await connection.commit();

        return {
          transactionId: txResult.insertId,
          accountId,
          type,
          amount: numAmount,
          balanceBefore,
          balanceAfter,
        };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async getTransactionHistory(accountId) {
      const [rows] = await pool.query('SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC', [
        accountId,
      ]);
      return rows;
    },
  };
}
