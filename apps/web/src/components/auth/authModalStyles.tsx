'use client';

import styled from 'styled-components';

/**
 * Shared visual shell for the auth modals (login / register / forgot-password).
 * The `.container / .heading / .input / .forgot-password / .login-button` rules are
 * the exact styles from the original standalone login (`Form.tsx`) — kept verbatim
 * so the design does not change. Only small, non-visual additions are made for the
 * modal context: a close (`×`) button and `<button>`-based view-switch links that
 * reuse the existing link colour/size. All three views import this one wrapper so
 * the design language stays identical (only fields and copy differ).
 */
export const AuthFormWrapper = styled.div`
  .container {
    position: relative;
    max-width: 350px;
    background: #f8f9fd;
    background: linear-gradient(0deg, rgb(255, 255, 255) 0%, rgb(244, 247, 251) 100%);
    border-radius: 40px;
    padding: 25px 35px;
    border: 5px solid rgb(255, 255, 255);
    box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 30px 30px -20px;
    margin: 20px;
  }

  .heading {
    text-align: center;
    font-weight: 900;
    font-size: 30px;
    color: rgb(16, 137, 211);
  }

  .form {
    margin-top: 20px;
  }

  .form .input {
    width: 100%;
    background: white;
    border: none;
    padding: 15px 20px;
    border-radius: 20px;
    margin-top: 15px;
    box-shadow: #cff0ff 0px 10px 10px -5px;
    border-inline: 2px solid transparent;
  }

  .form .input::-moz-placeholder {
    color: rgb(170, 170, 170);
  }

  .form .input::placeholder {
    color: rgb(170, 170, 170);
  }

  .form .input:focus {
    outline: none;
    border-inline: 2px solid #12b1d1;
  }

  .form .forgot-password {
    display: block;
    margin-top: 10px;
    margin-left: 10px;
  }

  .form .forgot-password a,
  .form .forgot-password .switch-link {
    font-size: 11px;
    color: #0099ff;
    text-decoration: none;
  }

  .form .login-button {
    display: block;
    width: 100%;
    font-weight: bold;
    background: linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%);
    color: white;
    padding-block: 15px;
    margin: 20px auto;
    border-radius: 20px;
    box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 20px 10px -15px;
    border: none;
    transition: all 0.2s ease-in-out;
  }

  .form .login-button:hover {
    transform: scale(1.03);
    box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 23px 10px -20px;
  }

  .form .login-button:active {
    transform: scale(0.95);
    box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 15px 10px -10px;
  }

  .form .login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  /* ── Modal-only additions (no change to the original design) ──────────── */

  /* Top-right close (×). 44px touch target (NFR-01); keyboard-focusable. */
  .modal-close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 44px;
    height: 44px;
    display: grid;
    place-content: center;
    border: none;
    background: transparent;
    color: rgb(16, 137, 211);
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s ease-in-out;
  }

  .modal-close:hover {
    background: #eaf6ff;
  }

  .modal-close:focus-visible {
    outline: 2px solid #12b1d1;
    outline-offset: 2px;
  }

  /* In-modal view switch ("Register" / "Back to login") — link look, button role. */
  .switch-line {
    display: block;
    text-align: center;
    margin-top: 15px;
    font-size: 11px;
    color: rgb(120, 120, 120);
  }

  .switch-line .switch-link {
    font-size: 11px;
    color: #0099ff;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
  }

  .switch-line .switch-link:focus-visible {
    outline: 2px solid #12b1d1;
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
    color: rgb(90, 90, 90);
    text-align: left;
  }

  .consent input {
    margin-top: 2px;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    accent-color: #1089d3;
  }

  /* Inline FormAlert spacing inside the card. */
  .alert {
    margin-top: 15px;
  }

  /* Invalid field outline + inline, text-based error (NFR-01: not colour alone). */
  .form .input.invalid {
    border-inline: 2px solid #e5484d;
  }

  .field-error {
    display: block;
    margin-top: 6px;
    margin-left: 10px;
    font-size: 11px;
    color: #c62828;
  }
`;
