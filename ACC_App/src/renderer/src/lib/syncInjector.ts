export const buildInjectScript = (message: string): string => {
  const msg = JSON.stringify(message)

  return `(function () {
  const message = ${msg};
  const inputSelectors = [
    'textarea[data-id]',
    'div[contenteditable="true"]',
    'textarea'
  ];

  let el = null;
  for (const sel of inputSelectors) {
    const found = document.querySelector(sel);
    if (found) { el = found; break; }
  }
  if (!el) return;

  try { el.focus(); } catch (e) {}

  const tag = (el.tagName || '').toLowerCase();
  const isTextarea = tag === 'textarea';
  const isContentEditable = !isTextarea && el.getAttribute && el.getAttribute('contenteditable') === 'true';

  if (isTextarea) {
    try {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeInputValueSetter.call(el, message);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (e) {
      el.value = message;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } else if (isContentEditable) {
    el.textContent = message;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // fallback: try value/textContent
    if ('value' in el) {
      el.value = message;
    } else {
      el.textContent = message;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  setTimeout(() => {
    const btnSelectors = [
      'button[data-testid="send-button"]',
      'button[aria-label="Send message"]',
      '[data-testid="send-button"]',
      'button[aria-label="Submit"]'
    ];
    let btn = null;
    for (const sel of btnSelectors) {
      const found = document.querySelector(sel);
      if (found) { btn = found; break; }
    }

    if (btn && btn.click) {
      btn.click();
      return;
    }

    try {
      const evt = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      el.dispatchEvent(evt);
    } catch (e) {}
  }, 200);
})();`
}
