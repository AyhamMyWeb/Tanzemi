/**
 * تنظيمي - Media Hub Module
 * Glassmorphic Dropzone for Audio/Video with Waveform Visualization
 */

import { dataManager } from './data-manager.js';
import { formatters } from './utils.js';

export class MediaHub {
    constructor() {
        this.currentMedia = null;
        this.audioElement = null;
        this.videoElement = null;
        this.waveformCanvas = null;
        this.waveformCtx = null;
        this.analyser = null;
        this.animationId = null;
        this.isLooping = false;
        
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadMediaFiles();
        this.populateYearSelect();
    }

    cacheElements() {
        this.elements = {
            dropzone: document.getElementById('media-dropzone'),
            fileInput: document.getElementById('media-file-input'),
            playerContainer: document.getElementById('media-player-container'),
            mediaInfo: document.getElementById('media-info'),
            mediaThumbnail: document.getElementById('media-thumbnail'),
            mediaTitle: document.getElementById('media-title'),
            waveformContainer: document.querySelector('.waveform-container'),
            waveformCanvas: document.getElementById('waveform-canvas'),
            btnPlay: document.getElementById('media-play'),
            btnPause: document.getElementById('media-pause'),
            btnStop: document.getElementById('media-stop'),
            btnLoop: document.getElementById('media-loop'),
            volumeSlider: document.getElementById('media-volume-slider'),
            progressContainer: document.getElementById('media-progress'),
            progressFill: document.getElementById('media-progress-fill'),
            currentTime: document.getElementById('media-current-time'),
            duration: document.getElementById('media-duration'),
            mediaList: document.getElementById('media-list')
        };
    }

