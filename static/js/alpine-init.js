// Initialize Alpine global object and loader store before Alpine.js is loaded
window.Alpine = window.Alpine || {};
window.Alpine.store = window.Alpine.store || function(name, value) {
  if (!window.alpineStores) window.alpineStores = {};
  if (value === undefined) return window.alpineStores[name];
  window.alpineStores[name] = value;
  return value;
};

// Initialize the loader store
Alpine.store('loader', {
  loading: false
});