/**
 * Exit Button Embed Styles
 * Glass morphism design — calm, trustworthy experience
 */

export const CSS_VARIABLES = `
:root {
  --exit-button-accent: #5eead4;
  --exit-button-accent-rgb: 94, 234, 212;
  --exit-button-accent-hover: #2dd4bf;
  --exit-button-accent-glow: rgba(var(--exit-button-accent-rgb), 0.2);
  --exit-button-glass: rgba(255, 255, 255, 0.07);
  --exit-button-glass-hover: rgba(255, 255, 255, 0.12);
  --exit-button-glass-strong: rgba(255, 255, 255, 0.1);
  --exit-button-border: rgba(255, 255, 255, 0.1);
  --exit-button-border-hover: rgba(255, 255, 255, 0.2);
  --exit-button-text: rgba(255, 255, 255, 0.92);
  --exit-button-text-secondary: rgba(255, 255, 255, 0.55);
  --exit-button-error: #fca5a5;
  --exit-button-error-rgb: 252, 165, 165;
  --exit-button-success: #86efac;
  --exit-button-success-rgb: 134, 239, 172;
  --exit-button-radius: 20px;
  --exit-button-radius-sm: 14px;
  --exit-button-shadow: 0 32px 64px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --exit-button-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --exit-button-overlay-bg:
    radial-gradient(ellipse at 20% 50%, rgba(45, 80, 70, 0.9) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(35, 60, 80, 0.8) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(55, 70, 50, 0.6) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(60, 50, 45, 0.4) 0%, transparent 40%),
    linear-gradient(160deg, #1a2a25 0%, #1e3035 35%, #2a3830 65%, #1e2e35 100%);
}
`;

export const KEYFRAMES = `
@keyframes exit-button-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes exit-button-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes exit-button-slide-up {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes exit-button-slide-down {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(24px) scale(0.96);
  }
}

@keyframes exit-button-pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
}

@keyframes exit-button-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes exit-button-wave {
  0%, 100% {
    height: 6px;
    opacity: 0.4;
  }
  50% {
    height: 28px;
    opacity: 1;
  }
}

@keyframes exit-button-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(var(--exit-button-accent-rgb), 0.1);
  }
  50% {
    box-shadow: 0 0 40px rgba(var(--exit-button-accent-rgb), 0.25);
  }
}
`;

