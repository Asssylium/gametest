import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const { register: registerAuth, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState('');
  const [step, setStep] = useState(1); // 1: Form Đăng ký, 2: Form OTP
  const [registeredEmail, setRegisteredEmail] = useState(''); // Lưu email lại để verify
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Xử lý Bước 1: Đăng ký
  const onSubmitRegister = async (data) => {
    setServerError('');
    const payload = { ...data, roleId: 3 };

    const result = await registerAuth(payload);

    if (result.success) {
      setRegisteredEmail(data.email);
      setStep(2); // Chuyển sang form OTP
    } else {
      setServerError(result.message);
    }
  };

  // Xử lý Bước 2: Nhập OTP
  const onSubmitOtp = async (e) => {
    e.preventDefault();
    setServerError('');
    setVerifying(true);

    const result = await verifyEmail(registeredEmail, otp);

    setVerifying(false);
    if (result.success) {
      alert('🎉 Xác thực thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } else {
      setServerError(result.message);
    }
  };

  return (
    <div
      style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}
    >
      <h2 style={{ textAlign: 'center' }}>{step === 1 ? 'Đăng ký Tài khoản' : 'Xác thực Email'}</h2>

      {serverError && (
        <div
          style={{
            color: 'red',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffe6e6',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          {serverError}
        </div>
      )}

      {step === 1 && (
        <form
          onSubmit={handleSubmit(onSubmitRegister)}
          style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
        >
          <div>
            <label>Họ và Tên</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
            />
            {errors.fullName && <span style={{ color: 'red', fontSize: '12px' }}>{errors.fullName.message}</span>}
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              {...register('email', {
                required: 'Vui lòng nhập email',
                pattern: { value: /^\S+@\S+$/i, message: 'Email không hợp lệ' },
              })}
            />
            {errors.email && <span style={{ color: 'red', fontSize: '12px' }}>{errors.email.message}</span>}
          </div>

          <div>
            <label>Mật khẩu</label>
            <input
              type="password"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              {...register('password', {
                required: 'Vui lòng nhập mật khẩu',
                minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
              })}
            />
            {errors.password && <span style={{ color: 'red', fontSize: '12px' }}>{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={onSubmitOtp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#555' }}>
            Chúng tôi đã gửi mã OTP 6 số đến email <strong>{registeredEmail}</strong>. Vui lòng kiểm tra và nhập mã vào
            bên dưới.
          </p>
          <div>
            <input
              type="text"
              placeholder="Nhập mã OTP (VD: 123456)"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ width: '100%', padding: '12px', textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
              maxLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={verifying || otp.length < 6}
            style={{
              padding: '10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {verifying ? 'Đang kiểm tra...' : 'Xác thực ngay'}
          </button>
        </form>
      )}

      {step === 1 && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </div>
      )}
    </div>
  );
}
