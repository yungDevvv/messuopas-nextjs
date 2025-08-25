// Simple, reusable debounce utility
// Usage: const debouncedFn = debounce((value) => { ... }, 300)
// debouncedFn.cancel() to cancel pending execution; debouncedFn.flush() to run immediately.
export function debounce(fn, wait = 300) {
  // Ensure 'fn' is a function
  if (typeof fn !== 'function') throw new TypeError('Expected a function');

  let timerId = null;
  let lastArgs;
  let lastThis;

  const debounced = function (...args) {
    lastArgs = args;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastThis = this;
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      fn.apply(lastThis, lastArgs);
    }, wait);
  };

  // Cancel any pending execution
  debounced.cancel = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  // Immediately invoke the pending call if any
  debounced.flush = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
      fn.apply(lastThis, lastArgs);
    }
  };

  return debounced;
}