    setupEventListeners() {
        this.elements.dropzone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.dropzone.classList.add('dragover');
        });

        this.elements.dropzone?.addEventListener('dragleave', () => {
            this.elements.dropzone.classList.remove('dragover');
        });

        this.elements.dropzone?.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.dropzone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        this.elements.dropzone?.addEventListener('click', () => {
            this.elements.fileInput?.click();
        });

        this.elements.fileInput?.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        this.elements.btnPlay?.addEventListener('click', () => this.play());
        this.elements.btnPause?.addEventListener('click', () => this.pause());
        this.elements.btnStop?.addEventListener('click', () => this.stop());
        this.elements.btnLoop?.addEventListener('click', () => this.toggleLoop());
        
        this.elements.volumeSlider?.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        this.elements.progressContainer?.addEventListener('click', (e) => {
            this.seek(e);
        });
    }

    handleFiles(files) {
        try {
            Array.from(files).forEach(file => {
                if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
                    this.processFile(file);
                }
            });
        } catch (error) {
            console.error('Error handling media files:', error);
        }
    }

    processFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const mediaData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                addedAt: new Date().toISOString()
            };
            const savedMedia = dataManager.addMediaFile(mediaData);
            this.renderMediaList();
            if (!this.currentMedia) this.loadMedia(savedMedia);
        };
        reader.readAsDataURL(file);
    }

    loadMedia(media) {
        this.currentMedia = media;
        if (this.elements.mediaTitle) this.elements.mediaTitle.textContent = media.name;
        
        if (this.elements.mediaThumbnail) {
            const icon = media.type.startsWith('video/') ? 'fa-video' : 'fa-music';
            this.elements.mediaThumbnail.innerHTML = `<i class="fas ${icon}" style="font-size: 2rem;"></i>`;
        }

        if (media.type.startsWith('video/')) {
            this.setupVideoPlayer(media);
        } else {
            this.setupAudioPlayer(media);
        }
        this.elements.playerContainer?.classList.remove('hidden');
    }

    setupAudioPlayer(media) {
        if (this.videoElement) { this.videoElement.remove(); this.videoElement = null; }

        if (!this.audioElement) {
            this.audioElement = new Audio();
            this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
            this.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());
            this.audioElement.addEventListener('ended', () => this.onMediaEnded());
            this.setupWaveform();
        }
        this.audioElement.src = media.data;
        this.audioElement.loop = this.isLooping;
    }

    setupVideoPlayer(media) {
        if (this.audioElement) { this.audioElement.pause(); this.audioElement.remove(); this.audioElement = null; }

        if (!this.videoElement) {
            this.videoElement = document.createElement('video');
            this.videoElement.style.cssText = 'width:100%;border-radius:var(--border-radius-md);margin-bottom:15px;';
            this.videoElement.addEventListener('timeupdate', () => this.updateProgress());
            this.videoElement.addEventListener('loadedmetadata', () => this.updateDuration());
            this.videoElement.addEventListener('ended', () => this.onMediaEnded());
            this.elements.mediaInfo?.parentElement.insertBefore(this.videoElement, this.elements.mediaInfo);
        }
        this.videoElement.src = media.data;
        this.videoElement.loop = this.isLooping;
    }

    setupWaveform() {
        if (!this.elements.waveformCanvas) return;
        this.waveformCanvas = this.elements.waveformCanvas;
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        const rect = this.elements.waveformContainer?.getBoundingClientRect();
        if (rect) { this.waveformCanvas.width = rect.width; this.waveformCanvas.height = rect.height; }

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(this.audioElement);
        this.analyser = audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);
        this.analyser.connect(audioContext.destination);
        this.drawWaveform();
    }

    drawWaveform() {
        if (!this.analyser || !this.waveformCtx || !this.audioElement || this.audioElement.paused) {
            this.animationId = requestAnimationFrame(() => this.drawWaveform());
            return;
        }
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;
        this.waveformCtx.clearRect(0, 0, width, height);
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height;
            const gradient = this.waveformCtx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 1)');
            this.waveformCtx.fillStyle = gradient;
            this.waveformCtx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
        this.animationId = requestAnimationFrame(() => this.drawWaveform());
    }

    play() {
        if (this.audioElement) this.audioElement.play();
        else if (this.videoElement) this.videoElement.play();
        this.elements.btnPlay?.classList.add('hidden');
        this.elements.btnPause?.classList.remove('hidden');
    }

    pause() {
        if (this.audioElement) this.audioElement.pause();
        else if (this.videoElement) this.videoElement.pause();
        this.elements.btnPlay?.classList.remove('hidden');
        this.elements.btnPause?.classList.add('hidden');
    }

    stop() {
        if (this.audioElement) { this.audioElement.pause(); this.audioElement.currentTime = 0; }
        else if (this.videoElement) { this.videoElement.pause(); this.videoElement.currentTime = 0; }
        this.elements.btnPlay?.classList.remove('hidden');
        this.elements.btnPause?.classList.add('hidden');
        this.updateProgress();
    }

    toggleLoop() {
        this.isLooping = !this.isLooping;
        if (this.audioElement) this.audioElement.loop = this.isLooping;
        if (this.videoElement) this.videoElement.loop = this.isLooping;
        if (this.elements.btnLoop) {
            this.elements.btnLoop.style.background = this.isLooping ? 'var(--accent-gold)' : '';
            this.elements.btnLoop.style.color = this.isLooping ? '#1f2937' : '';
        }
    }

    setVolume(value) {
        if (this.audioElement) this.audioElement.volume = value;
        if (this.videoElement) this.videoElement.volume = value;
    }

    seek(e) {
        const rect = this.elements.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        if (this.audioElement) this.audioElement.currentTime = pos * this.audioElement.duration;
        if (this.videoElement) this.videoElement.currentTime = pos * this.videoElement.duration;
    }

    updateProgress() {
        const media = this.audioElement || this.videoElement;
        if (!media || !media.duration) return;
        const progress = (media.currentTime / media.duration) * 100;
        if (this.elements.progressFill) this.elements.progressFill.style.width = `${progress}%`;
        if (this.elements.currentTime) this.elements.currentTime.textContent = formatters.formatTime(Math.floor(media.currentTime));
    }

    updateDuration() {
        const media = this.audioElement || this.videoElement;
        if (media && media.duration && this.elements.duration) {
            this.elements.duration.textContent = formatters.formatTime(Math.floor(media.duration));
        }
    }

    onMediaEnded() {
        this.elements.btnPlay?.classList.remove('hidden');
        this.elements.btnPause?.classList.add('hidden');
    }

    loadMediaFiles() {
        this.renderMediaList(dataManager.getMediaFiles());
    }

    renderMediaList(files = null) {
        const fileList = files || dataManager.getMediaFiles();
        if (!this.elements.mediaList) return;
        
        if (fileList.length === 0) {
            this.elements.mediaList.innerHTML = '<p style="text-align:center;opacity:0.7;padding:20px;">لا توجد ملفات ميديا</p>';
            return;
        }
        
        this.elements.mediaList = '<h3 class="cairo-font mb-20">📁 مكتبة الميديا</h3>' + fileList.map(m => 
            `<div class="media-item glass-card" style="padding:12px;margin-bottom:10px;cursor:pointer;" onclick="window.mediaHub.loadMediaById('${m.id}')"><div style="display:flex;align-items:center;gap:12px;"><i class="fas fa-${m.type.startsWith('video/')?'video':'music'}" style="font-size:1.5rem;color:var(--accent-gold);"></i><div style="flex:1;"><div style="font-weight:600;">${this.escapeHTML(m.name)}</div><div style="font-size:0.8rem;opacity:0.7;">${(m.size/1024/1024).toFixed(2)} MB</div></div><button class="btn-danger" onclick="event.stopPropagation();window.mediaHub.deleteMedia('${m.id}')"><i class="fas fa-trash"></i></button></div></div>`
        ).join('');
    }

    loadMediaById(id) {
        const m = dataManager.getMediaFiles().find(f => f.id === id);
        if (m) this.loadMedia(m);
    }

    deleteMedia(id) {
        if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
        dataManager.deleteMediaFile(id);
        if (this.currentMedia?.id === id) { this.stop(); this.currentMedia = null; this.elements.playerContainer?.classList.add('hidden'); }
        this.loadMediaFiles();
    }

    populateYearSelect() {
        const sel = document.getElementById('archive-year');
        if (!sel) return;
        const yr = new Date().getFullYear();
        sel.innerHTML = Array.from({length: 6}, (_, i) => `<option value="${yr-i}">${yr-i}</option>`).join('');
    }

    destroy() {
        this.stop();
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.audioElement) { this.audioElement.remove(); this.audioElement = null; }
        if (this.videoElement) { this.videoElement.remove(); this.videoElement = null; }
    }

    escapeHTML(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
}

export const mediaHub = new MediaHub();
