'use client';

import React from 'react';
import AuthPortal from '../AuthPortal';

export default function AuthModal({
  isOpen = false,
  initialTab = 'login',
  onClose,
  onLoginSuccess,
  onRegisterSuccess,
  onGoogleWarning,
  triggerLoading,
  showToast,
  onOpenSupport,
  supportUnread = false,
  frontendSettings = {}
}) {
  if (!isOpen) return null;

  return (
    <AuthPortal
      isModal={true}
      onClose={onClose}
      initialTab={initialTab}
      onLoginSuccess={onLoginSuccess}
      onRegisterSuccess={onRegisterSuccess}
      onGoogleWarning={onGoogleWarning}
      triggerLoading={triggerLoading}
      showToast={showToast}
      onOpenSupport={onOpenSupport}
      supportUnread={supportUnread}
      frontendSettings={frontendSettings}
    />
  );
}
