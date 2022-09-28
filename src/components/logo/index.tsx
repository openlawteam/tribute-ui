import React from 'react';

import Logo from './Logo';

/**
 * ModalLogo
 * This component is used for modal menu
 */
export function ModalLogo() {
  return (
    <div className="logo-container logo-container--center">
      <Logo size="small" />
    </div>
  );
}

/**
 * LeftLogo
 * This component is used for main pages
 */
export function LeftLogo() {
  return (
    <div className="logo-container logo-container--header">
      <Logo size="small" />
    </div>
  );
}

/**
 * CenterLogo
 * This component is used for splash page
 */
export function CenterLogo() {
  return (
    <div className="logo-container logo-container--center">
      <Logo size="large" />
    </div>
  );
}
