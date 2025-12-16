export function buildSelectedMarkerHtml(label: string) {
  const safeLabel = String(label)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return `<div style="transform: translate(-50%, -100%);">
      <div class="lt-selected-marker"></div>
      <div class="lt-selected-label">${safeLabel}</div>
    </div>`;
}
