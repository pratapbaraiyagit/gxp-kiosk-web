export function getSessionItem(key) {
  return sessionStorage.getItem(key);
}

export function removeSessionItem(key) {
  sessionStorage.removeItem(key);
}

export function setSessionItem(key, value) {
  sessionStorage.setItem(key, value);
}
