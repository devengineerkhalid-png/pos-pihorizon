
import React, { useState } from 'react';
import { Button, Input } from '../components/UIComponents';
import { ArrowRight, ShieldCheck, LayoutDashboard, Lock, User as UserIcon } from 'lucide-react';
import { AuthState } from '../types';
import { useStore } from '../context/StoreContext';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const { login, registerUser, users } = useStore();
  const [step, setStep] = useState<AuthState>(AuthState.LOGIN);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if(!email) { setError('Email is required'); return; }
    setError('');
    setIsLoading(true);
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    
    setTimeout(() => {
        setIsLoading(false);
        if (existingUser) {
            // User exists, jump directly to login
            setStep(AuthState.PIN_LOGIN);
        } else {
            // User doesn't exist, go to setup flow
            setStep(AuthState.OTP);
        }
    }, 600);
  };

  const handleOtp = () => {
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setStep(AuthState.SET_PIN);
    }, 800);
  };

  const handleSetPin = () => {
    if(pin.length < 4) { setError('PIN must be 4 digits'); return; }
    setError('');
    setPin('');
    setStep(AuthState.CONFIRM_PIN);
  };

  const handleConfirmPin = () => {
    if(pin.length < 4) { setError('PIN must be 4 digits'); return; }
    setIsLoading(true);
    
    // Actually register/update the user here
    registerUser(email, pin);

    setTimeout(() => {
        setIsLoading(false);
        setPin(''); // Clear confirm pin so user can enter it fresh in login screen, or just login directly?
        // Let's have them login to verify
        setStep(AuthState.PIN_LOGIN);
    }, 800);
  };

  const handlePinLogin = () => {
     setIsLoading(true);
     setTimeout(() => {
        const success = login(email, pin);
        if (success) {
            onAuthenticated();
        } else {
            setError('Invalid PIN');
            setIsLoading(false);
        }
     }, 600);
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900">
      
      {/* Left Side - Brand / Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden flex-col justify-between p-12 text-white">
         {/* Abstract Background */}
         <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-600/30 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px]"></div>
         </div>

         <div className="relative z-10">
            <div className="h-10 w-10 bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-900/50 mb-6">
                P
            </div>
            <h2 className="text-3xl font-bold leading-tight">Manage your business<br/>with absolute clarity.</h2>
            <p className="mt-4 text-slate-400 text-lg max-w-md">Real-time inventory, sales analytics, and seamless POS in one unified platform.</p>
         </div>

         <div className="relative z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl max-w-sm">
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <p className="font-semibold text-white">Daily Revenue</p>
                        <p className="text-emerald-400 text-sm">+12.5% vs yesterday</p>
                    </div>
                </div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[70%] bg-emerald-500 rounded-full"></div>
                </div>
            </div>
         </div>

         <div className="relative z-10 text-sm text-slate-500">
            © 2024 POS System Inc.
         </div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
            
            {step === AuthState.LOGIN && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
                        <p className="text-slate-500 mt-2">Please enter your details to sign in.</p>
                    </div>
                    <div className="space-y-6">
                        <Input 
                            label="Email Address" 
                            placeholder="admin@pos.com" 
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            error={error}
                            autoFocus
                        />
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-600" />
                                <span className="text-slate-600">Remember me</span>
                            </label>
                            <button className="text-primary-600 font-medium hover:text-primary-700">Forgot password?</button>
                        </div>
                        <Button className="w-full h-12 text-base" onClick={handleLogin} isLoading={isLoading}>
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {step === AuthState.OTP && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                     <div className="mb-10 text-center">
                        <div className="mx-auto w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-6 text-primary-600">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verification Required</h1>
                        <p className="text-slate-500 mt-2">Enter the 6-digit code sent to <span className="text-slate-900 font-medium">{email}</span></p>
                    </div>
                    <div className="space-y-6">
                        <Input 
                            className="text-center text-3xl tracking-[1em] font-mono h-14" 
                            maxLength={6} 
                            placeholder="000000" 
                            onKeyDown={e => e.key === 'Enter' && handleOtp()}
                            autoFocus 
                        />
                        <Button className="w-full h-12 text-base" onClick={handleOtp} isLoading={isLoading}>Verify Code</Button>
                        <button onClick={() => setStep(AuthState.LOGIN)} className="w-full text-sm text-slate-500 hover:text-slate-900 mt-4">Change email address</button>
                    </div>
                </div>
            )}

            {(step === AuthState.SET_PIN || step === AuthState.CONFIRM_PIN) && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="mb-10 text-center">
                        <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-600">
                            <Lock size={32} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            {step === AuthState.SET_PIN ? 'Secure your Account' : 'Confirm PIN'}
                        </h1>
                        <p className="text-slate-500 mt-2">Set a 4-digit PIN for quick access</p>
                    </div>
                    <div className="space-y-6">
                        <Input 
                            type="password" 
                            className="text-center text-4xl tracking-[0.5em] h-16 font-bold" 
                            maxLength={4} 
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (step === AuthState.SET_PIN ? handleSetPin() : handleConfirmPin())}
                            error={error}
                            autoFocus
                            placeholder="••••"
                        />
                        <Button className="w-full h-12 text-base" onClick={step === AuthState.SET_PIN ? handleSetPin : handleConfirmPin} isLoading={isLoading}>
                            {step === AuthState.SET_PIN ? 'Continue' : 'Set PIN'}
                        </Button>
                    </div>
                </div>
            )}

            {step === AuthState.PIN_LOGIN && (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                     <div className="mb-10 text-center">
                        <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-xl relative">
                            <UserIcon size={40} className="text-slate-400" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
                        <p className="text-slate-500 mt-2">{email}</p>
                    </div>
                    <div className="space-y-6 max-w-xs mx-auto">
                        <Input 
                            type="password" 
                            className="text-center text-4xl tracking-[0.5em] h-16 font-bold text-slate-900" 
                            maxLength={4} 
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handlePinLogin()}
                            error={error}
                            autoFocus
                            placeholder="••••"
                        />
                        <Button className="w-full h-12 text-base shadow-lg shadow-primary-500/20" onClick={handlePinLogin} isLoading={isLoading}>
                            Access Dashboard
                        </Button>
                        <div className="text-center space-y-2">
                            <button onClick={() => setStep(AuthState.LOGIN)} className="w-full text-sm text-slate-400 hover:text-slate-600">Switch Account</button>
                            <button onClick={() => setStep(AuthState.OTP)} className="w-full text-xs text-primary-500 hover:text-primary-700">Forgot / Reset PIN</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};
