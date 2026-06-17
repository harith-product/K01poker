import { useState, useRef } from 'react';
import { Shield, Phone, ArrowLeft, ChevronRight } from 'lucide-react';
import { ADMIN_PHONE, ADMIN_OTP } from '../../lib/adminData';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handlePhoneSubmit() {
    if (phone === ADMIN_PHONE) {
      setPhoneError('');
      setStep('otp');
    } else {
      setPhoneError('Phone number not recognised.');
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (value && index === 5) {
      if (next.join('') === ADMIN_OTP) {
        onLoginSuccess();
      } else {
        setOtpError('Incorrect OTP. Try again.');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      }
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpSubmit() {
    if (otp.join('') === ADMIN_OTP) {
      onLoginSuccess();
    } else {
      setOtpError('Incorrect OTP. Try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }
  }

  if (step === 'otp') {
    return (
      <div className="max-w-lg mx-auto px-6 pt-12 pb-8 flex flex-col items-center">
        <button onClick={() => setStep('phone')} className="self-start flex items-center gap-1 text-gray-500 text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Enter OTP</h1>
        <p className="text-gray-500 text-sm mb-8 text-center">Enter the 6-digit code</p>

        <div className="w-full space-y-5">
          <div className="flex gap-3 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { otpRefs.current[i] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold text-gray-900 bg-white rounded-2xl border-2 border-gray-100 outline-none focus:border-purple-400 shadow-sm transition-all"
                autoFocus={i === 0}
              />
            ))}
          </div>
          {otpError && <p className="text-red-500 text-xs text-center">{otpError}</p>}
          <button
            onClick={handleOtpSubmit}
            disabled={otp.join('').length !== 6}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-2xl shadow-md disabled:opacity-50"
          >
            Verify & Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 pt-16 pb-8 flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg">
        <Shield className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Access</h1>
      <p className="text-gray-500 text-sm mb-8 text-center">Enter your phone number to continue</p>

      <div className="w-full space-y-4">
        <div>
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100">
            <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Phone number"
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setPhoneError(''); }}
              onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()}
              className="flex-1 bg-transparent outline-none text-gray-900 text-base placeholder-gray-400"
              maxLength={10}
              autoFocus
            />
          </div>
          {phoneError && <p className="text-red-500 text-xs mt-2 ml-1">{phoneError}</p>}
        </div>
        <button
          onClick={handlePhoneSubmit}
          disabled={phone.length < 10}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-2xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
