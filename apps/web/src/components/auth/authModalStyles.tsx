'use client';

import styled from 'styled-components';

/**
 * Shared visual shell for the auth modals (login / register / forgot-password).
 * Re-skinned to the Liquid Glass language: the `.container` is the translucent,
 * blurred glass material (top sheen + edge rim), and every colour resolves to a
 * design token (`--ink/--cloud/--sky/--line/--rose` …) so it themes with the rest
 * of the app, including `[data-theme="night"]`. The class names and markup are
 * unchanged — the three views import this one wrapper, so only the look differs.
 * Accessibility is preserved: visible focus, ≥44px close target, and invalid
 * fields keep BOTH a colour border and an inline text error (never colour alone).
 */
export const AuthFormWrapper = styled.div`
  .container {
    position: relative;
    max-width: 350px;
    margin: 20px;
    padding: 28px 32px;
    border-radius: 28px;
    color: var(--ink);
    background: color-mix(in srgb, var(--cloud) 44%, transparent);
    -webkit-backdrop-filter: blur(34px) saturate(210%) brightness(1.06);
    backdrop-filter: blur(34px) saturate(210%) brightness(1.06);
    border: 1.5px solid rgba(255, 255, 255, 0.55);
    box-shadow:
      var(--shadow),
      inset 0 1.5px 0 rgba(255, 255, 255, 0.85),
      inset 0 -14px 28px -18px rgba(20, 20, 60, 0.22);
  }
  [data-theme='night'] & .container {
    border-color: rgba(255, 255, 255, 0.28);
    box-shadow:
      var(--shadow),
      inset 0 1.5px 0 rgba(255, 255, 255, 0.22),
      inset 0 -14px 28px -18px rgba(0, 0, 0, 0.4);
  }
  /* Glass top-sheen + edge rim (decorative, never intercept pointer events). */
  .container::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    z-index: 4;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0) 36%);
    mix-blend-mode: screen;
    opacity: 0.7;
  }
  .container::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    z-index: 5;
    padding: 1.5px;
    background: linear-gradient(125deg, rgba(255, 255, 255, 0.85), transparent 28%, transparent 70%, rgba(255, 255, 255, 0.55));
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  .heading {
    position: relative;
    z-index: 6;
    text-align: center;
    font-family: var(--font-display), sans-serif;
    font-weight: 800;
    font-size: 26px;
    letter-spacing: -0.01em;
    color: var(--ink);
  }

  .form {
    position: relative;
    z-index: 6;
    margin-top: 20px;
  }

  .form .input {
    width: 100%;
    color: var(--ink);
    background: color-mix(in srgb, var(--cloud) 60%, transparent);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    border: 1px solid var(--line);
    padding: 15px 20px;
    border-radius: 16px;
    margin-top: 15px;
    box-shadow: var(--shadow-sm);
  }

  .form .input::-moz-placeholder {
    color: var(--ink-faint);
  }

  .form .input::placeholder {
    color: var(--ink-faint);
  }

  .form .input:focus {
    outline: none;
    border-color: var(--sky);
    box-shadow:
      var(--shadow-sm),
      0 0 0 3px color-mix(in srgb, var(--sky) 28%, transparent);
  }

  .form .forgot-password {
    display: block;
    margin-top: 10px;
    margin-left: 10px;
  }

  .form .forgot-password a,
  .form .forgot-password .switch-link {
    font-size: 11px;
    color: var(--sky-ink);
    text-decoration: none;
  }

  .form .login-button {
    display: block;
    width: 100%;
    font-weight: bold;
    background: linear-gradient(45deg, var(--sky) 0%, var(--sky-ink) 100%);
    color: #fff;
    padding-block: 15px;
    margin: 20px auto;
    border-radius: 16px;
    box-shadow: 0 18px 28px -16px color-mix(in srgb, var(--sky) 80%, transparent);
    border: none;
    transition: all 0.2s ease-in-out;
  }

  .form .login-button:hover {
    transform: translateY(-2px) scale(1.02);
  }

  .form .login-button:active {
    transform: scale(0.97);
  }

  .form .login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  /* ── Modal-only additions (no change to the original behaviour) ───────────── */

  /* Top-right close (×). 44px touch target (NFR-01); keyboard-focusable. */
  .modal-close {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 7;
    width: 44px;
    height: 44px;
    display: grid;
    place-content: center;
    border: none;
    background: transparent;
    color: var(--ink-soft);
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s ease-in-out;
  }

  .modal-close:hover {
    background: color-mix(in srgb, var(--ink) 10%, transparent);
    color: var(--ink);
  }

  .modal-close:focus-visible {
    outline: 2px solid var(--sky);
    outline-offset: 2px;
  }

  /* In-modal view switch ("Register" / "Back to login") — link look, button role. */
  .switch-line {
    position: relative;
    z-index: 6;
    display: block;
    text-align: center;
    margin-top: 15px;
    font-size: 11px;
    color: var(--ink-faint);
  }

  .switch-line .switch-link {
    font-size: 11px;
    color: var(--sky-ink);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
  }

  .switch-line .switch-link:focus-visible {
    outline: 2px solid var(--sky);
    outline-offset: 2px;
    border-radius: 2px;
  }

  /* Consent checkbox row (register). */
  .consent {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 15px;
    margin-left: 10px;
    font-size: 12px;
    color: var(--ink-soft);
    text-align: left;
  }

  .consent input {
    margin-top: 2px;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    accent-color: var(--sky);
  }

  /* Inline FormAlert spacing inside the card. */
  .alert {
    margin-top: 15px;
  }

  /* Invalid field outline + inline, text-based error (NFR-01: not colour alone). */
  .form .input.invalid {
    border-color: var(--rose);
    box-shadow:
      var(--shadow-sm),
      0 0 0 3px color-mix(in srgb, var(--rose) 26%, transparent);
  }

  .field-error {
    display: block;
    margin-top: 6px;
    margin-left: 10px;
    font-size: 11px;
    color: #c62828;
  }
  [data-theme='night'] & .field-error {
    color: #ff9aa6;
  }
`;
