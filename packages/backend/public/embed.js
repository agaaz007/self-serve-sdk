"use strict";var ExitButton=(()=>{var A=Object.create;var g=Object.defineProperty;var I=Object.getOwnPropertyDescriptor;var T=Object.getOwnPropertyNames;var L=Object.getPrototypeOf,O=Object.prototype.hasOwnProperty;var R=(n=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(n,{get:(t,e)=>(typeof require<"u"?require:t)[e]}):n)(function(n){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+n+'" is not supported')});var M=(n,t)=>{for(var e in t)g(n,e,{get:t[e],enumerable:!0})},S=(n,t,e,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of T(t))!O.call(n,o)&&o!==e&&g(n,o,{get:()=>t[o],enumerable:!(i=I(t,o))||i.enumerable});return n};var P=(n,t,e)=>(e=n!=null?A(L(n)):{},S(t||!n||!n.__esModule?g(e,"default",{value:n,enumerable:!0}):e,n)),_=n=>S(g({},"__esModule",{value:!0}),n);var Q={};M(Q,{ExitButton:()=>m,close:()=>j,destroy:()=>K,getState:()=>J,init:()=>w,prefetch:()=>q,start:()=>F});var u=class extends Error{constructor(n,t,e){super(n),this.name="ExitButtonError",this.code=t,this.statusCode=e}},B=3e4,D=class{constructor(n){this.apiKey=n.apiKey,this.baseUrl=n.baseUrl,this.timeout=n.timeout||B}async initiate(n){return this.request("/api/exit-session/initiate",{method:"POST",body:JSON.stringify(n)})}async complete(n,t){return this.request("/api/exit-session/complete",{method:"POST",body:JSON.stringify({sessionId:n,...t})})}async prefetch(n){return this.request("/api/exit-session/prefetch",{method:"POST",body:JSON.stringify(n)})}async getSession(n){return this.request(`/api/exit-session/${n}`,{method:"GET"})}async request(n,t){let e=`${this.baseUrl}${n}`,i=new AbortController,o=setTimeout(()=>i.abort(),this.timeout);try{let r=await fetch(e,{...t,signal:i.signal,headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.apiKey}`,...t.headers}});if(clearTimeout(o),!r.ok){let a=await r.json().catch(()=>({}));throw new u(a.message||`HTTP ${r.status}: ${r.statusText}`,a.code||"API_ERROR",r.status)}return r.json()}catch(r){throw clearTimeout(o),r instanceof u?r:r instanceof Error?r.name==="AbortError"?new u("Request timeout","NETWORK_ERROR"):new u(r.message,"NETWORK_ERROR"):new u("Unknown error","UNKNOWN_ERROR")}}};function k(n){return new D(n)}var N=`
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
`,H=`
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
`,U=`
/* ============================= */
/* Overlay \u2014 rich calming gradient */
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
/* Modal \u2014 frosted glass panel   */
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
  justify-content: space-between;
  padding: 24px 28px 8px;
}

.exit-button-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--exit-button-text);
  margin: 0;
  letter-spacing: -0.01em;
}

.exit-button-close {
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

.exit-button-permission-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--exit-button-text);
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.exit-button-permission-desc {
  font-size: 14px;
  color: var(--exit-button-text-secondary);
  margin: 0 0 28px;
  line-height: 1.6;
}

.exit-button-mode-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exit-button-mode-card {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 18px 20px;
  border-radius: var(--exit-button-radius-sm);
  border: 1px solid var(--exit-button-border);
  background: var(--exit-button-glass);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
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
  flex: 1;
  min-width: 0;
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

/* Text input \u2014 glass pill bar */
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
`;function v(){if(document.getElementById("exit-button-styles"))return;let n=document.createElement("style");n.id="exit-button-styles",n.textContent=N+H+U,document.head.appendChild(n)}function E(){let n=document.getElementById("exit-button-styles");n&&n.remove()}var h={close:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>`,microphone:`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>`,microphoneOff:`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"></line>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>`,check:`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>`,error:`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>`,volume:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>`,send:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>`,chat:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>`};var f=class{constructor(t={}){this.container=null;this.currentState="closed";this.transcript=[];this.offers=[];this.selectedOfferIndex=null;this.voiceState={isConnected:!1,isSpeaking:!1,isListening:!1,volume:0};this.useFallback=!1;this.statusText="Setting up your session...";this.outcome=null;this.handleKeyDown=t=>{t.key==="Escape"&&this.container&&this.close()};this.options=t,v()}open(){this.container||(this.createModal(),this.setState("connecting"),document.body.style.overflow="hidden",setTimeout(()=>{this.container?.querySelector(".exit-button-close")?.focus()},100))}close(){this.container&&(this.container.classList.add("closing"),setTimeout(()=>{this.container?.remove(),this.container=null,document.body.style.overflow="",this.options.onClose?.()},200))}getContainer(){return this.container}setState(t){this.currentState=t,this.render()}setOutcome(t){this.outcome=t,this.currentState==="done"&&this.render()}setStatusText(t){if(this.statusText=t,this.currentState==="connecting"){let e=this.container?.querySelector(".exit-button-connecting-text");e&&(e.textContent=t)}}updateTranscript(t){this.transcript=t,this.currentState==="interview"&&this.render()}addTranscriptEntry(t){if(this.transcript.push(t),this.currentState==="interview"){this.render();let e=this.container?.querySelector(".exit-button-transcript");e&&(e.scrollTop=e.scrollHeight)}}updateOffers(t){this.offers=t,this.currentState==="offers"&&this.render()}updateVoiceState(t){if(this.voiceState=t,this.currentState==="interview"){let e=this.container?.querySelector(".exit-button-visualizer");e&&e.classList.toggle("idle",!t.isSpeaking&&!t.isListening)}}isFallbackEnabled(){return this.useFallback}enableFallback(){this.useFallback=!0,this.currentState==="interview"&&this.render()}createModal(){this.container=document.createElement("div"),this.container.className="exit-button-overlay",this.container.setAttribute("role","dialog"),this.container.setAttribute("aria-modal","true"),this.container.setAttribute("aria-labelledby","exit-button-title"),this.container.addEventListener("click",t=>{t.target===this.container&&this.close()}),document.addEventListener("keydown",this.handleKeyDown),document.body.appendChild(this.container),this.render()}render(){if(!this.container)return;let t=this.getStateContent();this.container.innerHTML=`
      <div class="exit-button-modal">
        <div class="exit-button-header">
          <h2 id="exit-button-title" class="exit-button-title">
            ${this.getTitle()}
          </h2>
          <button class="exit-button-close" aria-label="Close">
            ${h.close}
          </button>
        </div>
        <div class="exit-button-content">
          ${t}
        </div>
        ${this.getFooter()}
      </div>
    `,this.attachEventListeners()}getTitle(){switch(this.currentState){case"connecting":return"Getting things ready...";case"permission":return"Let's connect";case"interview":return"We're listening";case"offers":return"We have something for you";case"completing":return"Processing...";case"done":return this.outcome==="retained"?"Great news!":this.outcome==="churned"?"Thank you":"Almost done...";case"error":return"Let's try again";default:return""}}getStateContent(){switch(this.currentState){case"connecting":return this.renderConnecting();case"permission":return this.renderPermission();case"interview":return this.renderInterview();case"offers":return this.renderOffers();case"completing":return this.renderConnecting();case"done":return this.renderDone();case"error":return this.renderError();default:return""}}renderConnecting(){return`
      <div class="exit-button-connecting">
        <div class="exit-button-spinner"></div>
        <p class="exit-button-connecting-text">${this.statusText}</p>
      </div>
    `}renderPermission(){return`
      <div class="exit-button-permission">
        <h3 class="exit-button-permission-title">How would you like to connect?</h3>
        <p class="exit-button-permission-desc">
          Your feedback truly matters to us. Choose your preferred way to share.
        </p>
        <div class="exit-button-mode-options">
          <button class="exit-button-mode-card exit-button-mode-card-voice" data-action="grant-permission">
            <div class="exit-button-mode-card-icon exit-button-mode-card-icon-voice">
              ${h.microphone}
            </div>
            <div class="exit-button-mode-card-content">
              <span class="exit-button-mode-card-title">Voice Chat</span>
              <span class="exit-button-mode-card-desc">Speak with us for 2 mins</span>
            </div>
            <span class="exit-button-mode-card-badge">1 month free</span>
          </button>
          <button class="exit-button-mode-card exit-button-mode-card-chat" data-action="use-text">
            <div class="exit-button-mode-card-icon exit-button-mode-card-icon-chat">
              ${h.chat}
            </div>
            <div class="exit-button-mode-card-content">
              <span class="exit-button-mode-card-title">Text Chat</span>
              <span class="exit-button-mode-card-desc">Type your feedback instead</span>
            </div>
            <span class="exit-button-mode-card-badge">2 weeks free</span>
          </button>
        </div>
        <a class="exit-button-skip-link" href="#" data-action="proceed-cancel">Skip and cancel my subscription</a>
      </div>
    `}renderInterview(){let t=this.transcript.map(i=>`
        <div class="exit-button-transcript-entry ${i.role}">
          <div class="exit-button-transcript-role ${i.role}">${i.role==="assistant"?"AI":"You"}</div>
          <div class="exit-button-transcript-content">${this.escapeHtml(i.content)}</div>
        </div>
      `).join(""),e=this.useFallback?`
        <div class="exit-button-text-input">
          <input
            type="text"
            class="exit-button-input"
            placeholder="Type your response..."
            data-input="text"
          />
          <button class="exit-button-btn exit-button-btn-primary" data-action="send-text">
            ${h.send}
          </button>
        </div>
      `:"";return`
      <div class="exit-button-interview">
        <div class="exit-button-visualizer ${this.voiceState.isSpeaking||this.voiceState.isListening?"":"idle"}">
          <div class="exit-button-visualizer-bar"></div>
          <div class="exit-button-visualizer-bar"></div>
          <div class="exit-button-visualizer-bar"></div>
          <div class="exit-button-visualizer-bar"></div>
          <div class="exit-button-visualizer-bar"></div>
        </div>
        <div class="exit-button-transcript">
          ${t||'<p style="color: var(--exit-button-text-secondary); text-align: center; font-size: 14px;">Ready when you are...</p>'}
        </div>
        ${e}
      </div>
    `}renderOffers(){return`
      <div class="exit-button-offers">
        <p class="exit-button-offers-title">Based on what you shared, we've put together something for you:</p>
        ${this.offers.map((e,i)=>`
        <div
          class="exit-button-offer-card ${this.selectedOfferIndex===i?"selected":""}"
          tabindex="0"
          role="button"
          data-action="select-offer"
          data-index="${i}"
        >
          <span class="exit-button-offer-type">${e.type}</span>
          <h4 class="exit-button-offer-headline">${this.escapeHtml(e.headline)}</h4>
          <p class="exit-button-offer-description">${this.escapeHtml(e.description)}</p>
          <span class="exit-button-offer-value">${this.escapeHtml(e.value)}</span>
        </div>
      `).join("")}
      </div>
    `}renderDone(){return this.outcome==="retained"?`
        <div class="exit-button-done">
          <div class="exit-button-done-icon">
            ${h.check}
          </div>
          <h3 class="exit-button-done-title">We're glad you're staying!</h3>
          <p class="exit-button-done-desc">
            Thank you for giving us another chance. We're committed to making your experience even better.
          </p>
        </div>
      `:this.outcome==="churned"?`
        <div class="exit-button-done">
          <div class="exit-button-done-icon">
            ${h.check}
          </div>
          <h3 class="exit-button-done-title">We understand</h3>
          <p class="exit-button-done-desc">
            Your feedback will help us do better. Thank you for taking the time to share.
          </p>
        </div>
      `:`
      <div class="exit-button-done">
        <div class="exit-button-connecting-spinner"></div>
        <h3 class="exit-button-done-title">Wrapping up...</h3>
        <p class="exit-button-done-desc">
          Just a moment while we process your feedback.
        </p>
      </div>
    `}renderError(){return`
      <div class="exit-button-error">
        <div class="exit-button-error-icon">
          ${h.error}
        </div>
        <h3 class="exit-button-error-title">Connection interrupted</h3>
        <p class="exit-button-error-desc">
          No worries \u2014 these things happen. Let's give it another try.
        </p>
        <button class="exit-button-btn exit-button-btn-primary" data-action="retry">
          Try Again
        </button>
      </div>
    `}getFooter(){switch(this.currentState){case"offers":return`
          <div class="exit-button-footer">
            <button class="exit-button-btn exit-button-btn-danger" data-action="proceed-cancel">
              Cancel Anyway
            </button>
            <button
              class="exit-button-btn exit-button-btn-primary"
              data-action="accept-offer"
              ${this.selectedOfferIndex===null?"disabled":""}
            >
              Accept Offer
            </button>
          </div>
        `;case"done":return this.outcome?this.outcome==="retained"?`
            <div class="exit-button-footer">
              <button class="exit-button-btn exit-button-btn-secondary" data-action="proceed-cancel-done">
                Proceed with Cancellation
              </button>
              <button class="exit-button-btn exit-button-btn-primary" data-action="return-home">
                Go Back
              </button>
            </div>
          `:`
          <div class="exit-button-footer">
            <button class="exit-button-btn exit-button-btn-secondary" data-action="return-home">
              Go Back
            </button>
            <button class="exit-button-btn exit-button-btn-danger" data-action="proceed-cancel-done">
              Proceed with Cancellation
            </button>
          </div>
        `:"";case"error":return`
          <div class="exit-button-footer">
            <button class="exit-button-btn exit-button-btn-secondary" data-action="close">
              Close
            </button>
            <button class="exit-button-btn exit-button-btn-danger" data-action="proceed-cancel">
              Cancel Subscription
            </button>
          </div>
        `;default:return""}}attachEventListeners(){if(!this.container)return;this.container.querySelector(".exit-button-close")?.addEventListener("click",()=>this.close()),this.container.querySelectorAll("[data-action]").forEach(i=>{i.addEventListener("click",o=>{let r=o.currentTarget.dataset.action;this.handleAction(r)}),i.hasAttribute("data-index")&&i.addEventListener("keydown",o=>{if(o.key==="Enter"||o.key===" "){o.preventDefault();let r=o.currentTarget.dataset.action;this.handleAction(r)}})});let e=this.container.querySelector('[data-input="text"]');e&&e.addEventListener("keydown",i=>{i.key==="Enter"&&e.value.trim()&&(this.options.onTextSubmit?.(e.value.trim()),e.value="")})}handleAction(t){switch(t){case"grant-permission":this.options.onRequestPermission?.();break;case"use-text":this.useFallback=!0,this.options.onRequestPermission?.();break;case"send-text":let e=this.container?.querySelector('[data-input="text"]');e?.value.trim()&&(this.options.onTextSubmit?.(e.value.trim()),e.value="");break;case"select-offer":let i=parseInt((event?.target).closest("[data-index]")?.getAttribute("data-index")||"-1");i>=0&&(this.selectedOfferIndex=i,this.render());break;case"accept-offer":this.selectedOfferIndex!==null&&this.options.onOfferSelect?.(this.selectedOfferIndex);break;case"proceed-cancel":this.options.onProceedCancel?.();break;case"retry":this.options.onRetry?.();break;case"return-home":this.options.onReturnHome?.();break;case"proceed-cancel-done":this.options.onProceedCancelFromDone?.();break;case"close":this.close();break}}escapeHtml(t){let e=document.createElement("div");return e.textContent=t,e.innerHTML}destroy(){document.removeEventListener("keydown",this.handleKeyDown),this.container?.remove(),this.container=null,document.body.style.overflow=""}};var V="21m00Tcm4TlvDq8ikWAM",z="https://api.elevenlabs.io/v1",p=class{constructor(t){this.ws=null;this.recognition=null;this.audioContext=null;this.analyser=null;this.stream=null;this.audioQueue=[];this.isPlaying=!1;this.state={isConnected:!1,isSpeaking:!1,isListening:!1,volume:0};this.options=t,this.elevenLabsApiKey=t.elevenLabsApiKey||"",this.voiceId=t.voiceId||V}async requestPermission(){try{return this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0}}),!0}catch(t){return t.name==="NotAllowedError"?this.emitError("Microphone access denied","MICROPHONE_DENIED"):this.emitError("Microphone unavailable","MICROPHONE_UNAVAILABLE"),!1}}static async isMicrophoneAvailable(){try{return(await navigator.mediaDevices.enumerateDevices()).some(e=>e.kind==="audioinput")}catch{return!1}}static isSpeechRecognitionSupported(){return"SpeechRecognition"in window||"webkitSpeechRecognition"in window}async connect(){!this.stream&&!await this.requestPermission()||(this.setupAudioContext(),this.setupSpeechRecognition(),this.options.url&&!this.options.mockMode?await this.connectWebSocket():this.updateState({isConnected:!0}))}async connectWebSocket(){return new Promise((t,e)=>{this.ws=new WebSocket(this.options.url),this.ws.onopen=()=>{this.updateState({isConnected:!0}),t()},this.ws.onclose=()=>{this.updateState({isConnected:!1})},this.ws.onerror=()=>{this.emitError("Voice connection failed","VOICE_CONNECTION_ERROR"),e(new Error("Voice connection failed"))},this.ws.onmessage=i=>{this.handleServerMessage(i.data)}})}setupAudioContext(){if(!this.stream)return;this.audioContext=new AudioContext;let t=this.audioContext.createMediaStreamSource(this.stream);this.analyser=this.audioContext.createAnalyser(),this.analyser.fftSize=256,t.connect(this.analyser),this.monitorVolume()}setupSpeechRecognition(){let t=window.SpeechRecognition||window.webkitSpeechRecognition;if(!t){console.warn("Speech recognition not supported");return}this.recognition=new t,this.recognition.continuous=!0,this.recognition.interimResults=!0,this.recognition.lang="en-US",this.recognition.onresult=e=>{let i=e.results[e.results.length-1];if(i&&i.isFinal){let o=i[0]?.transcript.trim();o&&this.handleUserSpeech(o)}},this.recognition.onerror=e=>{console.error("Speech recognition error:",e.error),e.error==="not-allowed"&&this.emitError("Microphone access denied","MICROPHONE_DENIED")},this.recognition.onend=()=>{if(this.state.isConnected&&!this.isPlaying)try{this.recognition?.start()}catch{}}}startListening(){if(this.recognition&&this.state.isConnected)try{this.recognition.start(),this.updateState({isListening:!0})}catch{}}stopListening(){this.recognition&&(this.recognition.stop(),this.updateState({isListening:!1}))}handleUserSpeech(t){this.options.onTranscript?.({role:"user",content:t,timestamp:new Date().toISOString()}),this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify({type:"user_speech",transcript:t}))}handleServerMessage(t){try{let e=JSON.parse(t);switch(e.type){case"ai_response":this.speakText(e.text),this.options.onTranscript?.({role:"assistant",content:e.text,timestamp:new Date().toISOString()});break;case"interview_complete":this.options.onInterviewComplete?.();break;case"offers":this.options.onOffers?.(e.offers);break;case"error":this.emitError(e.error.message,e.error.code);break}}catch(e){console.error("Failed to parse server message:",e)}}async speakText(t){this.stopListening(),this.updateState({isSpeaking:!0});try{if(!this.elevenLabsApiKey){await this.speakWithBrowserTTS(t);return}let e=await fetch(`${z}/text-to-speech/${this.voiceId}/stream`,{method:"POST",headers:{"Content-Type":"application/json","xi-api-key":this.elevenLabsApiKey},body:JSON.stringify({text:t,model_id:"eleven_monolingual_v1",voice_settings:{stability:.5,similarity_boost:.75}})});if(!e.ok)throw new Error("ElevenLabs API error");let i=await e.blob();await this.playAudioBlob(i)}catch(e){console.error("ElevenLabs TTS error, falling back to browser TTS:",e),await this.speakWithBrowserTTS(t)}finally{this.updateState({isSpeaking:!1}),this.startListening()}}speakWithBrowserTTS(t){return new Promise(e=>{let i=new SpeechSynthesisUtterance(t);i.rate=1,i.pitch=1,i.volume=1;let r=speechSynthesis.getVoices().find(a=>a.name.includes("Samantha")||a.name.includes("Google")||a.lang.startsWith("en"));r&&(i.voice=r),i.onend=()=>e(),i.onerror=()=>e(),speechSynthesis.speak(i)})}async playAudioBlob(t){return new Promise((e,i)=>{let o=new Audio(URL.createObjectURL(t));o.onended=()=>{URL.revokeObjectURL(o.src),e()},o.onerror=()=>{URL.revokeObjectURL(o.src),i(new Error("Audio playback failed"))},o.play()})}disconnect(){this.stopListening(),this.stream&&(this.stream.getTracks().forEach(t=>t.stop()),this.stream=null),this.audioContext&&(this.audioContext.close(),this.audioContext=null),this.ws&&(this.ws.close(),this.ws=null),speechSynthesis.cancel(),this.updateState({isConnected:!1,isSpeaking:!1,isListening:!1,volume:0})}sendText(t){this.handleUserSpeech(t)}getState(){return{...this.state}}monitorVolume(){if(!this.analyser)return;let t=new Uint8Array(this.analyser.frequencyBinCount),e=()=>{if(!this.analyser||!this.state.isConnected)return;this.analyser.getByteFrequencyData(t);let i=t.reduce((r,a)=>r+a)/t.length,o=Math.min(i/128,1);o!==this.state.volume&&this.updateState({volume:o}),requestAnimationFrame(e)};e()}updateState(t){this.state={...this.state,...t},this.options.onStateChange?.(this.state)}emitError(t,e){let i={name:"ExitButtonError",message:t,code:e};this.state.error=i,this.options.onError?.(i)}};var b=null;async function $(){if(b)return!0;if(window.Conversation)return b=window.Conversation,!0;try{return b=(await import("@11labs/client")).Conversation,console.log("[ElevenLabs] Loaded SDK via import"),!0}catch{console.log("[ElevenLabs] SDK not bundled, using direct WebSocket")}return!1}var x=class{constructor(t){this.conversation=null;this.state={isConnected:!1,isSpeaking:!1,isListening:!1,volume:0};this.offers=[];this.pendingAgentText="";this.textOnly=!1;this.receivedAudio=!1;this.interviewCompleted=!1;this.conversationStarted=!1;this.ws=null;this.audioStream=null;this.micContext=null;this.processor=null;this.audioQueue=[];this.isProcessingAudio=!1;this.playbackContext=null;this.currentAudioSource=null;this.options=t}async connect(t=!1){console.log("[ElevenLabs] Starting connection to agent:",this.options.agentId);try{if(!await $()||!b||t){!t&&!this.playbackContext&&(this.playbackContext=new AudioContext({sampleRate:16e3}),console.log("[ElevenLabs] Playback AudioContext created:",this.playbackContext.state)),this.textOnly=t,console.log("[ElevenLabs] Using direct WebSocket",t?"(text-only)":""),await this.connectDirectWebSocket(t);return}let i;if(this.options.posthogContext)i=this.options.posthogContext,console.log("[ElevenLabs] Using PostHog context for agent");else{let s=[];this.options.userId&&s.push(`User ID: ${this.options.userId}`),this.options.planName&&s.push(`Current Plan: ${this.options.planName}`),this.options.mrr&&s.push(`Monthly Value: $${this.options.mrr}`),this.options.accountAge&&s.push(`Account Age: ${this.options.accountAge}`),s.length>0&&(i=`Customer context:
${s.join(`
`)}

Proceed with the exit interview.`)}let o={agentId:this.options.agentId,connectionType:"webrtc",onConnect:()=>{console.log("[ElevenLabs] Connected via WebRTC"),this.conversationStarted=!0,this.updateState({isConnected:!0})},onDisconnect:()=>{console.log("[ElevenLabs] Disconnected"),this.updateState({isConnected:!1,isSpeaking:!1,isListening:!1}),this.interviewCompleted||(this.conversationStarted?(console.log("[ElevenLabs] Conversation ended \u2014 showing done state"),this.interviewCompleted=!0,this.options.onInterviewComplete?.({retained:!1})):(console.log("[ElevenLabs] Disconnected before conversation started \u2014 treating as error"),this.interviewCompleted=!0,this.emitError("Connection lost before conversation started","CONNECTION_CLOSED_EARLY")))},onMessage:s=>{if(console.log("[ElevenLabs] Message:",s),s.source!=="user"&&(this.conversationStarted=!0),s.message&&s.isFinal!==!1){let c={role:s.source==="user"?"user":"assistant",content:s.message,timestamp:new Date().toISOString()};this.options.onTranscript?.(c)}},onModeChange:s=>{console.log("[ElevenLabs] Mode change:",s),this.updateState({isSpeaking:s.mode==="speaking",isListening:s.mode==="listening"})},onError:s=>{console.error("[ElevenLabs] Error:",s),this.emitError(s.message||"ElevenLabs error","ELEVENLABS_ERROR")}};this.options.conversationToken&&(o.conversationToken=this.options.conversationToken);let r={...this.options.dynamicVariables};!this.options.dynamicVariables&&i&&(r.session_insights=i),Object.keys(r).length>0&&(o.dynamicVariables=r),console.log("[ElevenLabs] Starting WebRTC session with config:",JSON.stringify(o,null,2)),this.conversation=await b.startSession(o),console.log("[ElevenLabs] WebRTC session started successfully");let a=this.conversation?.getId?.();a&&(console.log("[ElevenLabs] conversation_id (from SDK):",a),this.options.onConversationId?.(a))}catch(e){console.error("[ElevenLabs] Connection error:",e);let i=e;throw this.emitError(i.message||"Connection failed","CONNECTION_ERROR"),e}}async connectDirectWebSocket(t=!1){let e=`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.options.agentId}`;return console.log("[ElevenLabs] Connecting via WebSocket fallback:",e),new Promise((i,o)=>{let r=new WebSocket(e);r.onopen=()=>{console.log("[ElevenLabs] WebSocket connected"),this.updateState({isConnected:!0,isListening:!0});let a=this.options.dynamicVariables||{};!this.options.dynamicVariables&&this.options.posthogContext&&(a.session_insights=this.options.posthogContext);let s={type:"conversation_initiation_client_data",dynamic_variables:a,custom_llm_extra_body:a};t&&(s.conversation_config_override={conversation:{textOnly:!0}}),console.log("[ElevenLabs] Sending init config, textOnly:",t,"vars:",Object.keys(a)),r.send(JSON.stringify(s)),t||this.startMicrophone(r),i()},r.onmessage=a=>{try{let s=JSON.parse(a.data);console.log("[ElevenLabs] WS message:",s),this.handleWebSocketMessage(s)}catch{a.data instanceof Blob&&this.playAudio(a.data)}},r.onerror=a=>{console.error("[ElevenLabs] WebSocket error:",a),this.interviewCompleted=!0,this.emitError("WebSocket connection failed","WEBSOCKET_ERROR"),o(a)},r.onclose=a=>{console.log("[ElevenLabs] WebSocket closed:",a.code,a.reason),this.updateState({isConnected:!1,isSpeaking:!1,isListening:!1}),this.interviewCompleted||(this.conversationStarted?(console.log("[ElevenLabs] WebSocket closed after conversation \u2014 auto-completing"),this.interviewCompleted=!0,this.options.onInterviewComplete?.({retained:!1})):(console.log("[ElevenLabs] WebSocket closed before conversation started \u2014 treating as error"),this.interviewCompleted=!0,this.emitError("Connection closed before conversation started","CONNECTION_CLOSED_EARLY")))},this.ws=r})}handleWebSocketMessage(t){switch(t.type){case"conversation_initiation_metadata":{this.conversationStarted=!0,console.log("[ElevenLabs] Conversation initialized:",t);let e=t.conversation_initiation_metadata_event?.conversation_id;e&&(console.log("[ElevenLabs] conversation_id:",e),this.options.onConversationId?.(e));break}case"audio":t.audio_event?.audio_base_64&&(this.conversationStarted=!0,this.receivedAudio=!0,console.log("[ElevenLabs] Audio chunk received, length:",t.audio_event.audio_base_64.length),this.updateState({isSpeaking:!0}),this.playBase64Audio(t.audio_event.audio_base_64));break;case"agent_response":{this.conversationStarted=!0;let e=this.pendingAgentText||t.agent_response_event?.agent_response||"";if(this.pendingAgentText="",e){let i={role:"assistant",content:e,timestamp:new Date().toISOString()};this.options.onTranscript?.(i)}break}case"agent_chat_response_part":t.text_response_part?.type==="delta"&&t.text_response_part?.text&&(this.pendingAgentText+=t.text_response_part.text);break;case"user_transcript":if(t.user_transcription_event?.user_transcript){let e={role:"user",content:t.user_transcription_event.user_transcript,timestamp:new Date().toISOString()};this.options.onTranscript?.(e)}break;case"interruption":console.log("[ElevenLabs] Interruption detected \u2014 stopping playback"),this.stopPlayback(),this.updateState({isSpeaking:!1,isListening:!0});break;case"ping":console.log("[ElevenLabs] Received ping, sending pong"),this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify({type:"pong",event_id:t.ping_event?.event_id}));break;case"agent_tool_response":console.log("[ElevenLabs] Agent tool response:",JSON.stringify(t.agent_tool_response));break;default:console.log("[ElevenLabs] Unhandled message type:",t.type,t);break}}async startMicrophone(t){try{let e=await navigator.mediaDevices.getUserMedia({audio:{sampleRate:16e3,channelCount:1,echoCancellation:!0,noiseSuppression:!0}}),i=new AudioContext({sampleRate:16e3}),o=i.createMediaStreamSource(e),r=i.createScriptProcessor(4096,1,1);o.connect(r),r.connect(i.destination);let a=0;r.onaudioprocess=s=>{if(t.readyState===WebSocket.OPEN){let c=s.inputBuffer.getChannelData(0),d=this.float32ToPCM16(c),C=this.arrayBufferToBase64(d.buffer);t.send(JSON.stringify({user_audio_chunk:C})),a++,a%50===1&&console.log("[ElevenLabs] Sending audio chunk #",a)}},this.audioStream=e,this.micContext=i,this.processor=r}catch(e){console.error("[ElevenLabs] Microphone error:",e),this.emitError("Microphone access denied","MICROPHONE_DENIED")}}float32ToPCM16(t){let e=new Int16Array(t.length);for(let i=0;i<t.length;i++){let o=Math.max(-1,Math.min(1,t[i]));e[i]=o<0?o*32768:o*32767}return e}arrayBufferToBase64(t){let e=new Uint8Array(t),i="";for(let o=0;o<e.byteLength;o++)i+=String.fromCharCode(e[o]);return btoa(i)}stopPlayback(){if(this.audioQueue=[],this.currentAudioSource){try{this.currentAudioSource.stop()}catch{}this.currentAudioSource=null}this.isProcessingAudio=!1}async playBase64Audio(t){this.audioQueue.push(t),this.isProcessingAudio||this.processAudioQueue()}async processAudioQueue(){if(!(this.isProcessingAudio||this.audioQueue.length===0)){for(this.isProcessingAudio=!0,this.playbackContext||(this.playbackContext=new AudioContext({sampleRate:16e3})),this.playbackContext.state==="suspended"&&(console.log("[ElevenLabs] Resuming suspended AudioContext"),await this.playbackContext.resume());this.audioQueue.length>0;){let t=this.audioQueue.shift();try{await this.playPCMAudio(t)}catch(e){console.error("[ElevenLabs] Audio playback error:",e)}}this.isProcessingAudio=!1,this.updateState({isSpeaking:!1,isListening:!0})}}async playPCMAudio(t){return new Promise(e=>{if(!this.playbackContext){e();return}let i=atob(t),o=new Uint8Array(i.length);for(let d=0;d<i.length;d++)o[d]=i.charCodeAt(d);let r=new Int16Array(o.buffer),a=new Float32Array(r.length);for(let d=0;d<r.length;d++)a[d]=r[d]/32768;let s=this.playbackContext.createBuffer(1,a.length,16e3);s.getChannelData(0).set(a);let c=this.playbackContext.createBufferSource();c.buffer=s,c.connect(this.playbackContext.destination),this.currentAudioSource=c,c.onended=()=>{this.currentAudioSource===c&&(this.currentAudioSource=null),e()},c.start()})}playAudio(t){let e=new Audio(URL.createObjectURL(t));e.onended=()=>{URL.revokeObjectURL(e.src),this.updateState({isSpeaking:!1,isListening:!0})},e.play().catch(console.error)}sendText(t){this.conversation?.sendMessage?this.conversation.sendMessage({message:t}):this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify({type:"user_message",text:t}));let e={role:"user",content:t,timestamp:new Date().toISOString()};this.options.onTranscript?.(e)}async disconnect(){this.interviewCompleted=!0,this.audioStream&&(this.audioStream.getTracks().forEach(t=>t.stop()),this.audioStream=null),this.micContext&&(await this.micContext.close(),this.micContext=null),this.processor=null,this.playbackContext&&(await this.playbackContext.close(),this.playbackContext=null),this.audioQueue=[],this.isProcessingAudio=!1,this.ws&&(this.ws.close(),this.ws=null),this.conversation?.endSession&&await this.conversation.endSession(),this.conversation=null,this.updateState({isConnected:!1,isSpeaking:!1,isListening:!1,volume:0})}getState(){return{...this.state}}updateState(t){this.state={...this.state,...t},this.options.onStateChange?.(this.state)}emitError(t,e){let i={name:"ExitButtonError",message:t,code:e};this.state.error=i,this.options.onError?.(i)}};var W=[{type:"discount",headline:"Stay with us at 30% off",description:"We'll apply a 30% discount for the next 3 months while we address your concerns.",value:"30% off for 3 months",confidence:.85},{type:"pause",headline:"Take a break instead",description:"Pause your subscription for up to 3 months. Resume anytime.",value:"Pause up to 3 months",confidence:.72},{type:"concierge",headline:"Personal support call",description:"Schedule a 1:1 call with our success team to resolve any issues.",value:"30-min call with Customer Success",confidence:.65}];function y(){let n=window;try{if(n.posthog&&typeof n.posthog.get_distinct_id=="function"){let i=n.posthog.get_distinct_id();if(i&&typeof i=="string")return i}if(n.analytics&&typeof n.analytics.user=="function"){let i=n.analytics.user(),o=i?.id?.()||i?.anonymousId?.();if(o&&typeof o=="string")return o}if(n.mixpanel&&typeof n.mixpanel.get_distinct_id=="function"){let i=n.mixpanel.get_distinct_id();if(i&&typeof i=="string")return i}if(n.amplitude){let i=typeof n.amplitude.getInstance=="function"?n.amplitude.getInstance():n.amplitude,o=i?.getUserId?.()||i?.getDeviceId?.();if(o&&typeof o=="string")return o}if(n.Intercom&&n.intercomSettings){let i=n.intercomSettings.user_id||n.intercomSettings.email;if(i&&typeof i=="string")return i}if(n.$crisp&&typeof n.$crisp.get=="function"){let i=n.$crisp.get("user:email");if(i&&typeof i=="string")return i}let t=document.querySelector('meta[name="user-id"]');if(t?.content)return t.content;let e=document.body?.dataset?.userId;if(e)return e}catch{}return null}var m=class{constructor(t){this.modal=null;this.voice=null;this.elevenLabsAgent=null;this.sessionId=null;this.currentState="closed";this.offers=[];this.transcript=[];this.attachedElement=null;this.boundClickHandler=null;this.boundHoverHandler=null;this.prefetchPromise=null;this.prefetchDone=!1;this.starting=!1;this.pollController=null;this.voiceAgentId=null;this.voiceConversationToken=null;this.chatAgentIdResolved=null;this.chatConversationToken=null;this.themeOverrides={};if(this.config=t,this.mockMode=t.mockMode||t.apiKey.startsWith("eb_test_")||t.apiKey==="mock",t.interventionAgentId&&(t.elevenLabsAgentId=t.interventionAgentId),this.useElevenLabsAgent=!!(t.elevenLabsAgentId||t.elevenLabsConversationToken||t.backendUrl),t.backendUrl||(t.backendUrl="https://api.tranzmitai.com"),this.apiClient=k({apiKey:t.apiKey,baseUrl:t.backendUrl}),!t.userId){let e=y();e&&(this.config.userId=e,console.log("[ExitButton] Auto-detected userId:",e))}if(!t.posthogDistinctId){let e=y();e&&(this.config.posthogDistinctId=e)}t.attach&&this.attachToElement(t.attach),t.theme&&this.applyTheme(t.theme),t.prefetchUrl&&this.autoPrefetchIfPageMatches(t.prefetchUrl)}autoPrefetchIfPageMatches(t){try{let e=window.location.pathname;(e===t||e.startsWith(t+"/"))&&(console.log("[ExitButton] Page matches prefetchUrl, auto-prefetching"),this.prefetch())}catch{}}async start(){if(this.currentState!=="closed"||this.starting)return;this.starting=!0,v(),this.createModal(),this.modal?.open();let t=this.modal?.getContainer();if(t&&this.applyThemeToContainer(t),this.setState("connecting"),this.mockMode){await this.startMockFlow();return}if(this.useElevenLabsAgent){await this.startElevenLabsAgentFlow();return}try{let e=await this.apiClient.initiate({userId:this.config.userId,planName:this.config.planName,mrr:this.config.mrr,accountAge:this.config.accountAge,metadata:this.config.metadata,sessionAnalysis:this.config.sessionAnalysis});this.sessionId=e.sessionId,await p.isMicrophoneAvailable()?this.setState("permission"):(this.setupVoiceHandler(e.sessionId),this.modal?.enableFallback(),this.setState("interview"),await this.connectVoice())}catch(e){this.handleError(e)}}prefetch(){if(this.prefetchDone||this.prefetchPromise)return;this.prefetchDone=!0;let t=this.config.posthogDistinctId||this.config.userId;t&&(this.prefetchPromise=this.apiClient.prefetch({userId:t,planName:this.config.planName,mrr:this.config.mrr,accountAge:this.config.accountAge,sessionAnalysis:this.config.sessionAnalysis}).catch(()=>{}))}async startMockFlow(){if(this.sessionId="mock_session_"+Date.now(),await new Promise(i=>setTimeout(i,800)),this.useElevenLabsAgent){await this.startElevenLabsAgentFlow();return}this.voice=new p({mockMode:!0,elevenLabsApiKey:this.config.elevenLabsApiKey,voiceId:this.config.elevenLabsVoiceId,onStateChange:i=>{this.modal?.updateVoiceState(i)},onTranscript:i=>{this.transcript.push(i),this.modal?.addTranscriptEntry(i),i.role==="user"&&this.generateMockAIResponse(i.content)},onOffers:i=>{this.offers=i,this.config.onOffer?.(i),this.setState("offers"),this.modal?.updateOffers(i)},onError:i=>{this.handleError(i)}});let t=await p.isMicrophoneAvailable(),e=p.isSpeechRecognitionSupported();t&&e?this.setState("permission"):(this.modal?.enableFallback(),this.setState("interview"),await this.startMockInterview())}async startElevenLabsAgentFlow(){let t=this.config.elevenLabsAgentId,e=this.config.elevenLabsConversationToken;if(this.config.backendUrl)try{this.modal?.setStatusText("Analyzing your usage history..."),this.config.userId||(this.config.userId=y()??void 0);let i=this.config.posthogDistinctId||this.config.userId||"anonymous_"+Date.now(),o=await this.apiClient.initiate({userId:i,planName:this.config.planName,sessionAnalysis:this.config.sessionAnalysis,mrr:this.config.mrr,accountAge:this.config.accountAge});console.log("[ExitButton] Session initiated:",o.sessionId),o.agentId&&!this.config.interventionAgentId&&(t=o.agentId),o.conversationToken&&(e=o.conversationToken),o.context&&(this.posthogContext=o.context),o.dynamicVariables&&(this.dynamicVariablesResolved=o.dynamicVariables),this.chatAgentIdResolved=this.config.chatAgentId||o.chatAgentId||null,this.chatConversationToken=o.chatConversationToken||null,this.sessionId=o.sessionId}catch(i){console.warn("[ExitButton] Failed to initiate session, proceeding without analytics:",i)}if(this.voiceAgentId=t,this.voiceConversationToken=e||null,console.log("[ExitButton] Voice agent:",this.voiceAgentId,"| Chat agent:",this.chatAgentIdResolved),!this.voiceAgentId&&!this.chatAgentIdResolved){console.error("[ExitButton] No agent credentials available \u2014 cannot start interview"),this.handleError(new u("Unable to connect. Please try again later.","NO_AGENT_CREDENTIALS"));return}this.setState("permission")}createAgentForMode(t){let e=t?this.chatAgentIdResolved||this.voiceAgentId:this.voiceAgentId,i=t?this.chatConversationToken||this.voiceConversationToken:this.voiceConversationToken;console.log("[ExitButton] Creating agent for",t?"text":"voice","mode, agentId:",e,"token:",i?"yes":"none"),this.elevenLabsAgent=new x({agentId:e,conversationToken:i||void 0,userId:this.config.userId,planName:this.config.planName,mrr:this.config.mrr,accountAge:this.config.accountAge,posthogContext:this.posthogContext,dynamicVariables:this.dynamicVariablesResolved,onStateChange:o=>{this.modal?.updateVoiceState(o)},onTranscript:o=>{this.transcript.push(o),this.modal?.addTranscriptEntry(o)},onOffers:o=>{this.offers=o,this.config.onOffer?.(o),this.setState("offers"),this.modal?.updateOffers(o)},onConversationId:o=>{console.log("[ExitButton] ElevenLabs conversation_id:",o),this.sessionId&&this.config.backendUrl&&fetch(`${this.config.backendUrl}/api/exit-session/${this.sessionId}/conversation`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify({elevenLabsConversationId:o})}).catch(r=>{console.warn("[ExitButton] Could not link conversation_id to session:",r.message)})},onInterviewComplete:()=>{this.setState("done"),this.pollForOutcome()},onError:o=>{this.handleError(o)}})}async pollForOutcome(){if(!this.config.backendUrl||!this.sessionId){this.modal?.setOutcome("churned");return}this.pollController=new AbortController;let t=5e3,e=2e3,i=Date.now()+t;for(;;){if(this.pollController?.signal.aborted||this.currentState!=="done"||!this.modal)return;try{let r=await fetch(`${this.config.backendUrl}/api/exit-session/${this.sessionId}`,{signal:this.pollController.signal,headers:{Authorization:`Bearer ${this.config.apiKey}`}});if(this.pollController?.signal.aborted)return;if(r.ok){let a=await r.json();if(this.pollController?.signal.aborted)return;let s=a.outcome;if(console.log(`[ExitButton] Poll \u2014 outcome: ${s??"pending"}`),s==="retained"||s==="churned"){console.log("[ExitButton] Webhook outcome received:",s);let c=this.buildSessionData(s,{acceptedOffer:a.offers?.[0],churnRiskScore:s==="retained"?35:72});this.config.onComplete?.(c),s==="retained"?this.handleReturnHome():this.modal?.setOutcome("churned"),this.pollController=null;return}}else console.warn(`[ExitButton] Poll HTTP ${r.status}`)}catch(r){if(this.pollController?.signal.aborted)return;console.warn("[ExitButton] Poll attempt failed:",r)}let o=i-Date.now();if(o<=0)break;if(await new Promise(r=>setTimeout(r,Math.min(e,o))),this.pollController?.signal.aborted)return}console.warn("[ExitButton] Outcome not received within 5s \u2014 defaulting to churned UI"),this.currentState==="done"&&this.modal&&this.modal.setOutcome("churned"),this.pollController=null}async startMockInterview(){let t="I'm sorry to hear you're considering cancellation. Could you share what's prompting this decision?",e={role:"assistant",content:t,timestamp:new Date().toISOString()};this.transcript.push(e),this.modal?.addTranscriptEntry(e),this.voice&&(await this.voice.speakText(t),this.voice.startListening())}async generateMockAIResponse(t){let e,i=t.toLowerCase();i.includes("expensive")||i.includes("price")||i.includes("cost")||i.includes("money")?e="I understand pricing is a concern. We really value you as a customer. Let me see what options we can offer to make this work for your budget.":i.includes("feature")||i.includes("missing")||i.includes("need")?e="Thank you for that feedback about features. Your input helps us improve. I'd like to show you some options that might address your needs.":i.includes("bug")||i.includes("issue")||i.includes("problem")||i.includes("broken")?e="I'm really sorry you've experienced issues. That's not the experience we want for you. Let me offer some ways to make this right.":i.includes("competitor")||i.includes("alternative")||i.includes("switch")?e="I appreciate you being honest with me. Before you go, let me show you some exclusive options that might change your mind.":e="Thank you for sharing that with me. I really appreciate your honesty. Let me show you some options we can offer to help.";let o={role:"assistant",content:e,timestamp:new Date().toISOString()};this.transcript.push(o),this.modal?.addTranscriptEntry(o),this.voice&&await this.voice.speakText(e),setTimeout(()=>{this.offers=W,this.config.onOffer?.(this.offers),this.setState("offers"),this.modal?.updateOffers(this.offers)},1e3)}handleMockTextSubmit(t){let e={role:"user",content:t,timestamp:new Date().toISOString()};this.transcript.push(e),this.modal?.addTranscriptEntry(e),this.generateMockAIResponse(t)}close(){this.modal?.close(),this.cleanup()}destroy(){this.close(),this.detachFromElement(),E()}getState(){return this.currentState}createModal(){this.modal=new f({onClose:()=>this.cleanup(),onOfferSelect:t=>this.acceptOffer(t),onProceedCancel:()=>this.proceedWithCancellation(),onTextSubmit:t=>{this.elevenLabsAgent?this.elevenLabsAgent.sendText(t):this.mockMode?this.handleMockTextSubmit(t):this.voice?.sendText(t)},onRequestPermission:()=>this.requestPermissionAndConnect(),onRetry:()=>this.start(),onReturnHome:()=>this.handleReturnHome(),onProceedCancelFromDone:()=>this.handleProceedCancelFromDone()})}async requestPermissionAndConnect(){if(this.useElevenLabsAgent){let e=this.modal?.isFallbackEnabled()??!1;this.createAgentForMode(e);try{this.setState("interview"),e&&this.modal?.enableFallback(),await this.elevenLabsAgent.connect(e)}catch{this.modal?.enableFallback()}return}this.voice||this.setupVoiceHandler(this.sessionId),await this.voice.requestPermission()?(this.setState("interview"),this.mockMode?(await this.voice.connect(),await this.startMockInterview()):await this.connectVoice()):(this.modal?.enableFallback(),this.setState("interview"),this.mockMode?await this.startMockInterview():await this.connectVoice())}setupVoiceHandler(t){let e=`wss://api.tranzmitai.com/cancel/voice?sessionId=${t}`;this.voice=new p({url:e,onStateChange:i=>{this.modal?.updateVoiceState(i)},onTranscript:i=>{this.transcript.push(i),this.modal?.addTranscriptEntry(i)},onInterviewComplete:()=>{this.completeSession()},onOffers:i=>{this.offers=i,this.config.onOffer?.(i),this.setState("offers"),this.modal?.updateOffers(i)},onError:i=>{this.handleError(i)}})}async connectVoice(){try{await this.voice?.connect()}catch(t){this.handleError(t)}}async acceptOffer(t){if(this.mockMode){this.setState("completing"),await new Promise(i=>setTimeout(i,800));let e=this.buildSessionData("retained",{acceptedOffer:this.offers[t],churnRiskScore:45});this.config.onComplete?.(e),this.setState("done");return}await this.completeWithOutcome("retained",{acceptedOffer:this.offers[t]})}async proceedWithCancellation(){if(this.mockMode){this.setState("completing"),await new Promise(e=>setTimeout(e,800));let t=this.buildSessionData("churned",{churnRiskScore:72});this.config.onComplete?.(t),this.redirectChurned();return}await this.completeWithOutcome("churned"),this.redirectChurned()}redirectChurned(){this.close(),this.config.onChurned?this.config.onChurned():this.config.churnRedirectUrl&&(window.location.href=this.config.churnRedirectUrl)}async completeSession(){this.offers.length>0?(this.setState("offers"),this.modal?.updateOffers(this.offers)):await this.completeWithOutcome("churned")}buildSessionData(t,e){return{id:this.sessionId,userId:this.config.userId,status:t,voiceTranscript:this.transcript,offers:this.offers,acceptedOffer:e?.acceptedOffer,churnRiskScore:e?.churnRiskScore??0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}async completeWithOutcome(t,e){this.setState("completing");try{await this.apiClient.complete(this.sessionId,{userId:this.config.userId,outcome:t,acceptedOffer:e?.acceptedOffer,transcript:this.transcript});let i=this.buildSessionData(t,{acceptedOffer:e?.acceptedOffer});this.config.onComplete?.(i),this.setState("done")}catch(i){this.handleError(i)}}setState(t){this.currentState=t,this.modal?.setState(t),this.config.onStateChange?.(t)}handleError(t){console.error("ExitButton error:",t),this.config.onError?.(t instanceof Error?new u(t.message,"UNKNOWN_ERROR"):t),this.setState("error")}cleanup(){this.pollController?.abort(),this.pollController=null,this.voice?.disconnect(),this.voice=null,this.elevenLabsAgent?.disconnect(),this.elevenLabsAgent=null,this.modal?.destroy(),this.modal=null,this.sessionId=null,this.currentState="closed",this.starting=!1,this.offers=[],this.transcript=[],this.prefetchPromise=null,this.prefetchDone=!1,this.voiceAgentId=null,this.voiceConversationToken=null,this.chatAgentIdResolved=null,this.chatConversationToken=null,this.posthogContext=void 0,this.dynamicVariablesResolved=void 0}handleReturnHome(){if(this.close(),this.config.onRetained)this.config.onRetained();else{let t=this.config.redirectUrl||"/";window.location.href=t}}handleProceedCancelFromDone(){this.redirectChurned()}attachToElement(t){let e=document.querySelector(t);if(!e){console.warn(`ExitButton: Element "${t}" not found`);return}this.attachedElement=e,this.boundClickHandler=i=>{i.preventDefault(),i.stopPropagation(),this.start()},this.boundHoverHandler=()=>this.prefetch(),e.addEventListener("click",this.boundClickHandler),e.addEventListener("mouseenter",this.boundHoverHandler,{once:!0})}detachFromElement(){this.attachedElement&&(this.boundClickHandler&&this.attachedElement.removeEventListener("click",this.boundClickHandler),this.boundHoverHandler&&this.attachedElement.removeEventListener("mouseenter",this.boundHoverHandler),this.attachedElement=null,this.boundClickHandler=null,this.boundHoverHandler=null)}applyTheme(t){if(!t)return;let e={};t.primaryColor&&(e["--exit-button-accent"]=t.primaryColor,e["--exit-button-accent-rgb"]=this.hexToRgb(t.primaryColor)),t.primaryHoverColor&&(e["--exit-button-accent-hover"]=t.primaryHoverColor),t.backgroundColor&&(e["--exit-button-overlay-bg"]=t.backgroundColor),t.surfaceColor&&(e["--exit-button-glass"]=t.surfaceColor),t.textColor&&(e["--exit-button-text"]=t.textColor),t.textSecondaryColor&&(e["--exit-button-text-secondary"]=t.textSecondaryColor),t.errorColor&&(e["--exit-button-error"]=t.errorColor,e["--exit-button-error-rgb"]=this.hexToRgb(t.errorColor)),t.successColor&&(e["--exit-button-success"]=t.successColor,e["--exit-button-success-rgb"]=this.hexToRgb(t.successColor)),t.borderRadius&&(e["--exit-button-radius"]=t.borderRadius),t.fontFamily&&(e["--exit-button-font"]=t.fontFamily),this.themeOverrides=e}applyThemeToContainer(t){for(let[e,i]of Object.entries(this.themeOverrides))t.style.setProperty(e,i)}hexToRgb(t){let e=t.replace("#",""),i=parseInt(e.length===3?e.split("").map(o=>o+o).join(""):e,16);return`${i>>16&255}, ${i>>8&255}, ${i&255}`}},l=null;function w(n){return l&&l.destroy(),l=new m(n),l}function F(){if(!l)throw new Error("ExitButton not initialized. Call init() first.");return l.start()}function j(){l?.close()}function K(){l?.destroy(),l=null}function q(){if(!l){console.warn("ExitButton: Not initialized. Call init() first.");return}l.prefetch()}function J(){return l?.getState()||"closed"}function Y(){let n=document.currentScript;if(!n)return;let t=n.dataset.apiKey;if(!t){console.warn("ExitButton: data-api-key is required");return}let e;if(n.dataset.theme)try{e=JSON.parse(n.dataset.theme)}catch{console.warn("ExitButton: data-theme must be valid JSON")}let i={apiKey:t,userId:n.dataset.userId,planName:n.dataset.planName,mrr:n.dataset.mrr?parseFloat(n.dataset.mrr):void 0,accountAge:n.dataset.accountAge,attach:n.dataset.attach,backendUrl:n.dataset.backendUrl,interventionAgentId:n.dataset.interventionAgentId||n.dataset.elevenLabsAgentId,chatAgentId:n.dataset.chatAgentId,posthogDistinctId:n.dataset.posthogDistinctId,sessionAnalysis:n.dataset.sessionAnalysis!==void 0?n.dataset.sessionAnalysis!=="false":void 0,redirectUrl:n.dataset.redirectUrl,churnRedirectUrl:n.dataset.churnRedirectUrl,prefetchUrl:n.dataset.prefetchUrl,theme:e};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>w(i)):w(i)}Y();return _(Q);})();
//# sourceMappingURL=index.global.js.map