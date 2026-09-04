document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // AUDIO ASSETS & SYNTHESIS ENGINE
    // ==========================================
    const bgMusic = new Audio('assets/audio/background.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.4; // Default volume

    const supernovaSound = new Audio('assets/audio/supernova.mp3');
    supernovaSound.volume = 1.0;

    const doorSound = new Audio('assets/audio/door.mp3');
    doorSound.volume = 0.8;
    
    const nukeSound = new Audio('assets/audio/nuke.mp3');
    nukeSound.volume = 1.0;

    // Volume Control Logic
    const volSlider = document.getElementById('bgm-volume');
    volSlider.addEventListener('input', (e) => {
        bgMusic.volume = e.target.value;
    });

    let audioCtx;
    function initAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    let bgMusicStarted = false;
    function startBgMusic() {
        if (!bgMusicStarted) {
            bgMusic.play().catch(e => console.log("Audio autoplay blocked until interaction."));
            bgMusicStarted = true;
        }
    }

    function playTone(freq, type, duration, vol = 0.1) {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    const sfx = {
        click: () => playTone(1200, 'sine', 0.1, 0.05),
        success: () => {
            playTone(600, 'sine', 0.1, 0.1);
            setTimeout(() => playTone(900, 'sine', 0.2, 0.15), 100);
        },
        scan: () => playTone(100, 'sawtooth', 1.5, 0.05),
        
        // 2-Second Supernova Charging Sound
        charge: () => {
            initAudio();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(50, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 2.0);
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 1.8);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.0);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 2.0);
        },

        // Gritty, heavy industrial lab door sound
        door: () => {
            doorSound.currentTime = 0;
            doorSound.play().catch(() => {
                initAudio();
                const osc1 = audioCtx.createOscillator();
                const osc2 = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc1.type = 'square';
                osc1.frequency.setValueAtTime(60, audioCtx.currentTime);
                osc1.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 3);
                
                // Detuned sawtooth to create grinding metal friction
                osc2.type = 'sawtooth';
                osc2.frequency.setValueAtTime(63, audioCtx.currentTime); 
                osc2.frequency.exponentialRampToValueAtTime(12, audioCtx.currentTime + 3);

                gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 3);
                
                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc1.start(); osc2.start();
                osc1.stop(audioCtx.currentTime + 3); osc2.stop(audioCtx.currentTime + 3);
            });
        },
        
        nuke: () => {
            nukeSound.currentTime = 0;
            nukeSound.play().catch(() => playTone(80, 'sawtooth', 4, 1.0));
        },
        alarm: () => {
            initAudio();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.setValueAtTime(400, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        },
        leverPull: () => { playTone(100, 'square', 0.3, 0.5); }
    };

    document.addEventListener('click', (e) => {
        initAudio();
        if (e.target.closest('button, .hub-item, .fingerprint-scanner, .core-particle') && 
            !e.target.classList.contains('back-btn') && 
            !e.target.classList.contains('lever-handle')) {
            sfx.click();
        }
    });

    // ==========================================
    // GLOBAL NAVIGATION & SLIDE LOGIC
    // ==========================================
    let currentSlideId = 'slide-1';
    let authState = { card: false, bio: false };

    function navigateTo(targetSlideId, animClass = null) {
        const currentSlide = document.getElementById(currentSlideId);
        const targetSlide = document.getElementById(targetSlideId);
        if (!targetSlide) return;

        currentSlide.classList.remove('active');
        targetSlide.className = targetSlide.className.replace(/\bactive-\S+/g, '');
        targetSlide.classList.add('active');
        
        if (animClass) {
            void targetSlide.offsetWidth; 
            targetSlide.classList.add(animClass);
        }

        if (targetSlideId === 'slide-2') startBgMusic();

        // Reveal Volume Control on Equation Slides (Slide 3+)
        const volControl = document.getElementById('volume-control');
        if (targetSlideId.startsWith('slide-') && targetSlideId !== 'slide-1' && targetSlideId !== 'slide-2') {
            volControl.classList.remove('hidden');
        } else {
            volControl.classList.add('hidden');
        }

        currentSlideId = targetSlideId;
    }

    const topicAnimations = {
        'velocity': 'active-velocity', 'gravity': 'active-gravity',
        'force': 'active-force', 'emag': 'active-emag', 'laser': 'active-laser'
    };

    document.querySelectorAll('.hub-item').forEach(item => {
        item.addEventListener('click', () => {
            navigateTo(item.getAttribute('data-slide'), topicAnimations[item.getAttribute('data-topic')]);
        });
    });

    // ==========================================
    // TERMINATE EXPERIMENT -> CORE MELTDOWN
    // ==========================================
    let selfDestructTriggered = false;
    const reactorCore = document.getElementById('reactor-core');

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (selfDestructTriggered) return;
            selfDestructTriggered = true;
            
            // Hide volume control during sequence
            document.getElementById('volume-control').classList.add('hidden');
            
            bgMusic.pause();
            bgMusic.currentTime = 0;
            document.body.classList.add('shake-active');

            const alarmOverlay = document.createElement('div');
            alarmOverlay.className = 'alarm-overlay';
            const warningText = document.createElement('div');
            warningText.className = 'warning-text';
            warningText.innerHTML = "CRITICAL OVERLOAD<br>DESTRUCT IN 3";
            alarmOverlay.appendChild(warningText);
            document.body.appendChild(alarmOverlay);

            let count = 3;
            sfx.alarm();
            
            let countdownInterval = setInterval(() => {
                count--;
                if (count > 0) {
                    warningText.innerHTML = `CRITICAL OVERLOAD<br>DESTRUCT IN ${count}`;
                    sfx.alarm();
                } else {
                    clearInterval(countdownInterval);
                    warningText.innerHTML = "CONTAINMENT BREACH";
                    sfx.alarm();
                    
                    setTimeout(() => {
                        sfx.nuke();
                        
                        // Background reactor core melts down and consumes screen
                        reactorCore.classList.add('meltdown');
                        
                        setTimeout(() => {
                            document.body.classList.remove('shake-active');
                            
                            const blackout = document.createElement('div');
                            blackout.className = 'terminal-blackout';
                            blackout.innerText = "NO SIGNAL.";
                            document.body.appendChild(blackout);
                            
                            setTimeout(() => blackout.style.opacity = 1, 100);

                            setTimeout(() => {
                                const leverContainer = document.createElement('div');
                                leverContainer.className = 'emergency-lever-container';
                                leverContainer.innerHTML = `
                                    <div class="lever-base">
                                        <div class="lever-slot"><div class="lever-handle" id="emergency-lever"></div></div>
                                    </div>
                                    <div class="lever-label">SYSTEM REBOOT</div>
                                `;
                                document.body.appendChild(leverContainer);
                                
                                void leverContainer.offsetWidth;
                                leverContainer.classList.add('show');

                                const leverHandle = document.getElementById('emergency-lever');
                                leverHandle.addEventListener('click', () => {
                                    leverHandle.classList.add('pulled');
                                    sfx.leverPull();
                                    setTimeout(() => window.location.reload(), 1000);
                                });

                            }, 5000); 

                        }, 2500); 
                    }, 800);
                }
            }, 1000);
        });
    });

    // ==========================================
    // SLIDE 1: DUAL AUTHENTICATION LOCK
    // ==========================================
    const keycard = document.getElementById('keycard');
    const dropzone = document.getElementById('dropzone');
    const readerStatus = document.getElementById('reader-status');
    const fingerprintBtn = document.getElementById('fingerprint-btn');
    const bioStatus = document.getElementById('bio-status');
    const systemMsg = document.getElementById('system-msg');
    const statusDot = document.querySelector('.status-dot');

    keycard.addEventListener('dragstart', (e) => { 
        initAudio(); sfx.click(); e.dataTransfer.setData('text/plain', 'access_card'); 
        setTimeout(() => keycard.classList.add('hidden'), 0); 
    });
    keycard.addEventListener('dragend', () => keycard.classList.remove('hidden'));
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.getData('text/plain') === 'access_card') {
            sfx.success();
            dropzone.classList.remove('drag-over'); dropzone.classList.add('success');
            readerStatus.textContent = "CARD ACCEPTED";
            keycard.style.display = 'none';
            authState.card = true;
            checkAuth();
        }
    });

    fingerprintBtn.addEventListener('click', () => {
        if (authState.bio) return; 
        sfx.scan();
        fingerprintBtn.classList.add('scanning');
        bioStatus.textContent = "SCANNING..."; bioStatus.style.color = "#00d2ff";

        setTimeout(() => {
            sfx.success();
            fingerprintBtn.classList.remove('scanning'); fingerprintBtn.classList.add('success');
            bioStatus.textContent = "BIOMETRICS VERIFIED"; bioStatus.style.color = "#00ff88";
            authState.bio = true;
            checkAuth();
        }, 1500);
    });

    function checkAuth() {
        if (authState.card && authState.bio) {
            systemMsg.textContent = "OVERRIDE ACCEPTED. DISENGAGING LOCKS.";
            systemMsg.style.color = "#00ff88";
            statusDot.style.background = "#00ff88"; statusDot.style.boxShadow = "0 0 10px #00ff88";

            setTimeout(() => document.getElementById('login-panel').classList.add('fade-out'), 1500);
            setTimeout(() => {
                sfx.door();
                document.querySelectorAll('.door').forEach(d => d.classList.add('open'));
            }, 2500);
            setTimeout(() => navigateTo('slide-2'), 4500);
        }
    }

    // ==========================================
    // SLIDE 2: SUPERNOVA TO ATOM & REACTOR CORE
    // ==========================================
    const coreParticle = document.getElementById('core-particle');
    const introRevealGroup = document.getElementById('intro-reveal-group');
    const navHub = document.getElementById('nav-hub');
    const slide2 = document.getElementById('slide-2');

    coreParticle.addEventListener('click', () => {
        if (coreParticle.classList.contains('charging')) return;
        
        // Phase 1: 2-Second Charging Sequence
        coreParticle.classList.add('charging');
        sfx.charge(); // Play synth charge sound
        
        // Phase 2: The Explosion
        setTimeout(() => {
            coreParticle.style.display = 'none';
            supernovaSound.currentTime = 0;
            supernovaSound.play().catch(e => console.log("Audio play failed:", e));

            const particleCount = 200;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.classList.add('shrapnel');
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 800 + 200; 
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;
                
                particle.style.setProperty('--tx', `${tx}px`);
                particle.style.setProperty('--ty', `${ty}px`);
                
                particle.style.animationDelay = `${Math.random() * 0.15}s`;
                slide2.appendChild(particle);
                
                setTimeout(() => particle.remove(), 2600);
            }

            setTimeout(() => {
                introRevealGroup.classList.add('reveal');
                reactorCore.classList.add('revealed');
            }, 2200);

            setTimeout(() => navHub.classList.add('reveal'), 4000);
            
        }, 2000); // 2000ms delay matches the CSS charging animation
    });
});