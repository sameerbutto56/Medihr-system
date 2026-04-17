// Helper to convert base64url to Uint8Array
export function bufferFromBase64(base64) {
  const binaryString = window.atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to convert ArrayBuffer to base64url
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Generate a random challenge buffer
export function generateChallenge() {
  return window.crypto.getRandomValues(new Uint8Array(32));
}
