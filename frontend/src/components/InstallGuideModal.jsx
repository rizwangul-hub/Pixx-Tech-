import React from 'react';
import { 
  Share, 
  PlusSquare, 
  Download, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Laptop, 
  Compass,
  AlertCircle
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

/**
 * InstallGuideModal
 * Guides users on installing PixxTech Central Portal when the browser does not
 * support a programmatic 1-click install prompt (such as iOS Safari or unsupported desktop browsers).
 */
const InstallGuideModal = ({ isOpen, onClose, platform = 'ios' }) => {
  const isIOS = platform === 'ios';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isIOS ? 'Install PixxTech on iPhone / iPad' : 'Install PixxTech Central Portal'}
      subtitle={
        isIOS
          ? 'Follow these steps in Safari to add the app to your Home Screen'
          : 'Open the portal as a standalone app on your desktop or mobile device'
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {isIOS ? (
          /* iOS Safari Specific Step-by-Step Instructions */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Step 1 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(53, 214, 255, 0.15)',
                  border: '1px solid rgba(53, 214, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cyan-accent, #35D6FF)',
                  fontWeight: 700,
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #F5F7FF)', marginBottom: '4px' }}>
                  Tap the Safari Share button
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary, #A5B1C8)', lineHeight: 1.5 }}>
                  In Safari, tap the <strong>Share</strong> button at the bottom of your screen (a square with an upward arrow <Share size={13} style={{ display: 'inline', verticalAlign: 'middle', color: '#35D6FF' }} />).
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(91, 140, 255, 0.15)',
                  border: '1px solid rgba(91, 140, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-accent, #5B8CFF)',
                  fontWeight: 700,
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #F5F7FF)', marginBottom: '4px' }}>
                  Select "Add to Home Screen"
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary, #A5B1C8)', lineHeight: 1.5 }}>
                  Scroll down the menu list and tap <strong style={{ color: '#fff' }}>Add to Home Screen</strong> (<PlusSquare size={13} style={{ display: 'inline', verticalAlign: 'middle', color: '#5B8CFF' }} />).
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  fontWeight: 700,
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #F5F7FF)', marginBottom: '4px' }}>
                  Tap "Add" in top right
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary, #A5B1C8)', lineHeight: 1.5 }}>
                  Confirm the installation by tapping <strong style={{ color: '#10B981' }}>Add</strong>. PixxTech Central Portal will now appear on your Home Screen as a standalone app!
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop / Chromium / Other Browser Instructions */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(53, 214, 255, 0.08)',
                border: '1px solid rgba(53, 214, 255, 0.25)',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <Compass size={20} color="#35D6FF" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: 'var(--text-secondary, #A5B1C8)', lineHeight: 1.5 }}>
                To install on <strong style={{ color: '#fff' }}>Google Chrome</strong> or <strong style={{ color: '#fff' }}>Microsoft Edge</strong>:
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px' }}>
                  <li>Look for the <strong>Install</strong> icon in the right side of the address bar (<Download size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />).</li>
                  <li>Or open the browser menu (<strong>⋮</strong> or <strong>…</strong>) and click <strong>"Install PixxTech Central Portal"</strong>.</li>
                </ul>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                fontSize: '12.5px',
                color: 'var(--text-muted, #64748B)',
                lineHeight: 1.5,
              }}
            >
              Once installed, PixxTech Central Portal launches in its own dedicated, chromeless application window with fast desktop shortcuts.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <Button variant="primary" size="sm" onClick={onClose}>
            Got It
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InstallGuideModal;
