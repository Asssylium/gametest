export function createAuthController(authService) {
  return {
    async register(req, res, next) {
      try {
        const result = await authService.register(req.body);
        res.status(201).json({
          success: true,
          message: result.message,
          data: { id: result.accountId },
        });
      } catch (error) {
        next(error);
      }
    },

    async verifyEmail(req, res, next) {
      try {
        const { email, otp } = req.body;
        if (!email || !otp) {
          return res.status(400).json({ success: false, message: 'Thiếu email hoặc OTP' });
        }

        const result = await authService.verifyEmail(email, otp);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
    async login(req, res, next) {
      try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.status(200).json({ success: true, message: 'Đăng nhập thành công', data: result });
      } catch (error) {
        next(error);
      }
    },
    async logout(req, res, next) {
      try {
        res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
      } catch (error) {
        next(error);
      }
    },
    async changePassword(req, res, next) {
      try {
        await authService.changePassword(req.user?.id, req.body.currentPassword, req.body.newPassword);
        res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
      } catch (error) {
        next(error);
      }
    },
    async getProfile(req, res, next) {
      try {
        res.status(200).json({ success: true, data: await authService.getProfile(req.user.id) });
      } catch (error) {
        next(error);
      }
    },
    async updateProfile(req, res, next) {
      try {
        res.status(200).json({
          success: true,
          message: 'Cập nhật thành công',
          data: await authService.updateProfile(req.user.id, req.body),
        });
      } catch (error) {
        next(error);
      }
    },
    async googleLogin(req, res, next) {
      try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ success: false, message: 'Thiếu Google Token' });

        const result = await authService.verifyGoogleLogin(idToken);
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },

    async googleRegister(req, res, next) {
      try {
        const { email, fullName, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu' });

        const result = await authService.registerWithGoogle(email, fullName, password);
        res.status(201).json({ success: true, message: 'Đăng ký và Đăng nhập thành công', data: result });
      } catch (error) {
        next(error);
      }
    },
  };
}
