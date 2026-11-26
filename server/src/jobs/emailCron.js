import cron from 'node-cron';

export function startEmailCronJob(emailRepository, pool, emailService) {
  cron.schedule('* * * * *', async () => {
    try {
      const dateObj = new Date();
      const yyyy = dateObj.getFullYear();
      const MM = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const hh = String(dateObj.getHours()).padStart(2, '0');
      const mm = String(dateObj.getMinutes()).padStart(2, '0');

      const nowString = `${yyyy}-${MM}-${dd}T${hh}:${mm}`;

      const pendingEmails = await emailRepository.getPendingEmails(nowString);

      if (pendingEmails.length > 0) {
        console.log(`[CronJob] Tìm thấy ${pendingEmails.length} email đến hạn gửi.`);
      }

      for (const email of pendingEmails) {
        try {
          let targets = [];
          try {
            targets = JSON.parse(email.target_role);
          } catch (e) {
            console.error(`[CronJob] Lỗi parse JSON target_role của email ID ${email.id}`);
            continue;
          }

          const bccList = await resolveEmailsFromTargets(pool, targets);

          if (bccList.length === 0) {
            console.log(`[CronJob] Email ID ${email.id} không có người nhận hợp lệ. Đánh dấu FAILED.`);
            await emailRepository.updateStatus(email.id, 'FAILED');
            continue;
          }

          await emailService.sendMail({
            to: process.env.EMAIL_USER,
            bcc: bccList,
            subject: email.subject,
            html: email.content,
          });

          await emailRepository.updateStatus(email.id, 'SENT');
          console.log(`[CronJob] Đã gửi thành công chiến dịch ID: ${email.id} tới ${bccList.length} người.`);
        } catch (err) {
          console.error(`[CronJob] Lỗi khi gửi email ID ${email.id}:`, err);
          await emailRepository.updateStatus(email.id, 'FAILED');
        }
      }
    } catch (error) {
      console.error('[CronJob] Lỗi hệ thống CronJob:', error);
    }
  });
}

async function resolveEmailsFromTargets(pool, targets) {
  if (!targets || targets.length === 0) return [];

  const hasAll = targets.some((t) => t.type === 'ALL');
  if (hasAll) {
    const [rows] = await pool.query('SELECT email FROM accounts WHERE is_active = 1');
    return rows.map((r) => r.email);
  }

  const roleIds = [];
  const userIds = [];

  for (const t of targets) {
    if (t.type === 'ROLE' && t.value) roleIds.push(t.value);
    if (t.type === 'USER' && t.id) userIds.push(t.id);
  }

  let finalEmails = new Set();

  if (roleIds.length > 0) {
    const [roleRows] = await pool.query(`SELECT email FROM accounts WHERE is_active = 1 AND role_id IN (?)`, [roleIds]);
    roleRows.forEach((r) => finalEmails.add(r.email));
  }

  if (userIds.length > 0) {
    const [userRows] = await pool.query(`SELECT email FROM accounts WHERE is_active = 1 AND id IN (?)`, [userIds]);
    userRows.forEach((r) => finalEmails.add(r.email));
  }

  return Array.from(finalEmails);
}
