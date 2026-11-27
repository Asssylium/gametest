import { randomUUID } from 'node:crypto';
import PayOS from '@payos/node';
import { nextId } from '../db/mongoDatabase.js';

export function createMongoTransactionService(db, client) {
  return {
    async processManualTransaction(accountId, type, amount, description) {
      const numAmount = Number(amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) throw new Error('Số tiền không hợp lệ');
      if (!['DEPOSIT', 'WITHDRAW'].includes(type)) throw new Error('Loại giao dịch không hợp lệ');
      const session = client.startSession();
      try {
        return await session.withTransaction(async () => {
          const account = await db.collection('accounts').findOne({ id: Number(accountId) }, { session });
          if (!account) throw new Error('Không tìm thấy tài khoản người dùng');
          const balanceBefore = Number(account.balance || 0);
          if (type === 'WITHDRAW' && balanceBefore < numAmount) throw new Error('Số dư không đủ để thực hiện lệnh rút');
          const balanceAfter = balanceBefore + (type === 'DEPOSIT' ? numAmount : -numAmount);
          const transactionId = await nextId(db, 'transactions', session);
          await db
            .collection('accounts')
            .updateOne({ id: account.id }, { $set: { balance: balanceAfter } }, { session });
          await db
            .collection('transactions')
            .insertOne(
              {
                id: transactionId,
                account_id: account.id,
                transaction_code: `MANUAL_${randomUUID()}`,
                type,
                amount: numAmount,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                status: 'SUCCESS',
                description: description || 'Admin xử lý thủ công',
                created_at: new Date(),
              },
              { session }
            );
          return { transactionId, accountId: account.id, type, amount: numAmount, balanceBefore, balanceAfter };
        });
      } finally {
        await session.endSession();
      }
    },
    async getTransactionHistory(accountId) {
      return db
        .collection('transactions')
        .find({ account_id: Number(accountId) }, { projection: { _id: 0 } })
        .sort({ created_at: -1 })
        .toArray();
    },
  };
}

export function createMongoPaymentService(
  db,
  client,
  paymentClient = new PayOS(
    process.env.PAYOS_CLIENT_ID?.trim(),
    process.env.PAYOS_API_KEY?.trim(),
    process.env.PAYOS_CHECKSUM_KEY?.trim()
  )
) {
  return {
    async createDepositQR(accountId, amount) {
      const numAmount = Math.round(Number(amount));
      if (!Number.isFinite(numAmount) || numAmount < 2000) throw new Error('Số tiền nạp tối thiểu là 2,000 VNĐ');
      const orderCode = Number(`${Date.now().toString().slice(-7)}${Math.floor(10 + Math.random() * 90)}`);
      const description = `Nap tien ID ${accountId}`;
      await db
        .collection('transactions')
        .insertOne({
          id: await nextId(db, 'transactions'),
          account_id: Number(accountId),
          transaction_code: String(orderCode),
          type: 'DEPOSIT',
          amount: numAmount,
          balance_before: 0,
          balance_after: 0,
          status: 'PENDING',
          description,
          created_at: new Date(),
        });
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const link = await paymentClient.createPaymentLink({
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
        qrCode: link.qrCode,
        checkoutUrl: link.checkoutUrl,
        accountNumber: link.accountNumber,
        accountName: link.accountName,
        bin: link.bin,
      };
    },
    async handleWebhook(body) {
      const verified = paymentClient.verifyPaymentWebhookData(body);
      if (verified.orderCode === 123) return { message: 'Webhook test verified OK' };
      const orderCode = String(verified.orderCode);
      const session = client.startSession();
      try {
        return await session.withTransaction(async () => {
          const transactions = db.collection('transactions');
          const tx = await transactions.findOne({ transaction_code: orderCode }, { session });
          if (!tx) return { message: 'Không tìm thấy giao dịch, bỏ qua' };
          if (tx.status === 'SUCCESS') return { message: 'Giao dịch đã được xử lý trước đó' };
          if (tx.status !== 'PENDING' || Number(verified.amount) !== tx.amount)
            throw new Error('Số tiền hoặc trạng thái giao dịch không hợp lệ');
          const account = await db.collection('accounts').findOne({ id: tx.account_id }, { session });
          if (!account) throw new Error('Không tìm thấy tài khoản người dùng');
          const balanceBefore = Number(account.balance || 0);
          const balanceAfter = balanceBefore + tx.amount;
          await db
            .collection('accounts')
            .updateOne({ id: account.id }, { $set: { balance: balanceAfter } }, { session });
          await transactions.updateOne(
            { id: tx.id },
            { $set: { status: 'SUCCESS', balance_before: balanceBefore, balance_after: balanceAfter } },
            { session }
          );
          return { message: 'Cộng tiền tự động thành công', orderCode, balanceAfter };
        });
      } finally {
        await session.endSession();
      }
    },
    async getOrderStatus(orderCode) {
      const row = await db
        .collection('transactions')
        .findOne(
          { transaction_code: String(orderCode) },
          { projection: { _id: 0, transaction_code: 1, amount: 1, status: 1, created_at: 1 } }
        );
      if (!row) throw new Error('Không tìm thấy đơn hàng');
      return row;
    },
  };
}
