import nodemailer from 'nodemailer';

export function createEmailService() {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return {
    async sendMail({ to, bcc, subject, html }) {
      try {
        const mailOptions = {
          from: `"Games Catalog" <${process.env.EMAIL_USER}>`,
          to: to || process.env.EMAIL_USER,
          bcc: bcc || [],
          subject: subject,
          html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Email đã gửi thành công tới: ${info.accepted.join(', ')}`);
        return info;
      } catch (error) {
        console.error('❌ Lỗi khi gửi email:', error);
        throw error;
      }
    },

    async sendOtpMail(toEmail, otpCode) {
      const subject = 'Mã xác thực (OTP) từ hệ thống Games Catalog';
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #007bff;">Mã xác thực của bạn</h2>
          <p>Xin chào,</p>
          <p>Bạn đã yêu cầu một mã OTP để xác thực tài khoản. Vui lòng nhập mã dưới đây:</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p style="color: #dc3545; font-size: 14px;">Mã này chỉ có hiệu lực trong 5 phút. KHÔNG chia sẻ mã này với bất kỳ ai.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
        </div>
      `;
      return this.sendMail({ to: toEmail, subject, html });
    },
  };
}
