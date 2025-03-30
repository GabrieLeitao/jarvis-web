class VoiceControl {
  constructor() {
    this.recognition = null;

    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = "pt-BR"; // Ensure this matches the language of your commands
      this.recognition.interimResults = true;
    }
  }

  isSupported() {
    return !!this.recognition;
  }

  startListening(onCommand, onNoSpeech) {
    if (!this.recognition) return;

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      if (event.results[0].isFinal) {
        onCommand(transcript);
      }
    };

    this.recognition.onspeechend = () => {
      this.stopListening();
    };

    this.recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        onNoSpeech();
      }
    };

    this.recognition.start();
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

export default new VoiceControl();
