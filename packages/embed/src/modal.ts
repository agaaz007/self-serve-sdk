/**
 * Modal Manager for Exit Button
 * Creates and manages the modal DOM elements
 */

import type {
  ModalState,
  TranscriptEntry,
  Offer,
  VoiceState,
} from '@tranzmit/exit-button-core';
import { injectStyles } from './styles';
import { icons } from './icons';

export interface ModalOptions {
  /** Callback when modal is closed */
  onClose?: () => void;
  /** Callback when offer is selected */
  onOfferSelect?: (index: number) => void;
  /** Callback to proceed with cancellation */
  onProceedCancel?: () => void;
  /** Callback when text is submitted (fallback mode) */
  onTextSubmit?: (text: string) => void;
  /** Callback to request mic permission */
  onRequestPermission?: () => void;
  /** Callback to retry on error */
  onRetry?: () => void;
  /** Callback when user clicks "Go Back" on done screen (retained) */
  onReturnHome?: () => void;
  /** Callback when user clicks "Proceed with Cancellation" on done screen (churned) */
  onProceedCancelFromDone?: () => void;
}

export class ModalManager {
  private container: HTMLDivElement | null = null;
  private options: ModalOptions;
  private currentState: ModalState = 'closed';
  private transcript: TranscriptEntry[] = [];
  private offers: Offer[] = [];
  private selectedOfferIndex: number | null = null;
  private voiceState: VoiceState = {
    isConnected: false,
    isSpeaking: false,
    isListening: false,
    volume: 0,
  };
  private useFallback = false;
  private statusText: string = 'Setting up your session...';
  private outcome: 'retained' | 'churned' | null = null;

  constructor(options: ModalOptions = {}) {
    this.options = options;
    injectStyles();
  }

