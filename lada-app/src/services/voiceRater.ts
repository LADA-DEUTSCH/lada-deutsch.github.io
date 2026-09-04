// Web Speech API interfaces for TypeScript
interface IWindowSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class VoiceRater {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentTranscript: string = '';
  private onTranscriptUpdate: ((text: string) => void) | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const win = window as unknown as IWindowSpeech;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.lang = 'de-DE';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;

        this.recognition.onresult = (event: any) => {
          let latest = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            latest += event.results[i][0].transcript;
          }
          this.currentTranscript = latest.trim().toLowerCase();
          if (this.onTranscriptUpdate) {
            this.onTranscriptUpdate(this.currentTranscript);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
        };

        this.recognition.onend = () => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch {
              // Ignore restart collision
            }
          }
        };
      } catch (e) {
        console.warn('Could not initialize SpeechRecognition:', e);
      }
    }
  }

  public isAvailable(): boolean {
    return this.recognition !== null;
  }

  public startListening(onUpdate?: (text: string) => void) {
    if (!this.recognition) return;
    this.onTranscriptUpdate = onUpdate || null;
    this.currentTranscript = '';
    this.isListening = true;
    try {
      this.recognition.start();
    } catch {
      // Already running
    }
  }

  public stopListening() {
    this.isListening = false;
    this.onTranscriptUpdate = null;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
  }

  public resetTranscript() {
    this.currentTranscript = '';
  }

  /**
   * Evaluates if the current transcript matches the target German word.
   * Uses German phonetic normalization + fuzzy substring & distance check.
   */
  public evaluateTargetWord(targetGerman: string): { isMatch: boolean; accuracyPercent: number; heard: string } {
    const heard = this.currentTranscript;
    if (!heard) {
      return { isMatch: false, accuracyPercent: 0, heard: '' };
    }

    const cleanTarget = this.normalizeGerman(targetGerman);
    const cleanHeard = this.normalizeGerman(heard);

    // Exact or direct substring inclusion
    if (cleanHeard.includes(cleanTarget) || cleanTarget.includes(cleanHeard)) {
      return { isMatch: true, accuracyPercent: 100, heard };
    }

    // Levenshtein phonetic distance against the closest word in heard transcript
    const heardTokens = cleanHeard.split(/\s+/);
    let maxSim = 0;
    for (const token of heardTokens) {
      const sim = this.calculateSimilarity(token, cleanTarget);
      if (sim > maxSim) maxSim = sim;
    }

    const accuracyPercent = Math.round(maxSim * 100);
    const isMatch = accuracyPercent >= 70; // 70% threshold allows for slight accent variations

    return { isMatch, accuracyPercent, heard };
  }

  private normalizeGerman(text: string): string {
    return text
      .toLowerCase()
      .replace(/\[.*?\]/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?!]/g, '')
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .trim();
  }

  private calculateSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    const dist = this.levenshtein(longer, shorter);
    return (longer.length - dist) / longer.length;
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}
