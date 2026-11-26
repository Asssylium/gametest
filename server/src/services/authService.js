import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { unauthorized, badRequest } from '../utils/httpError.js';

export function createAuthService(accountRepository, otpRepository, emailService) {
  return {
    async register(data) {
      const { email, password, fullName, phoneNumber, address, roleId } = data;
      let accountId;

      const existingAccount = await accountRepository.findByEmail(email);

      if (existingAccount) {
        if (existingAccount.is_active === 1) {
          throw badRequest('Email đã tồn tại và đang hoạt động trong hệ thống.');
        } else {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          await accountRepository.updatePassword(existingAccount.id, hashedPassword);
          await accountRepository.updateProfile(existingAccount.id, {
            fullName,
            phoneNumber,
            address,
          });

          accountId = existingAccount.id;
        }
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        accountId = await accountRepository.create({
          email,
          password: hashedPassword,
          fullName,
          phoneNumber,
          address,
          roleId,
        });

        await accountRepository.updateStatus(accountId, 0);
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60000);

      await otpRepository.saveOtp(email, otp, expiresAt);

      await emailService.sendOtpMail(email, otp);

      return {
        accountId,
        message: 'Vui lòng kiểm tra email để lấy mã xác thực.',
      };
    },

    async verifyEmail(email, otp) {
      const validOtp = await otpRepository.getValidOtp(email, otp);
      if (!validOtp) {
        throw badRequest('Mã OTP không hợp lệ hoặc đã hết hạn.');
      }

      const account = await accountRepository.findByEmail(email);
      if (!account) {
        throw badRequest('Không tìm thấy tài khoản.');
      }

      await otpRepository.markAsUsed(validOtp.id);
      await accountRepository.updateStatus(account.id, 1);

      return { success: true, message: 'Xác thực email thành công!' };
    },

    async login(email, password) {
      const account = await accountRepository.findByEmail(email);
      if (!account) {
        throw unauthorized('Email hoặc mật khẩu không đúng');
      }

      if (account.is_active === 0) {
        const error = new Error('Tài khoản chưa được kích hoạt. Vui lòng xác thực email.');
        error.statusCode = 403;
        error.code = 'ACCOUNT_INACTIVE';
        throw error;
      }

      const isPasswordMatch = await bcrypt.compare(password, account.password);
      if (!isPasswordMatch) {
        throw unauthorized('Email hoặc mật khẩu không đúng');
      }

      const payload = { id: account.id, email: account.email, roleId: account.role_id };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      });

      return {
        token,
        user: {
          id: account.id,
          email: account.email,
          fullName: account.full_name,
          roleId: account.role_id,
        },
      };
    },

    async changePassword(userId, currentPassword, newPassword) {
      const account = await accountRepository.findById(userId);
      if (!account) throw unauthorized('Không tìm thấy tài khoản.');

      const isMatch = await bcrypt.compare(currentPassword, account.password);
      if (!isMatch) throw badRequest('Mật khẩu hiện tại không chính xác.');

      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);
      await accountRepository.updatePassword(userId, hashedNewPassword);
    },

    async getProfile(userId) {
      const account = await accountRepository.findById(userId);
      if (!account) throw unauthorized('Không tìm thấy tài khoản.');
      return {
        id: account.id,
        email: account.email,
        fullName: account.full_name,
        phoneNumber: account.phone_number,
        address: account.address,
        avatarUrl: account.avatar_url,
        roleId: account.role_id,
        balance: account.balance || 0,
      };
    },

    async updateProfile(userId, profileData) {
      const account = await accountRepository.findById(userId);
      if (!account) throw unauthorized('Không tìm thấy tài khoản.');
      await accountRepository.updateProfile(userId, profileData);
      return this.getProfile(userId);
    },
    async verifyGoogleLogin(idToken) {
      try {
        const clientId = process.env.GOOGLE_CLIENT_ID.trim();

        const { OAuth2Client } = await import('google-auth-library');
        const googleClient = new OAuth2Client(clientId);

        console.log('👉 Token nhận được:', idToken ? idToken.substring(0, 20) + '...' : 'Trống không!');

        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: clientId,
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;

        const account = await accountRepository.findByEmail(email);

        if (account) {
          if (account.is_active === 0) {
            await accountRepository.updateStatus(account.id, 1);
          }
          const token = jwt.sign(
            { id: account.id, email: account.email, roleId: account.role_id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
          );
          return {
            success: true,
            token,
            user: { id: account.id, email: account.email, fullName: account.full_name, roleId: account.role_id },
          };
        } else {
          return { success: false, requirePassword: true, email, fullName: name };
        }
      } catch (error) {
        console.error('❌ LỖI THỰC SỰ TỪ GOOGLE:', error);
        throw badRequest('Xác thực Google thất bại. Token không hợp lệ.');
      }
    },

    async registerWithGoogle(email, fullName, password) {
      const existingAccount = await accountRepository.findByEmail(email);
      if (existingAccount) {
        throw badRequest('Email này đã tồn tại trong hệ thống.');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const accountId = await accountRepository.create({
        email,
        password: hashedPassword,
        fullName,
        phoneNumber: null,
        address: null,
        roleId: 3,
      });

      await accountRepository.updateStatus(accountId, 1);

      const token = jwt.sign({ id: accountId, email, roleId: 3 }, process.env.JWT_SECRET || 'secret', {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      });

      return { success: true, token, user: { id: accountId, email, fullName, roleId: 3 } };
    },
  };
}
