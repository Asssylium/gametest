import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const { login, verifyEmail, loginWithGoogle, registerGoogleUser, user } = useAuth();
  const navigate = useNavigate();

  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // Trạng thái cho luồng OTP cũ
  const [isRequireOtp, setIsRequireOtp] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Trạng thái cho luồng Google tạo mật khẩu
  const [isRequireGooglePassword, setIsRequireGooglePassword] = useState(false);
  const [googleData, setGoogleData] = useState({ email: '', fullName: '' });
  const [googlePassword, setGooglePassword] = useState('');
  const [submittingGoogle, setSubmittingGoogle] = useState(false);

  if (user) {
    return <Navigate to="/games" replace />;
  }

  // --- 1. Xử lý Đăng nhập thủ công ---
  const onSubmitLogin = async (data) => {
    setApiError('');
    setApiSuccess('');
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        navigate('/games');
      } else {
        setApiError(result.message);
        if (result.isInactive) {
          setIsRequireOtp(true);
          setPendingEmail(data.email);
        }
      }
    } catch (error) {
      setApiError('Lỗi hệ thống! Vui lòng thử lại sau.');
    }
  };

  // --- 2. Xử lý Đăng nhập Google ---
  const handleGoogleSuccess = async (credentialResponse) => {
    setApiError('');
    const result = await loginWithGoogle(credentialResponse.credential);

    if (result.success) {
      navigate('/games');
    } else if (result.requirePassword) {
      // Bật form tạo mật khẩu và lưu thông tin
      setGoogleData({ email: result.email, fullName: result.fullName });
      setIsRequireGooglePassword(true);
    } else {
      setApiError(result.message);
    }
  };

  const handleGoogleError = () => {
    setApiError('Không thể kết nối với Google. Vui lòng thử lại.');
  };

  // --- 3. Xử lý Tạo mật khẩu cho Google User mới ---
  const onSubmitGooglePassword = async (e) => {
    e.preventDefault();
    setApiError('');
    setSubmittingGoogle(true);

    const result = await registerGoogleUser(googleData.email, googleData.fullName, googlePassword);

    setSubmittingGoogle(false);
    if (result.success) {
      navigate('/games');
    } else {
      setApiError(result.message);
    }
  };

  // --- 4. Xử lý Xác thực OTP (Luồng cũ) ---
  const onSubmitOtp = async (e) => {
    e.preventDefault();
    setApiError('');
    setVerifying(true);
    const result = await verifyEmail(pendingEmail, otp);
    setVerifying(false);
    if (result.success) {
      setApiSuccess('Xác thực thành công! Vui lòng đăng nhập lại.');
      setIsRequireOtp(false);
      setOtp('');
    } else {
      setApiError(result.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h2>
          {isRequireOtp ? 'Xác thực tài khoản' : isRequireGooglePassword ? 'Hoàn tất tài khoản' : 'Đăng nhập Hệ thống'}
        </h2>

        {apiError && <div style={styles.errorBanner}>{apiError}</div>}
        {apiSuccess && <div style={styles.successBanner}>{apiSuccess}</div>}

        {/* --- FORM ĐĂNG NHẬP CHÍNH --- */}
        {!isRequireOtp && !isRequireGooglePassword && (
          <>
            <form onSubmit={handleSubmit(onSubmitLogin)}>
              <div style={styles.inputGroup}>
                <label>Email</label>
                <input
                  type="email"
                  placeholder="admin@newwave.vn"
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ' },
                  })}
                  style={styles.input}
                />
                {errors.email && <span style={styles.errorText}>{errors.email.message}</span>}
              </div>

              <div style={styles.inputGroup}>
                <label>Mật khẩu</label>
                <input
                  type="password"
                  placeholder="********"
                  {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                  style={styles.input}
                />
                {errors.password && <span style={styles.errorText}>{errors.password.message}</span>}
              </div>

              <button type="submit" disabled={isSubmitting} style={styles.button}>
                {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

            <div style={styles.divider}>
              <hr style={styles.line} />
              <span style={styles.orText}>Hoặc</span>
              <hr style={styles.line} />
            </div>

            {/* Nút Đăng nhập bằng Google */}
            <div style={styles.googleBtnContainer}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap // Bật tính năng One Tap (tùy chọn)
                theme="outline"
                size="large"
                width="100%"
                text="signin_with"
              />
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
              Chưa có tài khoản?{' '}
              <Link to="/register" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>
                Đăng ký ngay
              </Link>
            </div>
          </>
        )}

        {/* --- FORM TẠO MẬT KHẨU CHO GOOGLE NEW USER --- */}
        {isRequireGooglePassword && (
          <form onSubmit={onSubmitGooglePassword}>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '15px' }}>
              Chào <strong>{googleData.fullName}</strong>, vì đây là lần đầu bạn đăng nhập bằng Google (
              <strong>{googleData.email}</strong>), vui lòng tạo một mật khẩu để bảo vệ tài khoản.
            </p>

            <div style={styles.inputGroup}>
              <label>Mật khẩu mới</label>
              <input
                type="password"
                placeholder="Nhập ít nhất 6 ký tự..."
                value={googlePassword}
                onChange={(e) => setGooglePassword(e.target.value)}
                style={styles.input}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={submittingGoogle || googlePassword.length < 6}
              style={{ ...styles.button, backgroundColor: '#28a745' }}
            >
              {submittingGoogle ? 'Đang tạo...' : 'Lưu mật khẩu và Đăng nhập'}
            </button>

            <button
              type="button"
              onClick={() => setIsRequireGooglePassword(false)}
              style={{ ...styles.button, backgroundColor: '#6c757d', marginTop: '10px' }}
            >
              Quay lại
            </button>
          </form>
        )}

        {/* --- FORM NHẬP OTP (Luồng cũ) --- */}
        {isRequireOtp && (
          <form onSubmit={onSubmitOtp}>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '15px' }}>
              Tài khoản <strong>{pendingEmail}</strong> chưa kích hoạt. Vui lòng kiểm tra email để lấy mã OTP 6 số.
            </p>
            <div style={styles.inputGroup}>
              <input
                type="text"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ ...styles.input, textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={verifying || otp.length < 6}
              style={{ ...styles.button, backgroundColor: '#28a745' }}
            >
              {verifying ? 'Đang kiểm tra...' : 'Xác thực'}
            </button>
            <button
              type="button"
              onClick={() => setIsRequireOtp(false)}
              style={{ ...styles.button, backgroundColor: '#6c757d', marginTop: '10px' }}
            >
              Quay lại
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  form: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  inputGroup: { marginBottom: '1rem', display: 'flex', flexDirection: 'column' },
  input: { padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ccc', borderRadius: '4px' },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  errorText: { color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' },
  errorBanner: {
    backgroundColor: '#ffe6e6',
    color: 'red',
    padding: '0.5rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    textAlign: 'center',
    fontSize: '14px',
  },
  successBanner: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '0.5rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    textAlign: 'center',
    fontSize: '14px',
  },
  divider: { display: 'flex', alignItems: 'center', margin: '20px 0' },
  line: { flex: 1, border: 'none', borderTop: '1px solid #ddd' },
  orText: { margin: '0 10px', color: '#888', fontSize: '14px' },
  googleBtnContainer: { display: 'flex', justifyContent: 'center', width: '100%' },
};

export default LoginPage;
