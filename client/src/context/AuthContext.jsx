import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      refreshUser();
    }
    setLoading(false);

    const handleUnauthorized = () => {
      if (window.location.pathname !== '/login') {
        logout();
      }
    };
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      refreshUser();
    }

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.login({ email, password });

      const token = res?.token || res?.data?.token;
      const userData = res?.user || res?.data?.user;

      if (token && userData) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: 'Đăng nhập thất bại. Không đọc được dữ liệu token.' };
    } catch (error) {
      console.error('Lỗi catch Login:', error);
      const backendMessage = error.message || 'Sai tài khoản hoặc mật khẩu';

      const isInactive = backendMessage.includes('chưa được kích hoạt') || error.code === 'ACCOUNT_INACTIVE';

      return {
        success: false,
        message: backendMessage,
        isInactive,
      };
    }
  };
  const loginWithGoogle = async (idToken) => {
    try {
      const res = await api.googleLogin(idToken);

      if (res?.requirePassword) {
        return { success: false, requirePassword: true, email: res.email, fullName: res.fullName };
      }

      const token = res?.token || res?.data?.token;
      const userData = res?.user || res?.data?.user;

      if (token && userData) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: 'Lỗi đọc dữ liệu Google.' };
    } catch (error) {
      return { success: false, message: error.message || 'Xác thực Google thất bại' };
    }
  };
  const registerGoogleUser = async (email, fullName, password) => {
    try {
      const res = await api.googleRegister({ email, fullName, password });
      const token = res?.token || res?.data?.token;
      const userData = res?.user || res?.data?.user;

      if (token && userData) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: 'Lỗi tạo tài khoản.' };
    } catch (error) {
      return { success: false, message: error.message || 'Lỗi hệ thống' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };
  const registerAccount = async (userData) => {
    try {
      const res = await api.register(userData);
      return { success: true, message: 'Đăng ký thành công!' };
    } catch (error) {
      console.error('Lỗi catch Register:', error);
      return { success: false, message: error.message || 'Lỗi hệ thống khi đăng ký' };
    }
  };
  const verifyEmail = async (email, otp) => {
    try {
      const res = await api.verifyEmail({ email, otp });
      return { success: true, message: res.message || 'Xác thực thành công' };
    } catch (error) {
      return { success: false, message: error.message || 'Mã OTP không hợp lệ' };
    }
  };
  const refreshUser = async () => {
    try {
      const profile = await api.getProfile();
      if (profile) {
        setUser((prev) => {
          const updated = { ...prev, ...profile };
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error('Lỗi đồng bộ thông tin user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register: registerAccount,
        verifyEmail,
        loginWithGoogle,
        registerGoogleUser,
        refreshUser,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
