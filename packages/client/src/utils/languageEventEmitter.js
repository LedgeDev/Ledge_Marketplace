class LanguageEventEmitter {
  constructor() {
    this.listeners = [];
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  emit(value) {
    this.listeners.forEach(listener => listener(value));
  }
}

export default new LanguageEventEmitter();
