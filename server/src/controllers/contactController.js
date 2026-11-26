export function createContactController(contactService) {
  return {
    async getInfo(req, res, next) {
      try {
        const data = await contactService.getCompanyInfo();
        res.json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },

    async updateInfo(req, res, next) {
      try {
        const { companyName, address, phone, email, workingHours, lat, lng } = req.body;
        if (!companyName || !address || !email || lat === undefined || lng === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng nhập đầy đủ thông tin và tọa độ trụ sở.',
          });
        }
        const data = await contactService.updateCompanyInfo({
          companyName,
          address,
          phone: phone || '',
          email,
          workingHours: workingHours || '',
          lat,
          lng,
        });
        res.json({ success: true, message: 'Đã cập nhật thông tin trụ sở.', data });
      } catch (err) {
        next(err);
      }
    },

    async sendContact(req, res, next) {
      try {
        const { fullName, email, subject, address, lat, lng, message } = req.body;
        if (!fullName || !email || !subject || !message?.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng điền đủ Họ tên, Email, Tiêu đề và Nội dung.',
          });
        }
        const created = await contactService.submitContact({
          accountId: req.user?.id,
          fullName,
          email,
          subject,
          address,
          lat,
          lng,
          message,
          io: req.app.get('io'),
        });
        res.status(201).json({
          success: true,
          message: 'Đã gửi email liên hệ thành công!',
          data: created,
        });
      } catch (err) {
        next(err);
      }
    },

    async getMessages(req, res, next) {
      try {
        const data = await contactService.getMessages();
        res.json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },

    async markRead(req, res, next) {
      try {
        const data = await contactService.markAsRead(Number(req.params.id));
        res.json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },

    async replyMessage(req, res, next) {
      try {
        const { reply } = req.body;
        if (!reply?.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng nhập nội dung phản hồi.',
          });
        }
        const data = await contactService.replyMessage(Number(req.params.id), reply.trim());
        res.json({ success: true, message: 'Đã gửi email phản hồi thành công!', data });
      } catch (err) {
        next(err);
      }
    },
  };
}