  /**
   * Open the modal
   */
  open(): void {
    if (this.container) return;
    this.createModal();
    this.setState('connecting');

    // Trap focus
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const closeBtn = this.container?.querySelector('.exit-button-close') as HTMLElement;
      closeBtn?.focus();
    }, 100);
  }

  /**
   * Close the modal
   */
  close(): void {
    if (!this.container) return;

    this.container.classList.add('closing');
    setTimeout(() => {
      this.container?.remove();
      this.container = null;
      document.body.style.overflow = '';
      this.options.onClose?.();
    }, 200);
  }

  /**
   * Get the overlay container element (for applying theme overrides)
   */
  getContainer(): HTMLElement | null {
    return this.container;
  }

  /**
   * Set the modal state
   */
  setState(state: ModalState): void {
    this.currentState = state;
    this.render();
  }

  /**
   * Set custom status text (for connecting state)
   */
  setOutcome(outcome: 'retained' | 'churned'): void {
    this.outcome = outcome;
    if (this.currentState === 'done') {
      this.render();
    }
  }

  setStatusText(text: string): void {
    this.statusText = text;
    if (this.currentState === 'connecting') {
      const textEl = this.container?.querySelector('.exit-button-connecting-text');
      if (textEl) {
        textEl.textContent = text;
      }
    }
  }

  /**
   * Update transcript
   */
  updateTranscript(entries: TranscriptEntry[]): void {
    this.transcript = entries;
    if (this.currentState === 'interview') {
      this.render();
    }
  }

  /**
   * Add transcript entry
   */
  addTranscriptEntry(entry: TranscriptEntry): void {
    this.transcript.push(entry);
    if (this.currentState === 'interview') {
      this.render();
      // Auto-scroll transcript
      const transcriptEl = this.container?.querySelector('.exit-button-transcript');
      if (transcriptEl) {
        transcriptEl.scrollTop = transcriptEl.scrollHeight;
      }
    }
  }

  /**
   * Update offers
   */
  updateOffers(offers: Offer[]): void {
    this.offers = offers;
    if (this.currentState === 'offers') {
      this.render();
    }
  }

  /**
   * Update voice state
   */
  updateVoiceState(state: VoiceState): void {
    this.voiceState = state;
    if (this.currentState === 'interview') {
      const visualizer = this.container?.querySelector('.exit-button-visualizer');
      if (visualizer) {
        visualizer.classList.toggle('idle', !state.isSpeaking && !state.isListening);
      }
    }
  }

  /**
   * Check if text fallback mode is enabled
   */
  isFallbackEnabled(): boolean {
    return this.useFallback;
  }

  /**
   * Enable text fallback mode
   */
  enableFallback(): void {
    this.useFallback = true;
    if (this.currentState === 'interview') {
      this.render();
    }
  }

  private createModal(): void {
    this.container = document.createElement('div');
    this.container.className = 'exit-button-overlay';
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', 'true');
    this.container.setAttribute('aria-labelledby', 'exit-button-title');

    // Close on backdrop click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', this.handleKeyDown);

    document.body.appendChild(this.container);
    this.render();
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.container) {
      this.close();
    }
  };

  private render(): void {
    if (!this.container) return;

    const content = this.getStateContent();
    this.container.innerHTML = `
      <div class="exit-button-modal">
        <div class="exit-button-header">
          <h2 id="exit-button-title" class="exit-button-title">
            ${this.getTitle()}
          </h2>
          <button class="exit-button-close" aria-label="Close">
            ${icons.close}
          </button>
        </div>
        <div class="exit-button-content">
          ${content}
        </div>
        ${this.getFooter()}
      </div>
    `;

    // Attach event listeners
    this.attachEventListeners();
  }

  private getTitle(): string {
    switch (this.currentState) {
      case 'connecting':
        return 'Getting things ready...';
      case 'permission':
        return 'Let\'s connect';
      case 'interview':
        return 'We\'re listening';
      case 'offers':
        return 'We have something for you';
      case 'completing':
        return 'Processing...';
      case 'done':
        if (this.outcome === 'retained') return 'Great news!';
        if (this.outcome === 'churned') return 'Thank you';
        return 'Almost done...';
      case 'error':
        return 'Let\'s try again';
      default:
        return '';
    }
  }

  private getStateContent(): string {
    switch (this.currentState) {
      case 'connecting':
        return this.renderConnecting();
      case 'permission':
        return this.renderPermission();
      case 'interview':
        return this.renderInterview();
      case 'offers':
        return this.renderOffers();
      case 'completing':
        return this.renderConnecting();
      case 'done':
        return this.renderDone();
      case 'error':
        return this.renderError();
      default:
        return '';
    }
  }

  private renderConnecting(): string {
    return `
      <div class="exit-button-connecting">
        <div class="exit-button-spinner"></div>
        <p class="exit-button-connecting-text">${this.statusText}</p>
      </div>
    `;
  }

  private renderPermission(): string {
    return `
      <div class="exit-button-permission">
        <h3 class="exit-button-permission-title">How would you like to connect?</h3>
        <p class="exit-button-permission-desc">
          Your feedback truly matters to us. Choose your preferred way to share.
        </p>
        <div class="exit-button-mode-options">
          <button class="exit-button-mode-card exit-button-mode-card-voice" data-action="grant-permission">
            <div class="exit-button-mode-card-icon exit-button-mode-card-icon-voice">
              ${icons.microphone}
            </div>
            <div class="exit-button-mode-card-content">
              <span class="exit-button-mode-card-title">Voice Chat</span>
              <span class="exit-button-mode-card-desc">Speak with us for 2 mins</span>
            </div>
            <span class="exit-button-mode-card-badge">1 month free</span>
          </button>
          <button class="exit-button-mode-card exit-button-mode-card-chat" data-action="use-text">
            <div class="exit-button-mode-card-icon exit-button-mode-card-icon-chat">
              ${icons.chat}
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
    `;
  }

  private renderInterview(): string {
    const transcriptHtml = this.transcript
      .map(
        (entry) => `
        <div class="exit-button-transcript-entry ${entry.role}">
          <div class="exit-button-transcript-role ${entry.role}">${entry.role === 'assistant' ? 'AI' : 'You'}</div>
          <div class="exit-button-transcript-content">${this.escapeHtml(entry.content)}</div>
        </div>
      `
      )
      .join('');

    const textInput = this.useFallback
      ? `
        <div class="exit-button-text-input">
          <input
            type="text"
            class="exit-button-input"
            placeholder="Type your response..."
            data-input="text"
          />
          <button class="exit-button-btn exit-button-btn-primary" data-action="send-text">
            ${icons.send}
          </button>
        </div>
      `
      : '';

    return `
      <div class="exit-button-interview">
        <div class="exit-button-visualizer ${this.voiceState.isSpeaking || this.voiceState.isListening ? '' : 'idle'}">
          <div class="exit-button-visualizer-bar"></div>
          <div class="exit-button-visualizer-bar"></div>
          <div class="exit-button-visualizer-bar"></div>
          <div class="exit-button-visualizer-bar"></div>
          <div class="exit-button-visualizer-bar"></div>
        </div>
        <div class="exit-button-transcript">
          ${transcriptHtml || '<p style="color: var(--exit-button-text-secondary); text-align: center; font-size: 14px;">Ready when you are...</p>'}
        </div>
        ${textInput}
      </div>
    `;
  }

  private renderOffers(): string {
    const offersHtml = this.offers
      .map(
        (offer, index) => `
        <div
          class="exit-button-offer-card ${this.selectedOfferIndex === index ? 'selected' : ''}"
          tabindex="0"
          role="button"
          data-action="select-offer"
          data-index="${index}"
        >
          <span class="exit-button-offer-type">${offer.type}</span>
          <h4 class="exit-button-offer-headline">${this.escapeHtml(offer.headline)}</h4>
          <p class="exit-button-offer-description">${this.escapeHtml(offer.description)}</p>
          <span class="exit-button-offer-value">${this.escapeHtml(offer.value)}</span>
        </div>
      `
      )
      .join('');

    return `
      <div class="exit-button-offers">
        <p class="exit-button-offers-title">Based on what you shared, we've put together something for you:</p>
        ${offersHtml}
      </div>
    `;
  }

  private renderDone(): string {
    if (this.outcome === 'retained') {
      return `
        <div class="exit-button-done">
          <div class="exit-button-done-icon">
            ${icons.check}
          </div>
          <h3 class="exit-button-done-title">We're glad you're staying!</h3>
          <p class="exit-button-done-desc">
            Thank you for giving us another chance. We're committed to making your experience even better.
          </p>
        </div>
      `;
    }
    if (this.outcome === 'churned') {
      return `
        <div class="exit-button-done">
          <div class="exit-button-done-icon">
            ${icons.check}
          </div>
          <h3 class="exit-button-done-title">We understand</h3>
          <p class="exit-button-done-desc">
            Your feedback will help us do better. Thank you for taking the time to share.
          </p>
        </div>
      `;
    }
    // Waiting for webhook analysis
    return `
      <div class="exit-button-done">
        <div class="exit-button-connecting-spinner"></div>
        <h3 class="exit-button-done-title">Wrapping up...</h3>
        <p class="exit-button-done-desc">
          Just a moment while we process your feedback.
        </p>
      </div>
    `;
  }

  private renderError(): string {
    return `
      <div class="exit-button-error">
        <div class="exit-button-error-icon">
          ${icons.error}
        </div>
        <h3 class="exit-button-error-title">Connection interrupted</h3>
        <p class="exit-button-error-desc">
          No worries — these things happen. Let's give it another try.
        </p>
        <button class="exit-button-btn exit-button-btn-primary" data-action="retry">
          Try Again
        </button>
      </div>
    `;
  }

  private getFooter(): string {
    switch (this.currentState) {
      case 'offers':
        return `
          <div class="exit-button-footer">
            <button class="exit-button-btn exit-button-btn-danger" data-action="proceed-cancel">
              Cancel Anyway
            </button>
            <button
              class="exit-button-btn exit-button-btn-primary"
              data-action="accept-offer"
              ${this.selectedOfferIndex === null ? 'disabled' : ''}
            >
              Accept Offer
            </button>
          </div>
        `;
      case 'done':
        if (!this.outcome) {
          // Still waiting for webhook — no buttons yet
          return '';
        }
        if (this.outcome === 'retained') {
          return `
            <div class="exit-button-footer">
              <button class="exit-button-btn exit-button-btn-secondary" data-action="proceed-cancel-done">
                Proceed with Cancellation
              </button>
              <button class="exit-button-btn exit-button-btn-primary" data-action="return-home">
                Go Back
              </button>
            </div>
          `;
        }
        return `
          <div class="exit-button-footer">
            <button class="exit-button-btn exit-button-btn-secondary" data-action="return-home">
              Go Back
            </button>
            <button class="exit-button-btn exit-button-btn-danger" data-action="proceed-cancel-done">
              Proceed with Cancellation
            </button>
          </div>
        `;
      case 'error':
        return `
          <div class="exit-button-footer">
            <button class="exit-button-btn exit-button-btn-secondary" data-action="close">
              Close
            </button>
            <button class="exit-button-btn exit-button-btn-danger" data-action="proceed-cancel">
              Cancel Subscription
            </button>
          </div>
        `;
      default:
        return '';
    }
  }

  private attachEventListeners(): void {
    if (!this.container) return;

    // Close button
    const closeBtn = this.container.querySelector('.exit-button-close');
    closeBtn?.addEventListener('click', () => this.close());

    // Action buttons
    this.container.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const action = (e.currentTarget as HTMLElement).dataset.action;
        this.handleAction(action!);
      });

      // Keyboard support for offer cards
      if (el.hasAttribute('data-index')) {
        el.addEventListener('keydown', (e) => {
          if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
            e.preventDefault();
            const action = (e.currentTarget as HTMLElement).dataset.action;
            this.handleAction(action!);
          }
        });
      }
    });

    // Text input
    const textInput = this.container.querySelector('[data-input="text"]') as HTMLInputElement;
    if (textInput) {
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && textInput.value.trim()) {
          this.options.onTextSubmit?.(textInput.value.trim());
          textInput.value = '';
        }
      });
    }
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'grant-permission':
        this.options.onRequestPermission?.();
        break;
      case 'use-text':
        this.useFallback = true;
        this.options.onRequestPermission?.();
        break;
      case 'send-text':
        const input = this.container?.querySelector('[data-input="text"]') as HTMLInputElement;
        if (input?.value.trim()) {
          this.options.onTextSubmit?.(input.value.trim());
          input.value = '';
        }
        break;
      case 'select-offer':
        const index = parseInt(
          (event?.target as HTMLElement).closest('[data-index]')?.getAttribute('data-index') || '-1'
        );
        if (index >= 0) {
          this.selectedOfferIndex = index;
          this.render();
        }
        break;
      case 'accept-offer':
        if (this.selectedOfferIndex !== null) {
          this.options.onOfferSelect?.(this.selectedOfferIndex);
        }
        break;
      case 'proceed-cancel':
        this.options.onProceedCancel?.();
        break;
      case 'retry':
        this.options.onRetry?.();
        break;
      case 'return-home':
        this.options.onReturnHome?.();
        break;
      case 'proceed-cancel-done':
        this.options.onProceedCancelFromDone?.();
        break;
      case 'close':
        this.close();
        break;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.container?.remove();
    this.container = null;
    document.body.style.overflow = '';
  }
}
