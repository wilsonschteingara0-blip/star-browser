export function focusOmnibox() {
  window.dispatchEvent(new CustomEvent('star:focus-omnibox'))
}

export function blurOmnibox() {
  window.dispatchEvent(new CustomEvent('star:blur-omnibox'))
}
