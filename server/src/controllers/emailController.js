export function createEmailController(emailRepository) {
  return {
    async scheduleEmail(req, res) {
      try {
        const { subject, content, scheduledAt, targets } = req.body;
        const senderId = req.user.id;

        if (!subject || !content || !scheduledAt || !targets || targets.length === 0) {
          return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ thông tin và đối tượng nhận!' });
        }

        const emailId = await emailRepository.createScheduledEmail({
          senderId,
          targets,
          subject,
          content,
          scheduledAt,
        });

        return res.status(201).json({
          success: true,
          message: 'Đã lên lịch gửi email thành công!',
          data: { emailId },
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lên lịch gửi mail.' });
      }
    },
  };
}