export const MODAL_STYLES = `
/* ============================= */
/* Overlay — rich calming gradient */
/* ============================= */
.exit-button-overlay {
  position: fixed;
  inset: 0;
  background: var(--exit-button-overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  animation: exit-button-fade-in 0.4s ease-out;
  font-family: var(--exit-button-font);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.exit-button-overlay.closing {
  animation: exit-button-fade-out 0.3s ease-out forwards;
}

/* ============================= */
/* Modal — frosted glass panel   */
/* ============================= */
.exit-button-modal {
  background: var(--exit-button-glass);
  backdrop-filter: blur(40px) saturate(140%);
  -webkit-backdrop-filter: blur(40px) saturate(140%);
  border: 1px solid var(--exit-button-border);
  border-radius: var(--exit-button-radius);
  box-shadow: var(--exit-button-shadow);
  max-width: 520px;
  width: 92%;
  max-height: 90vh;
  overflow: hidden;
  animation: exit-button-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.exit-button-overlay.closing .exit-button-modal {
  animation: exit-button-slide-down 0.3s ease-out forwards;
}

/* Header */
.exit-button-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 28px 8px;
  position: relative;
}

.exit-button-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--exit-button-text);
  margin: 0;
  letter-spacing: -0.01em;
  text-align: center;
}

.exit-button-close {
  position: absolute;
  right: 28px;
  background: var(--exit-button-glass);
  border: 1px solid var(--exit-button-border);
  padding: 0;
  cursor: pointer;
  color: var(--exit-button-text-secondary);
  border-radius: 50%;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.exit-button-close:hover {
  background: var(--exit-button-glass-hover);
  border-color: var(--exit-button-border-hover);
  color: var(--exit-button-text);
}

.exit-button-close:focus {
  outline: 2px solid var(--exit-button-accent);
  outline-offset: 2px;
}

.exit-button-close svg {
  width: 18px;
  height: 18px;
}

/* Content */
.exit-button-content {
  padding: 16px 28px 28px;
  overflow-y: auto;
  max-height: calc(90vh - 120px);
}

/* Footer */
.exit-button-footer {
  padding: 20px 28px;
  border-top: 1px solid var(--exit-button-border);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* ============================= */
/* State: Connecting             */
/* ============================= */
.exit-button-connecting {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;
}

.exit-button-spinner {
  width: 44px;
  height: 44px;
  border: 2px solid var(--exit-button-border);
  border-top-color: var(--exit-button-accent);
  border-radius: 50%;
  animation: exit-button-spin 1s linear infinite;
  margin-bottom: 20px;
}

.exit-button-connecting-text {
  color: var(--exit-button-text-secondary);
  font-size: 14px;
  letter-spacing: 0.01em;
}

/* ============================= */
/* State: Permission             */
/* ============================= */
.exit-button-permission {
  text-align: center;
  padding: 12px 0;
}

.exit-button-permission-desc {
  font-size: 14px;
  color: var(--exit-button-text-secondary);
  margin: 0 0 24px;
  line-height: 1.6;
}

.exit-button-mode-options {
  display: flex;
  flex-direction: row;
  gap: 12px;
}

.exit-button-mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex: 1;
  padding: 24px 16px;
  border-radius: var(--exit-button-radius-sm);
  border: 1px solid var(--exit-button-border);
  background: var(--exit-button-glass);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  font-family: inherit;
  color: inherit;
}

.exit-button-mode-card:hover {
  background: var(--exit-button-glass-hover);
  border-color: var(--exit-button-border-hover);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.exit-button-mode-card:active {
  transform: scale(0.98);
}

.exit-button-mode-card-voice {
  border-color: rgba(var(--exit-button-accent-rgb), 0.25);
  background: rgba(var(--exit-button-accent-rgb), 0.06);
}

.exit-button-mode-card-voice:hover {
  border-color: rgba(var(--exit-button-accent-rgb), 0.4);
  background: rgba(var(--exit-button-accent-rgb), 0.1);
  box-shadow: 0 8px 32px rgba(var(--exit-button-accent-rgb), 0.12);
}

.exit-button-mode-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.exit-button-mode-card-icon-voice {
  background: linear-gradient(135deg, rgba(var(--exit-button-accent-rgb), 0.2), rgba(var(--exit-button-accent-rgb), 0.3));
  color: var(--exit-button-accent);
  border: 1px solid rgba(var(--exit-button-accent-rgb), 0.2);
}

.exit-button-mode-card-icon-voice svg {
  width: 22px;
  height: 22px;
}

.exit-button-mode-card-icon-chat {
  background: var(--exit-button-glass-strong);
  color: var(--exit-button-text-secondary);
  border: 1px solid var(--exit-button-border);
}

.exit-button-mode-card-icon-chat svg {
  width: 22px;
  height: 22px;
}

.exit-button-mode-card-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.exit-button-mode-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--exit-button-text);
}

.exit-button-mode-card-desc {
  font-size: 13px;
  color: var(--exit-button-text-secondary);
}

.exit-button-mode-card-badge {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.2);
  padding: 5px 12px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.exit-button-mode-card-chat:hover {
  border-color: var(--exit-button-border-hover);
}

.exit-button-skip-link {
  display: inline-block;
  margin-top: 16px;
  font-size: 13px;
  color: var(--exit-button-text-secondary);
  text-decoration: underline;
  cursor: pointer;
  background: none;
  border: none;
  transition: color 0.2s ease;
}

.exit-button-skip-link:hover {
  color: var(--exit-button-text);
}

/* ============================= */
/* State: Interview              */
/* ============================= */
.exit-button-interview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exit-button-visualizer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 56px;
  padding: 12px;
  background: var(--exit-button-glass);
  border: 1px solid var(--exit-button-border);
  border-radius: var(--exit-button-radius-sm);
  animation: exit-button-glow 3s ease-in-out infinite;
}

.exit-button-visualizer-bar {
  width: 4px;
  height: 6px;
  background: var(--exit-button-accent);
  border-radius: 3px;
  animation: exit-button-wave 0.6s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(var(--exit-button-accent-rgb), 0.3);
}

.exit-button-visualizer-bar:nth-child(2) { animation-delay: 0.1s; }
.exit-button-visualizer-bar:nth-child(3) { animation-delay: 0.2s; }
.exit-button-visualizer-bar:nth-child(4) { animation-delay: 0.3s; }
.exit-button-visualizer-bar:nth-child(5) { animation-delay: 0.4s; }

.exit-button-visualizer.idle .exit-button-visualizer-bar {
  animation: none;
  height: 6px;
  opacity: 0.3;
  box-shadow: none;
}

.exit-button-visualizer.idle {
  animation: none;
}

.exit-button-transcript {
  background: var(--exit-button-glass);
  border: 1px solid var(--exit-button-border);
  border-radius: var(--exit-button-radius-sm);
  padding: 20px;
  max-height: 220px;
  overflow-y: auto;
}

.exit-button-transcript::-webkit-scrollbar {
  width: 6px;
}

.exit-button-transcript::-webkit-scrollbar-track {
  background: transparent;
}

.exit-button-transcript::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.exit-button-transcript::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.exit-button-transcript-entry {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.exit-button-transcript-entry:last-child {
  margin-bottom: 0;
}

.exit-button-transcript-entry.user {
  align-items: flex-end;
}

.exit-button-transcript-role {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--exit-button-text-secondary);
  margin-bottom: 6px;
}

.exit-button-transcript-role.assistant {
  color: var(--exit-button-accent);
}

.exit-button-transcript-content {
  font-size: 14px;
  color: var(--exit-button-text);
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.04);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 90%;
}

.exit-button-transcript-entry.user .exit-button-transcript-content {
  background: rgba(var(--exit-button-accent-rgb), 0.08);
  border-color: rgba(var(--exit-button-accent-rgb), 0.12);
}

/* Text input — glass pill bar */
.exit-button-text-input {
  display: flex;
  gap: 10px;
  align-items: center;
}

.exit-button-input {
  flex: 1;
  padding: 14px 20px;
  border: 1px solid var(--exit-button-border);
  border-radius: 28px;
  font-size: 14px;
  font-family: inherit;
  color: var(--exit-button-text);
  background: var(--exit-button-glass);
  transition: all 0.25s ease;
}

.exit-button-input::placeholder {
  color: var(--exit-button-text-secondary);
}

.exit-button-input:focus {
  outline: none;
  border-color: rgba(var(--exit-button-accent-rgb), 0.4);
  background: var(--exit-button-glass-hover);
  box-shadow: 0 0 20px rgba(var(--exit-button-accent-rgb), 0.1);
}

/* Send button */
.exit-button-text-input .exit-button-btn {
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.exit-button-text-input .exit-button-btn svg {
  width: 18px;
  height: 18px;
}

/* ============================= */
/* State: Offers                 */
/* ============================= */
.exit-button-offers {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.exit-button-offers-title {
  font-size: 15px;
  font-weight: 400;
  color: var(--exit-button-text-secondary);
  margin: 0 0 4px;
  line-height: 1.5;
}

.exit-button-offer-card {
  background: var(--exit-button-glass);
  border: 1px solid var(--exit-button-border);
  border-radius: var(--exit-button-radius-sm);
  padding: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.exit-button-offer-card:hover {
  background: var(--exit-button-glass-hover);
  border-color: var(--exit-button-border-hover);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.exit-button-offer-card:focus {
  outline: 2px solid var(--exit-button-accent);
  outline-offset: 2px;
}

.exit-button-offer-card.selected {
  border-color: rgba(var(--exit-button-accent-rgb), 0.4);
  background: rgba(var(--exit-button-accent-rgb), 0.08);
  box-shadow: 0 0 24px rgba(var(--exit-button-accent-rgb), 0.1);
}

.exit-button-offer-type {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--exit-button-accent);
  background: rgba(var(--exit-button-accent-rgb), 0.1);
  border: 1px solid rgba(var(--exit-button-accent-rgb), 0.15);
  padding: 4px 10px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.exit-button-offer-headline {
  font-size: 15px;
  font-weight: 600;
  color: var(--exit-button-text);
  margin: 0 0 6px;
}

.exit-button-offer-description {
  font-size: 13px;
  color: var(--exit-button-text-secondary);
  margin: 0 0 10px;
  line-height: 1.5;
}

.exit-button-offer-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--exit-button-success);
}

/* ============================= */
/* State: Done                   */
/* ============================= */
.exit-button-done {
  text-align: center;
  padding: 28px 0;
}

.exit-button-done-icon {
  width: 64px;
  height: 64px;
  background: rgba(var(--exit-button-success-rgb), 0.1);
  border: 1px solid rgba(var(--exit-button-success-rgb), 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: var(--exit-button-success);
  box-shadow: 0 0 32px rgba(var(--exit-button-success-rgb), 0.1);
}

.exit-button-done-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--exit-button-text);
  margin: 0 0 10px;
  letter-spacing: -0.02em;
}

.exit-button-done-desc {
  font-size: 14px;
  color: var(--exit-button-text-secondary);
  margin: 0 auto;
  line-height: 1.6;
  max-width: 320px;
}

/* ============================= */
/* State: Error                  */
/* ============================= */
.exit-button-error {
  text-align: center;
  padding: 28px 0;
}

.exit-button-error-icon {
  width: 64px;
  height: 64px;
  background: rgba(var(--exit-button-error-rgb), 0.1);
  border: 1px solid rgba(var(--exit-button-error-rgb), 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: var(--exit-button-error);
  box-shadow: 0 0 32px rgba(var(--exit-button-error-rgb), 0.08);
}

.exit-button-error-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--exit-button-text);
  margin: 0 0 10px;
}

.exit-button-error-desc {
  font-size: 14px;
  color: var(--exit-button-text-secondary);
  margin: 0 0 28px;
  line-height: 1.6;
}

/* ============================= */
/* Buttons                       */
/* ============================= */
.exit-button-btn {
  padding: 12px 28px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  border-radius: 28px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: none;
  letter-spacing: 0.01em;
}

.exit-button-btn:focus {
  outline: 2px solid var(--exit-button-accent);
  outline-offset: 2px;
}

.exit-button-btn:active {
  transform: scale(0.97);
}

.exit-button-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.exit-button-btn-primary {
  background: rgba(var(--exit-button-accent-rgb), 0.15);
  color: var(--exit-button-accent);
  border: 1px solid rgba(var(--exit-button-accent-rgb), 0.25);
}

.exit-button-btn-primary:hover:not(:disabled) {
  background: rgba(var(--exit-button-accent-rgb), 0.22);
  border-color: rgba(var(--exit-button-accent-rgb), 0.4);
  box-shadow: 0 0 20px rgba(var(--exit-button-accent-rgb), 0.12);
}

.exit-button-btn-secondary {
  background: var(--exit-button-glass);
  color: var(--exit-button-text);
  border: 1px solid var(--exit-button-border);
}

.exit-button-btn-secondary:hover {
  background: var(--exit-button-glass-hover);
  border-color: var(--exit-button-border-hover);
}

.exit-button-btn-danger {
  background: transparent;
  color: var(--exit-button-error);
  border: 1px solid rgba(var(--exit-button-error-rgb), 0.25);
}

.exit-button-btn-danger:hover {
  background: rgba(var(--exit-button-error-rgb), 0.08);
  border-color: rgba(var(--exit-button-error-rgb), 0.4);
}

/* ============================= */
/* Accessibility                 */
/* ============================= */
@media (prefers-reduced-motion: reduce) {
  .exit-button-overlay,
  .exit-button-modal,
  .exit-button-spinner,
  .exit-button-visualizer-bar,
  .exit-button-visualizer {
    animation: none !important;
  }
}

.exit-button-btn:focus-visible,
.exit-button-close:focus-visible,
.exit-button-offer-card:focus-visible {
  outline: 2px solid var(--exit-button-accent);
  outline-offset: 2px;
}
`;

export function injectStyles(): void {
  if (document.getElementById('exit-button-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'exit-button-styles';
  style.textContent = CSS_VARIABLES + KEYFRAMES + MODAL_STYLES;
  document.head.appendChild(style);
}

export function removeStyles(): void {
  const style = document.getElementById('exit-button-styles');
  if (style) {
    style.remove();
  }
}
