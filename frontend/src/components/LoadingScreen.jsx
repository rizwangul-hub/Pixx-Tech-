import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import laptopImg from '../assets/laptop.png';
import mobileImg from '../assets/mobile.png';

/**
 * Premium PixxTechnologies Responsive Loading Screen
 *
 * Requirements:
 * - Uses actual laptop.png for desktop and laptop devices (landscape presentation)
 * - Uses actual mobile.png for mobile and portrait devices (portrait presentation)
 * - Responsive <picture> element preserves original aspect ratio with zero distortion
 * - Full-screen coverage without unwanted scrollbars or layout shifts
 * - Clean visual presentation: no redundant text, spinners, or progress bars over the images
 * - Stays active during initial boot and authentication verification
 * - Smooth Framer Motion fade-out exit transition
 * - Graceful safety timeout recovery controls
 * - Respects prefers-reduced-motion
 */
const LoadingScreen = ({
  isTimedOut = false,
  error = null,
  onRetry = null,
  onBypass = null,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="Loading PixxTech Central Portal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: shouldReduceMotion ? 0 : 0.28 } }}
      exit={{
        opacity: 0,
        transition: {
          duration: shouldReduceMotion ? 0 : 0.45,
          ease: [0.16, 1, 0.3, 1],
        },
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        width: '100vw',
        height: '100vh',
        /* Support mobile viewport height adjustments dynamically */
        minHeight: '100dvh',
        backgroundColor: '#040816',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Responsive Picture Container: Laptop vs Mobile Loading Image */}
      <picture
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          overflow: 'hidden',
        }}
      >
        {/* Mobile Screens (<= 768px or portrait orientation) */}
        <source
          media="(max-width: 768px), (orientation: portrait)"
          srcSet={mobileImg}
        />

        {/* Desktop and Laptop Screens (> 768px landscape) */}
        <source
          media="(min-width: 769px)"
          srcSet={laptopImg}
        />

        {/* Edge-to-Edge Full-Screen Image Display */}
        <img
          src={laptopImg}
          alt="PixxTechnologies Loading Screen"
          style={{
            width: '100vw',
            height: '100vh',
            minHeight: '100dvh',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      </picture>

      {/* Controlled Timeout & Error Recovery Overlay (Only if connection is delayed) */}
      {(isTimedOut || error) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            bottom: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100000,
            maxWidth: '90%',
            width: 'auto',
            padding: '12px 20px',
            borderRadius: '16px',
            backgroundColor: 'rgba(7, 11, 23, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.65), 0 0 20px rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: '#fbbf24',
              fontWeight: 600,
            }}
          >
            <AlertCircle size={15} />
            <span>Server response is delayed</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  color: '#F5F7FF',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} />
                Retry
              </button>
            )}

            {onBypass && (
              <button
                type="button"
                onClick={onBypass}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #35D6FF 0%, #5B8CFF 100%)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(53, 214, 255, 0.35)',
                }}
              >
                Continue to Portal
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LoadingScreen;
