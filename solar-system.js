class SolarSystemSimulation {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.planets = {};
        this.sun = null;
        this.orbits = {};
        this.labels = {};
        this.asteroids = [];
        this.atmosphereEffects = {};
        this.speed = 1;
        this.timeDirection = 1; // 1 for forward, -1 for reverse
        this.isPaused = false;
        this.isAutoRotating = false;
        this.isFollowingEarth = false;
        this.isTourMode = false;
        this.tourIndex = 0;
        this.tourPlanets = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        // Enhanced real planetary data with more accurate information
        this.planetData = {
            sun: {
                name: 'Sun',
                radius: 10,
                color: 0xFDB813,
                position: { x: 0, y: 0, z: 0 },
                mass: 1.989e30,
                temperature: 5778,
                luminosity: 3.828e26,
                rotationPeriod: 609.12, // hours at equator
                atmosphere: 'None'
            },
            mercury: {
                name: 'Mercury',
                radius: 0.383,
                color: 0x8C7853,
                distance: 30,
                orbitalPeriod: 87.97, // Earth days
                rotationPeriod: 1407.6, // Earth hours
                orbitalInclination: 7.005,
                mass: 3.301e23,
                temperature: 440,
                moons: 0,
                atmosphere: 'Extremely thin'
            },
            venus: {
                name: 'Venus',
                radius: 0.949,
                color: 0xFFC649,
                distance: 45,
                orbitalPeriod: 224.7,
                rotationPeriod: -5832.5, // Retrograde rotation
                orbitalInclination: 3.394,
                mass: 4.867e24,
                temperature: 737,
                moons: 0,
                atmosphere: 'Dense CO₂'
            },
            earth: {
                name: 'Earth',
                radius: 1.0,
                color: 0x6B93D6,
                distance: 60,
                orbitalPeriod: 365.25,
                rotationPeriod: 24,
                orbitalInclination: 0,
                mass: 5.972e24,
                temperature: 288,
                moons: 1,
                atmosphere: '78% N₂, 21% O₂',
                hasMoon: true
            },
            mars: {
                name: 'Mars',
                radius: 0.532,
                color: 0xCD5C5C,
                distance: 75,
                orbitalPeriod: 686.98,
                rotationPeriod: 24.6,
                orbitalInclination: 1.850,
                mass: 6.39e23,
                temperature: 210,
                moons: 2,
                atmosphere: 'Thin CO₂'
            },
            jupiter: {
                name: 'Jupiter',
                radius: 11.21,
                color: 0xD8CA9D,
                distance: 110,
                orbitalPeriod: 4332.59,
                rotationPeriod: 9.9,
                orbitalInclination: 1.303,
                mass: 1.898e27,
                temperature: 165,
                moons: 79,
                atmosphere: 'H₂, He, CH₄'
            },
            saturn: {
                name: 'Saturn',
                radius: 9.45,
                color: 0xFAD5A5,
                distance: 140,
                orbitalPeriod: 10759.22,
                rotationPeriod: 10.7,
                orbitalInclination: 2.485,
                mass: 5.683e26,
                temperature: 134,
                moons: 82,
                atmosphere: 'H₂, He',
                hasRings: true
            },
            uranus: {
                name: 'Uranus',
                radius: 4.01,
                color: 0x4FD0E3,
                distance: 175,
                orbitalPeriod: 30685.4,
                rotationPeriod: 17.2,
                orbitalInclination: 0.773,
                mass: 8.681e25,
                temperature: 76,
                moons: 27,
                atmosphere: 'H₂, He, CH₄'
            },
            neptune: {
                name: 'Neptune',
                radius: 3.88,
                color: 0x4B70DD,
                distance: 210,
                orbitalPeriod: 60190,
                rotationPeriod: 16.1,
                orbitalInclination: 1.770,
                mass: 1.024e26,
                temperature: 72,
                moons: 14,
                atmosphere: 'H₂, He, CH₄'
            }
        };

        this.init();
        this.createSolarSystem();
        this.setupEventListeners();
        this.createAsteroidBelt();
        this.animate();
    }

    init() {
        // Create scene with enhanced background
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.0001);

        // Create camera with better positioning
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            3000
        );
        this.camera.position.set(0, 80, 150);

        // Create renderer with enhanced settings
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // Create enhanced controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 800;
        this.controls.minDistance = 5;
        this.controls.enablePan = true;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;

        // Add enhanced lighting
        this.setupEnhancedLighting();

        // Create enhanced star field
        this.createEnhancedStarField();

        // Hide loading
        document.getElementById('loading').style.display = 'none';
    }

    setupEnhancedLighting() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Enhanced point light from the sun
        const sunLight = new THREE.PointLight(0xffffff, 3, 500);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.bias = -0.0001;
        this.scene.add(sunLight);

        // Add fill light for better planet illumination
        const fillLight = new THREE.DirectionalLight(0x4fc3f7, 0.2);
        fillLight.position.set(100, 100, 100);
        this.scene.add(fillLight);

        // Rim light for dramatic effect
        const rimLight = new THREE.DirectionalLight(0xff6b35, 0.1);
        rimLight.position.set(-100, -50, -100);
        this.scene.add(rimLight);
    }

    createEnhancedStarField() {
        // Create multiple layers of stars for depth
        const starLayers = [
            { count: 1000, size: 0.5, distance: 1500, opacity: 0.3 },
            { count: 2000, size: 1, distance: 2000, opacity: 0.6 },
            { count: 3000, size: 0.3, distance: 2500, opacity: 0.4 }
        ];

        starLayers.forEach((layer, index) => {
            const starsGeometry = new THREE.BufferGeometry();
            const starVertices = [];
            
            for (let i = 0; i < layer.count; i++) {
                const x = (Math.random() - 0.5) * layer.distance * 2;
                const y = (Math.random() - 0.5) * layer.distance * 2;
                const z = (Math.random() - 0.5) * layer.distance * 2;
                starVertices.push(x, y, z);
            }
            
            starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
            
            const starsMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: layer.size,
                transparent: true,
                opacity: layer.opacity,
                sizeAttenuation: true
            });
            
            const starField = new THREE.Points(starsGeometry, starsMaterial);
            this.scene.add(starField);
        });

        // Add some colored stars
        const coloredStars = [
            { color: 0xff6b6b, count: 50, size: 0.8 },
            { color: 0x4ecdc4, count: 30, size: 0.6 },
            { color: 0x45b7d1, count: 40, size: 0.7 }
        ];

        coloredStars.forEach(starConfig => {
            const starsGeometry = new THREE.BufferGeometry();
            const starVertices = [];
            
            for (let i = 0; i < starConfig.count; i++) {
                const x = (Math.random() - 0.5) * 3000;
                const y = (Math.random() - 0.5) * 3000;
                const z = (Math.random() - 0.5) * 3000;
                starVertices.push(x, y, z);
            }
            
            starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
            
            const starsMaterial = new THREE.PointsMaterial({
                color: starConfig.color,
                size: starConfig.size,
                transparent: true,
                opacity: 0.8,
                sizeAttenuation: true
            });
            
            const starField = new THREE.Points(starsGeometry, starsMaterial);
            this.scene.add(starField);
        });
    }

    createSolarSystem() {
        this.createEnhancedSun();
        this.createEnhancedPlanets();
        this.createEnhancedOrbits();
        this.createEnhancedLabels();
        this.createAtmosphericEffects();
    }

    createEnhancedSun() {
        const sunData = this.planetData.sun;
        
        // Main sun sphere
        const geometry = new THREE.SphereGeometry(sunData.radius, 64, 64);
        
        // Enhanced material with emissive properties
        const material = new THREE.MeshPhongMaterial({ 
            color: sunData.color,
            emissive: sunData.color,
            emissiveIntensity: 0.3,
            shininess: 100
        });
        
        this.sun = new THREE.Mesh(geometry, material);
        this.sun.castShadow = false;
        this.sun.receiveShadow = false;
        this.scene.add(this.sun);

        // Enhanced sun glow effect
        const glowGeometry = new THREE.SphereGeometry(sunData.radius * 1.3, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: sunData.color,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sun.add(sunGlow);

        // Corona effect
        const coronaGeometry = new THREE.SphereGeometry(sunData.radius * 1.6, 32, 32);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF88,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        this.sun.add(corona);
    }

    createEnhancedPlanets() {
        Object.keys(this.planetData).forEach(planetName => {
            if (planetName === 'sun') return;

            const data = this.planetData[planetName];
            const scale = 0.8; // Scale factor for better visibility
            const geometry = new THREE.SphereGeometry(data.radius * scale, 32, 32);
            
            let material;
            if (planetName === 'jupiter' || planetName === 'saturn') {
                // Create textured effect for gas giants
                material = new THREE.MeshPhongMaterial({ 
                    color: data.color,
                    shininess: 30,
                    specular: 0x222222
                });
            } else {
                material = new THREE.MeshLambertMaterial({ 
                    color: data.color,
                    shininess: 50
                });
            }
            
            const planet = new THREE.Mesh(geometry, material);
            planet.castShadow = true;
            planet.receiveShadow = true;
            planet.userData = { 
                name: data.name, 
                data: data,
                angle: Math.random() * Math.PI * 2,
                rotationAngle: 0,
                scale: scale
            };
            
            this.planets[planetName] = planet;
            this.scene.add(planet);
            
            // Add atmospheric glow for planets with atmosphere
            if (data.atmosphere && data.atmosphere !== 'None' && data.atmosphere !== 'Extremely thin') {
                this.createPlanetAtmosphere(planetName, data);
            }
        });

        // Special features for specific planets
        this.createSaturnRings();
        this.createJupiterStorm();
    }

    createPlanetAtmosphere(planetName, data) {
        const planet = this.planets[planetName];
        const scale = planet.userData.scale;
        
        const atmosphereGeometry = new THREE.SphereGeometry(data.radius * scale * 1.1, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: this.getAtmosphereColor(planetName),
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        planet.add(atmosphere);
        
        this.atmosphereEffects[planetName] = atmosphere;
    }

    getAtmosphereColor(planetName) {
        const atmosphereColors = {
            venus: 0xFFFF88,
            earth: 0x4488FF,
            mars: 0xFF6644,
            jupiter: 0xFFDD88,
            saturn: 0xFFEEAA,
            uranus: 0x44DDFF,
            neptune: 0x4488FF
        };
        return atmosphereColors[planetName] || 0x4488FF;
    }

    createSaturnRings() {
        if (!this.planets.saturn) return;
        
        const saturnData = this.planetData.saturn;
        const scale = this.planets.saturn.userData.scale;
        
        // Create multiple ring layers for realism
        const ringConfigs = [
            { inner: saturnData.radius * scale * 1.3, outer: saturnData.radius * scale * 1.6, opacity: 0.8 },
            { inner: saturnData.radius * scale * 1.6, outer: saturnData.radius * scale * 2.1, opacity: 0.6 },
            { inner: saturnData.radius * scale * 2.1, outer: saturnData.radius * scale * 2.8, opacity: 0.4 }
        ];

        ringConfigs.forEach((config, index) => {
            const ringGeometry = new THREE.RingGeometry(config.inner, config.outer, 128);
            
            // Create texture-like effect using vertices
            const positionAttribute = ringGeometry.attributes.position;
            const colors = [];
            
            for (let i = 0; i < positionAttribute.count; i++) {
                const color = new THREE.Color();
                color.setHSL(0.1 + Math.random() * 0.1, 0.3, 0.7 + Math.random() * 0.2);
                colors.push(color.r, color.g, color.b);
            }
            
            ringGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            
            const ringMaterial = new THREE.MeshBasicMaterial({
                vertexColors: true,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: config.opacity,
                blending: THREE.AdditiveBlending
            });
            
            const rings = new THREE.Mesh(ringGeometry, ringMaterial);
            rings.rotation.x = Math.PI / 2;
            this.planets.saturn.add(rings);
        });
    }

    createJupiterStorm() {
        if (!this.planets.jupiter) return;
        
        // Create Great Red Spot effect
        const spotGeometry = new THREE.CircleGeometry(2, 32);
        const spotMaterial = new THREE.MeshBasicMaterial({
            color: 0xCD5C5C,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const greatRedSpot = new THREE.Mesh(spotGeometry, spotMaterial);
        greatRedSpot.position.set(3, 0, 2);
        greatRedSpot.rotation.x = -Math.PI / 2;
        this.planets.jupiter.add(greatRedSpot);
    }

    createEnhancedOrbits() {
        Object.keys(this.planetData).forEach(planetName => {
            if (planetName === 'sun') return;

            const data = this.planetData[planetName];
            const segments = 256; // More segments for smoother orbits
            
            const curve = new THREE.EllipseCurve(
                0, 0,
                data.distance, data.distance * 0.998,
                0, 2 * Math.PI,
                false,
                0
            );
            
            const points = curve.getPoints(segments);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            const material = new THREE.LineBasicMaterial({
                color: 0x4fc3f7,
                transparent: true,
                opacity: 0.3,
                linewidth: 1
            });
            
            const orbit = new THREE.Line(geometry, material);
            orbit.rotation.x = THREE.MathUtils.degToRad(data.orbitalInclination);
            
            this.orbits[planetName] = orbit;
            this.scene.add(orbit);
        });
    }

    createEnhancedLabels() {
        Object.keys(this.planetData).forEach(planetName => {
            if (planetName === 'sun') return;

            const data = this.planetData[planetName];
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 512;
            canvas.height = 128;
            
            // Enhanced label styling
            context.font = 'bold 48px Orbitron, Arial';
            context.fillStyle = '#4fc3f7';
            context.textAlign = 'center';
            context.shadowColor = '#4fc3f7';
            context.shadowBlur = 20;
            context.fillText(data.name, 256, 64);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            
            const material = new THREE.SpriteMaterial({ 
                map: texture, 
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(20, 5, 1);
            sprite.position.set(0, data.radius * 1.5 + 3, 0);
            
            this.labels[planetName] = sprite;
            this.planets[planetName].add(sprite);
        });
    }

    createAtmosphericEffects() {
        // Add particle effects for the sun
        this.createSolarWind();
    }

    createSolarWind() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            // Particles originate from sun surface
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const radius = this.planetData.sun.radius * 1.1;
            
            positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
            positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
            positions[i * 3 + 2] = radius * Math.cos(theta);
            
            // Random outward velocities
            velocities[i * 3] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
            
            // Yellow-white colors
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 0.9;
            colors[i * 3 + 2] = 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const solarWind = new THREE.Points(geometry, material);
        this.scene.add(solarWind);
        this.solarWind = solarWind;
    }

    createAsteroidBelt() {
        const asteroidCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(asteroidCount * 3);
        const colors = new Float32Array(asteroidCount * 3);
        const sizes = new Float32Array(asteroidCount);

        for (let i = 0; i < asteroidCount; i++) {
            // Distribute asteroids between Mars and Jupiter
            const angle = Math.random() * Math.PI * 2;
            const distance = 85 + Math.random() * 10; // Between Mars and Jupiter
            const height = (Math.random() - 0.5) * 2; // Small vertical spread
            
            positions[i * 3] = distance * Math.cos(angle);
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = distance * Math.sin(angle);
            
            // Grayish colors for asteroids
            const gray = 0.5 + Math.random() * 0.3;
            colors[i * 3] = gray;
            colors[i * 3 + 1] = gray * 0.9;
            colors[i * 3 + 2] = gray * 0.8;
            
            sizes[i] = Math.random() * 0.5 + 0.1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.7
        });

        const asteroidBelt = new THREE.Points(geometry, material);
        this.scene.add(asteroidBelt);
        this.asteroidBelt = asteroidBelt;
    }

    setupEventListeners() {
        // Enhanced speed control
        const speedSlider = document.getElementById('speed-slider');
        const speedButtons = document.querySelectorAll('.speed-btn');
        
        speedSlider.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            this.updateSpeedDisplay();
            this.updateSpeedButtons();
        });

        speedButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.speed = parseFloat(e.target.dataset.speed);
                speedSlider.value = this.speed;
                this.updateSpeedDisplay();
                this.updateSpeedButtons();
            });
        });

        // Enhanced toggle controls
        const toggleButtons = document.querySelectorAll('.toggle-btn[data-toggle]');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const toggle = e.target.dataset.toggle;
                this.toggleElement(toggle);
                e.target.classList.toggle('active');
            });
        });

        // Enhanced camera controls
        document.getElementById('auto-rotate').addEventListener('click', () => {
            this.isAutoRotating = !this.isAutoRotating;
            this.controls.autoRotate = this.isAutoRotating;
            document.getElementById('auto-rotate').classList.toggle('active');
        });

        document.getElementById('follow-earth').addEventListener('click', () => {
            this.isFollowingEarth = !this.isFollowingEarth;
            document.getElementById('follow-earth').classList.toggle('active');
        });

        // New tour mode
        document.getElementById('tour-mode').addEventListener('click', () => {
            this.isTourMode = !this.isTourMode;
            document.getElementById('tour-mode').classList.toggle('active');
            if (this.isTourMode) {
                this.startTour();
            }
        });

        // Fullscreen functionality
        document.getElementById('fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Time controls
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('time-reversal').addEventListener('click', () => {
            this.timeDirection *= -1;
            document.getElementById('time-reversal').classList.toggle('active');
        });

        document.getElementById('reset-time').addEventListener('click', () => {
            this.resetTime();
        });

        document.getElementById('century-view').addEventListener('click', () => {
            this.setCenturyView();
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetView();
        });

        // Enhanced mouse interactions
        this.renderer.domElement.addEventListener('click', (event) => {
            this.onMouseClick(event);
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.onKeyDown(event);
        });
    }

    toggleElement(type) {
        switch(type) {
            case 'orbits':
                Object.values(this.orbits).forEach(orbit => {
                    orbit.visible = !orbit.visible;
                });
                break;
            case 'labels':
                Object.values(this.labels).forEach(label => {
                    label.visible = !label.visible;
                });
                break;
            case 'atmosphere':
                Object.values(this.atmosphereEffects).forEach(atmosphere => {
                    atmosphere.visible = !atmosphere.visible;
                });
                break;
            case 'asteroids':
                if (this.asteroidBelt) {
                    this.asteroidBelt.visible = !this.asteroidBelt.visible;
                }
                break;
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
        pauseBtn.classList.toggle('active');
    }

    resetTime() {
        this.speed = 1;
        this.timeDirection = 1;
        this.isPaused = false;
        document.getElementById('speed-slider').value = 1;
        this.updateSpeedDisplay();
        this.updateSpeedButtons();
    }

    setCenturyView() {
        this.speed = 50;
        document.getElementById('speed-slider').value = 50;
        this.updateSpeedDisplay();
    }

    startTour() {
        this.tourIndex = 0;
        this.performTourStep();
    }

    performTourStep() {
        if (!this.isTourMode) return;
        
        const planetName = this.tourPlanets[this.tourIndex];
        if (this.planets[planetName]) {
            const planetPosition = this.planets[planetName].position;
            
            // Smooth camera transition to planet
            const targetPosition = planetPosition.clone().add(new THREE.Vector3(20, 10, 20));
            this.animateCameraTo(targetPosition, planetPosition);
        }
        
        this.tourIndex = (this.tourIndex + 1) % this.tourPlanets.length;
        
        // Show planet info
        if (planetName !== 'sun') {
            this.showPlanetInfo(planetName);
        }
        
        setTimeout(() => {
            if (this.isTourMode) {
                this.performTourStep();
            }
        }, 3000);
    }

    animateCameraTo(targetPosition, targetLookAt) {
        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            
            this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
            this.controls.target.lerpVectors(startTarget, targetLookAt, easedProgress);
            this.controls.update();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    updateSpeedDisplay() {
        document.getElementById('current-speed').textContent = `${this.speed.toFixed(1)}x`;
        document.getElementById('stats-speed').textContent = `${this.speed.toFixed(1)}x`;
    }

    updateSpeedButtons() {
        const speedButtons = document.querySelectorAll('.speed-btn');
        speedButtons.forEach(button => {
            button.classList.remove('active');
            if (parseFloat(button.dataset.speed) === this.speed) {
                button.classList.add('active');
            }
        });
    }

    resetView() {
        this.camera.position.set(0, 80, 150);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        this.isAutoRotating = false;
        this.isFollowingEarth = false;
        this.isTourMode = false;
        document.getElementById('auto-rotate').classList.remove('active');
        document.getElementById('follow-earth').classList.remove('active');
        document.getElementById('tour-mode').classList.remove('active');
    }

    onMouseClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(Object.values(this.planets));

        if (intersects.length > 0) {
            const planetName = intersects[0].object.userData.name.toLowerCase();
            this.showPlanetInfo(planetName);
            this.focusOnPlanet(planetName);
        }
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(Object.values(this.planets));

        this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    }

    focusOnPlanet(planetName) {
        if (this.planets[planetName]) {
            const planetPosition = this.planets[planetName].position;
            const targetPosition = planetPosition.clone().add(new THREE.Vector3(15, 8, 15));
            this.animateCameraTo(targetPosition, planetPosition);
        }
    }

    showPlanetInfo(planetName) {
        const allInfo = document.querySelectorAll('.planet-info');
        allInfo.forEach(info => info.classList.remove('active'));

        const planetInfo = document.getElementById(`${planetName}-info`);
        if (planetInfo) {
            planetInfo.classList.add('active');
        }
    }

    onKeyDown(event) {
        switch(event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePause();
                break;
            case 'KeyR':
                this.resetView();
                break;
            case 'KeyF':
                this.toggleFullscreen();
                break;
            case 'ArrowLeft':
                this.timeDirection = -1;
                break;
            case 'ArrowRight':
                this.timeDirection = 1;
                break;
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updatePlanetPositions() {
        if (this.isPaused) return;
        
        const deltaTime = this.clock.getDelta();
        const timeScale = this.speed * 0.001 * this.timeDirection;

        Object.keys(this.planets).forEach(planetName => {
            const planet = this.planets[planetName];
            const data = planet.userData.data;
            
            // Update orbital position with enhanced physics
            const orbitalSpeed = (2 * Math.PI) / data.orbitalPeriod;
            planet.userData.angle += orbitalSpeed * timeScale * deltaTime * 1000;
            
            // Elliptical orbit calculation
            const eccentricity = 0.0167; // Earth's orbital eccentricity (simplified)
            const semiMajorAxis = data.distance;
            const trueAnomaly = planet.userData.angle;
            const r = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly));
            
            const x = r * Math.cos(trueAnomaly);
            const z = r * Math.sin(trueAnomaly);
            
            // Apply orbital inclination
            const inclination = THREE.MathUtils.degToRad(data.orbitalInclination);
            const y = z * Math.sin(inclination);
            const zCorrected = z * Math.cos(inclination);
            
            planet.position.set(x, y, zCorrected);
            
            // Enhanced rotation with axial tilt
            if (data.rotationPeriod > 0) {
                const rotationSpeed = (2 * Math.PI) / data.rotationPeriod;
                planet.userData.rotationAngle += rotationSpeed * timeScale * deltaTime * 1000;
                planet.rotation.y = planet.userData.rotationAngle;
            } else {
                // Retrograde rotation (Venus, Uranus)
                const rotationSpeed = (2 * Math.PI) / Math.abs(data.rotationPeriod);
                planet.userData.rotationAngle -= rotationSpeed * timeScale * deltaTime * 1000;
                planet.rotation.y = planet.userData.rotationAngle;
            }
        });
    }

    updateEnhancedEffects() {
        // Update solar wind
        if (this.solarWind) {
            const positions = this.solarWind.geometry.attributes.position.array;
            const velocities = this.solarWind.geometry.attributes.velocity.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i] * this.speed;
                positions[i + 1] += velocities[i + 1] * this.speed;
                positions[i + 2] += velocities[i + 2] * this.speed;
                
                // Reset particles that go too far
                const distance = Math.sqrt(positions[i] * positions[i] + positions[i + 1] * positions[i + 1] + positions[i + 2] * positions[i + 2]);
                if (distance > 200) {
                    // Reset to sun surface
                    const phi = Math.random() * Math.PI * 2;
                    const theta = Math.random() * Math.PI;
                    const radius = this.planetData.sun.radius * 1.1;
                    
                    positions[i] = radius * Math.sin(theta) * Math.cos(phi);
                    positions[i + 1] = radius * Math.sin(theta) * Math.sin(phi);
                    positions[i + 2] = radius * Math.cos(theta);
                }
            }
            
            this.solarWind.geometry.attributes.position.needsUpdate = true;
        }

        // Update asteroid belt rotation
        if (this.asteroidBelt) {
            this.asteroidBelt.rotation.y += 0.0001 * this.speed;
        }

        // Update atmospheric effects
        Object.values(this.atmosphereEffects).forEach((atmosphere, index) => {
            atmosphere.rotation.y += 0.001 * (index + 1);
        });

        // Rotate the sun
        if (this.sun) {
            this.sun.rotation.y += 0.001 * this.speed;
        }
    }

    updateCamera() {
        if (this.isAutoRotating) {
            this.controls.autoRotate = true;
        } else {
            this.controls.autoRotate = false;
        }

        if (this.isFollowingEarth && this.planets.earth) {
            const earthPosition = this.planets.earth.position;
            this.controls.target.copy(earthPosition);
        }

        this.controls.update();
    }

    updateStats() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastFpsUpdate > 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
            document.getElementById('fps').textContent = `${this.fps} FPS`;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updatePlanetPositions();
        this.updateEnhancedEffects();
        this.updateCamera();
        this.updateStats();
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the enhanced simulation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SolarSystemSimulation();
});

// Enhanced console information
console.log('🌌 Interactive 3D Solar System Simulation - Ultimate Edition');
console.log('🚀 Features:');
console.log('  • Real astronomical data and orbital mechanics');
console.log('  • Advanced visual effects and lighting');
console.log('  • Interactive planet exploration');
console.log('  • Enhanced UI with tooltips and animations');
console.log('  • Asteroid belt simulation');
console.log('  • Atmospheric effects');
console.log('  • Solar wind particle system');
console.log('  • Multiple camera modes and controls');
console.log('  • Keyboard shortcuts: Space (pause), R (reset), F (fullscreen)');
console.log('  • Responsive design for all devices');
console.log('  • High-performance WebGL rendering');
console.log('⚡ Ready to explore the cosmos!');