// Browsers block sound until the page has been clicked. A voice "Wake up" before any click would
// boot in silence, so ask for one click instead. Browsers without the activation API are trusted.
export function wakeDecision(hasBeenActive: boolean | undefined): 'ignite' | 'ask-click' {
  return hasBeenActive === false ? 'ask-click' : 'ignite';
}

export const pageActivated = () => (navigator as { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive;
