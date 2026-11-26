export function createDashboardService(pool) {
  return {
    async getDashboardStats() {
      const connection = await pool.getConnection();
      try {
        // Chạy đồng thời 6 câu truy vấn để tối ưu tốc độ
        const [
          [overviewResult],
          [cashFlowResult],
          [gameDistributionResult],
          [recentTransactionsResult],
          [topUsersResult],
          [newestGamesResult],
        ] = await Promise.all([
          // 1. KPI Tổng quan
          connection.query(`
            SELECT 
              (SELECT COUNT(*) FROM accounts WHERE role_id = 3) AS totalPlayers,
              (SELECT COUNT(*) FROM games) AS totalGames,
              (SELECT COUNT(*) FROM vendors) AS totalVendors,
              (SELECT SUM(balance) FROM accounts) AS totalSystemBalance,
              (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'DEPOSIT' AND status = 'SUCCESS' AND MONTH(created_at) = MONTH(CURRENT_DATE())) AS monthlyDeposit
          `),

          // 2. Biểu đồ dòng tiền (7 ngày gần nhất)
          connection.query(`
            SELECT 
              DATE(created_at) as date,
              SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END) as total_deposit,
              SUM(CASE WHEN type = 'WITHDRAW' THEN amount ELSE 0 END) as total_withdraw
            FROM transactions 
            WHERE status = 'SUCCESS' 
              AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
          `),

          // 3. Biểu đồ cơ cấu Game (Theo loại hình)
          connection.query(`
            SELECT type, COUNT(*) as count 
            FROM games 
            GROUP BY type
          `),

          // 4. Bảng Giao dịch gần đây (5 dòng)
          connection.query(`
            SELECT t.id, t.transaction_code, t.type, t.amount, t.status, t.created_at, a.email, a.full_name
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            ORDER BY t.created_at DESC 
            LIMIT 5
          `),

          // 5. Bảng Top Đại Gia (5 người giàu nhất)
          connection.query(`
            SELECT id, email, full_name, balance, avatar_url, role_id
            FROM accounts 
            ORDER BY balance DESC 
            LIMIT 5
          `),

          // 6. Bảng Game mới cập nhật (5 game)
          connection.query(`
            SELECT g.id, g.title, g.type, g.created_at, v.name as vendor_name
            FROM games g
            JOIN vendors v ON g.vendor_id = v.id
            ORDER BY g.created_at DESC 
            LIMIT 5
          `),
        ]);

        return {
          overview: overviewResult[0],
          charts: {
            cashFlow: cashFlowResult,
            gameDistribution: gameDistributionResult,
          },
          tables: {
            recentTransactions: recentTransactionsResult,
            topUsers: topUsersResult,
            newestGames: newestGamesResult,
          },
        };
      } finally {
        connection.release();
      }
    },
  };
}
