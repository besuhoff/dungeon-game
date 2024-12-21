export class AudioManager {
    private static instance: AudioManager;
    private audioContext: AudioContext;
    private soundBuffers: Map<string, AudioBuffer>;
    private loadingPromises: Map<string, Promise<void>>;

    private constructor() {
        this.audioContext = new AudioContext();
        this.soundBuffers = new Map();
        this.loadingPromises = new Map();
    }

    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    async loadSound(soundPath: string): Promise<void> {
        if (this.soundBuffers.has(soundPath) || this.loadingPromises.has(soundPath)) {
            return;
        }

        const loadingPromise = fetch(soundPath)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.soundBuffers.set(soundPath, audioBuffer);
            });

        this.loadingPromises.set(soundPath, loadingPromise);
        await loadingPromise;
    }

    playSound(soundPath: string, volume: number = 1, loop: boolean = false): void {
        const buffer = this.soundBuffers.get(soundPath);
        if (!buffer) {
            console.warn(`Sound not loaded: ${soundPath}`);
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
    }

    stopSound(soundPath: string): void {
        // In Web Audio API, we can't stop a specific sound file
        // We would need to keep track of all playing sources
        // For simplicity, we'll just let sounds play out
    }

    setVolume(volume: number): void {
        // Implement if needed
    }
}
