import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Info, 
  Sparkles,
  Layers,
  KeyRound,
  Download,
  CheckCircle2
} from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import InstallGuideModal from '../components/InstallGuideModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import logoImg from '../assets/logo.png';

/**
 * Enterprise Central Login Page
 * Phase 4: Premium 3D depth, animated ambient particles, accessible controls,
 * and genuine authentication error handling.
 */
const Login = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const toast = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Progressive Web App (PWA) Install Lifecycle
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState('ios');
  const [installLoading, setInstallLoading] = useState(false);

  const handleInstallClick = async () => {
    setInstallLoading(true);
    try {
      const result = await installApp();
      if (result.status === 'instructions_needed') {
        setGuidePlatform(result.platform);
        setIsGuideOpen(true);
      } else if (result.status === 'accepted') {
        toast.success('PixxTech Central Portal installed to your device!', 'App Installed');
      }
    } catch {
      setGuidePlatform(isIOS ? 'ios' : 'browser');
      setIsGuideOpen(true);
    } finally {
      setInstallLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMessage('Please provide your corporate email and security password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      toast.success(`Welcome back, ${res.user.name}. Central portal session established.`, 'Session Authenticated');
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    } else {
      setErrorMessage(res.error || 'Invalid corporate credentials. Please verify your email and password.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        backgroundColor: 'var(--bg-darkest, #070B17)',
        overflow: 'hidden',
      }}
    >
      {/* Ambient Radial Lighting & Subtle Animated Geometric Elements */}
      <div className="portal-ambient-bg" />

      {/* Floating Ambient Glowing Spheres */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '15%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(53, 214, 255, 0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          animation: 'floatingOrb1 18s ease-in-out infinite alternate',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '15%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(145, 103, 255, 0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          animation: 'floatingOrb2 22s ease-in-out infinite alternate',
        }}
      />

      {/* Main Glassmorphic Login Card with 3D Depth */}
      <div
        className="glass-surface"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '42px 38px',
          borderRadius: '24px',
          backgroundColor: 'var(--bg-glass-elevated, rgba(17, 27, 48, 0.88))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-card, rgba(91, 140, 255, 0.22))',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(53, 214, 255, 0.14)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.35), 0 0 16px rgba(255, 255, 255, 0.25)',
              marginBottom: '16px',
              overflow: 'hidden',
              padding: '6px',
            }}
          >
            <img
              src={logoImg}
              alt="PixxTechnologies"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '12px',
                display: 'block',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary, #F5F7FF)', letterSpacing: '-0.02em' }}>
              Pixx<span style={{ color: 'var(--cyan-accent, #35D6FF)' }}>Tech</span>
            </span>
            <Badge variant="cyan" size="sm">
              CENTRAL PORTAL
            </Badge>
          </div>

          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary, #A5B1C8)', margin: 0 }}>
            Unified Gateway for PixxTechnologies Applications
          </p>
        </div>

        {/* PWA Install Action Banner */}
        {!isInstalled ? (
          <div
            style={{
              marginBottom: '22px',
              padding: '12px 14px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(53, 214, 255, 0.1) 0%, rgba(91, 140, 255, 0.12) 100%)',
              border: '1px solid rgba(53, 214, 255, 0.28)',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(53, 214, 255, 0.15)',
                  border: '1px solid rgba(53, 214, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cyan-accent, #35D6FF)',
                  flexShrink: 0,
                }}
              >
                <Download size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #F5F7FF)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Install PixxTech App
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #A5B1C8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Standalone window • Fast launch
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleInstallClick}
              loading={installLoading}
              style={{
                boxShadow: '0 0 14px rgba(53, 214, 255, 0.35)',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              Install App
            </Button>
          </div>
        ) : (
          <div
            style={{
              marginBottom: '20px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#10B981',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={13} />
            <span>Running in Standalone App Window</span>
          </div>
        )}

        {/* Real Error Alert Message */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#fca5a5',
              lineHeight: 1.45,
            }}
          >
            <AlertCircle size={17} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            label="Corporate Work Email or Username"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            icon={Mail}
            placeholder="name@pixxtech.com"
            required
            autoComplete="username"
          />

          <div style={{ position: 'relative' }}>
            <Input
              label="Security Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '12px',
                top: '38px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #64748B)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={ArrowRight}
            iconPosition="right"
            style={{ width: '100%', marginTop: '6px' }}
          >
            Authenticate Portal Session
          </Button>
        </form>

        {/* Preserved Auth Assurance */}
        <div
          style={{
            marginTop: '26px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#10b981',
          }}
        >
          <ShieldCheck size={16} />
          <span>Independent System Credentials Strictly Preserved</span>
        </div>
      </div>

      {/* Progressive Web App Install Instructions Modal */}
      <InstallGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        platform={guidePlatform}
      />

      <style>{`
        @keyframes floatingOrb1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, 40px) scale(1.08); }
        }
        @keyframes floatingOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-35px, -30px) scale(1.06); }
        }
      `}</style>
    </div>
  );
};

export default Login;
