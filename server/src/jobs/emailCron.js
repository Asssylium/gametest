import cron from 'node-cron';

export function startEmailCronJob(emailRepository, db, emailService) {
  return cron.schedule('* * * * *', () => runScheduledEmails(emailRepository, db, emailService));
}

export async function runScheduledEmails(emailRepository, db, emailService) {
    try {
      const pendingEmails = await emailRepository.getPendingEmails(new Date());

      if (pendingEmails.length > 0) {
        console.log(`[CronJob] Tìm thấy ${pendingEmails.length} email đến hạn gửi.`);
      }

      for (const email of pendingEmails) {
        if (!(await emailRepository.claimPending(email.id))) continue;
        try {
          let targets = [];
          try {
            targets = JSON.parse(email.target_role);
          } catch (e) {
            console.error(`[CronJob] Lỗi parse JSON target_role của email ID ${email.id}`);
            await emailRepository.updateStatus(email.id, 'FAILED');
            continue;
          }

          const bccList = await resolveEmailsFromTargets(db, targets);

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
      throw error;
    }
}

export async function resolveEmailsFromTargets(db, targets) {
  if (!targets || targets.length === 0) return [];

  const hasAll = targets.some((t) => t.type === 'ALL');
  if (hasAll) {
    const rows = await db
      .collection('accounts')
      .find({ is_active: 1 }, { projection: { email: 1 } })
      .toArray();
    return rows.map((r) => r.email);
  }

  const roleIds = [];
  const userIds = [];

  for (const t of targets) {
    if (t.type === 'ROLE' && t.value) roleIds.push(Number(t.value));
    if (t.type === 'USER' && t.id) userIds.push(Number(t.id));
  }

  let finalEmails = new Set();

  if (roleIds.length > 0) {
    const roleRows = await db
      .collection('accounts')
      .find({ is_active: 1, role_id: { $in: roleIds } })
      .toArray();
    roleRows.forEach((r) => finalEmails.add(r.email));
  }

  if (userIds.length > 0) {
    const userRows = await db
      .collection('accounts')
      .find({ is_active: 1, id: { $in: userIds } })
      .toArray();
    userRows.forEach((r) => finalEmails.add(r.email));
  }

  return Array.from(finalEmails);
}
