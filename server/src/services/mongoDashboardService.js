export function createMongoDashboardService(db) {
  return {
    async getDashboardStats() {
      const month = new Date();
      month.setUTCDate(1);
      month.setUTCHours(0, 0, 0, 0);
      const week = new Date();
      week.setUTCDate(week.getUTCDate() - 7);
      week.setUTCHours(0, 0, 0, 0);
      const accounts = db.collection('accounts');
      const games = db.collection('games');
      const transactions = db.collection('transactions');
      const [
        totalPlayers,
        totalGames,
        totalVendors,
        balances,
        deposits,
        cashFlow,
        gameDistribution,
        recentTransactions,
        topUsers,
        newestGames,
      ] = await Promise.all([
        accounts.countDocuments({ role_id: 3 }),
        games.countDocuments(),
        db.collection('vendors').countDocuments(),
        accounts.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]).toArray(),
        transactions
          .aggregate([
            { $match: { type: 'DEPOSIT', status: 'SUCCESS', created_at: { $gte: month } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ])
          .toArray(),
        transactions
          .aggregate([
            { $match: { status: 'SUCCESS', created_at: { $gte: week } } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
                total_deposit: { $sum: { $cond: [{ $eq: ['$type', 'DEPOSIT'] }, '$amount', 0] } },
                total_withdraw: { $sum: { $cond: [{ $eq: ['$type', 'WITHDRAW'] }, '$amount', 0] } },
              },
            },
            { $project: { _id: 0, date: '$_id', total_deposit: 1, total_withdraw: 1 } },
            { $sort: { date: 1 } },
          ])
          .toArray(),
        games
          .aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $project: { _id: 0, type: '$_id', count: 1 } },
          ])
          .toArray(),
        transactions
          .aggregate([
            { $lookup: { from: 'accounts', localField: 'account_id', foreignField: 'id', as: 'account' } },
            { $unwind: '$account' },
            { $sort: { created_at: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 0,
                id: 1,
                transaction_code: 1,
                type: 1,
                amount: 1,
                status: 1,
                created_at: 1,
                email: '$account.email',
                full_name: '$account.full_name',
              },
            },
          ])
          .toArray(),
        accounts
          .find({}, { projection: { _id: 0, id: 1, email: 1, full_name: 1, balance: 1, avatar_url: 1, role_id: 1 } })
          .sort({ balance: -1 })
          .limit(5)
          .toArray(),
        games
          .aggregate([
            { $lookup: { from: 'vendors', localField: 'vendor_id', foreignField: 'id', as: 'vendor' } },
            { $unwind: '$vendor' },
            { $sort: { created_at: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, id: 1, title: 1, type: 1, created_at: 1, vendor_name: '$vendor.name' } },
          ])
          .toArray(),
      ]);
      return {
        overview: {
          totalPlayers,
          totalGames,
          totalVendors,
          totalSystemBalance: balances[0]?.total ?? 0,
          monthlyDeposit: deposits[0]?.total ?? 0,
        },
        charts: { cashFlow, gameDistribution },
        tables: { recentTransactions, topUsers, newestGames },
      };
    },
  };
}
