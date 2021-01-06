/**
 * dontCloseWindowWarning
 *
 * Warns user not to close the window.
 *
 * @returns {() => void} unsubscribe function to stop listening, and the callback from firing.
 */
export function dontCloseWindowWarning(): () => void {
  // @see: https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload#Example
  const callback = (event: BeforeUnloadEvent) => {
    // Cancel the event
    event.preventDefault();
    // Chrome requires returnValue to be set
    event.returnValue = '';
  };

  window.addEventListener('beforeunload', callback);

  return function unsubscribe() {
    window.removeEventListener('beforeunload', callback);
  };
}
