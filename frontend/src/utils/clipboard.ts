/**
 * Robust cross-browser clipboard copy utility
 * Works in both Secure Contexts (HTTPS/localhost) and Non-Secure Contexts (HTTP on LAN IP like 192.168.x.x)
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  // Try modern navigator.clipboard first (only works in secure contexts)
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback for HTTP LAN environments (document.execCommand)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy text using fallback:', err);
    return false;
  }
}
