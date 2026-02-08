/**
 * Hero Mouse Tilt - Webflow-compatible vanilla JS module
 * Single-file particle logo animation using Three.js and GSAP
 */

import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const VERTEX_SHADER = `
uniform vec2 uResolution;
uniform float uSize;
uniform float uTime;
uniform float uExplosion;
uniform float uWaveFreq;
uniform float uWaveAmp;
uniform float uExplosionStrength;

attribute float sizeScale;

void main()
{
    float dist = length(position.xy);
    float waveAmp = 0.08;
    float gravityBias = -0.04;

    float ripple = waveAmp * sin(dist * 3.0 - uTime * 0.8);
    float angle = atan(position.y, position.x);
    float offsetX = ripple * cos(angle) * 0.4;
    float offsetY = ripple * sin(angle) + gravityBias;

    vec3 pos = position + vec3(offsetX, offsetY, 0.0);

    vec2 randomDir = vec2(
        fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453),
        fract(sin(dot(position.xy + 1.0, vec2(12.9898, 78.233))) * 43758.5453)
    );
    randomDir = normalize(randomDir * 2.0 - 1.0);
    float freq2 = 15.0;
    vec2 curveDir = vec2(
        sin(position.x * freq2) * cos(position.y),
        cos(position.x) * sin(position.y * freq2)
    );
    curveDir = normalize(curveDir + 0.001);
    vec2 blendedDir = normalize(randomDir + curveDir);
    pos.xy += blendedDir * uExplosion * uExplosionStrength;

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
    gl_PointSize = uSize * sizeScale * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);
}
`

const FRAGMENT_SHADER = `
void main()
{
    vec2 uv = gl_PointCoord;
    float dist = length(uv - 0.5);
    float radius = 0.5;

    if (dist > radius) discard;

    float alpha = 1.0;
    gl_FragColor = vec4(0.1, 0.2, 0.6, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`

function loadImagePixels(imageUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = () => {
            const c = document.createElement('canvas')
            c.width = image.width
            c.height = image.height
            const ctx = c.getContext('2d')
            ctx.drawImage(image, 0, 0)
            resolve(ctx.getImageData(0, 0, image.width, image.height))
        }
        image.onerror = () => reject(new Error('Image load failed: ' + imageUrl))
        image.src = imageUrl
    })
}

function createParticlesFromImage(imageData, options = {}) {
    const { spacing = 5, scale = 1, threshold = 8 } = options
    const { data, width, height } = imageData
    const positions = []
    const scales = []
    const aspect = width / height
    const jitter = 0.02

    for (let y = 0; y < height; y += spacing) {
        for (let x = 0; x < width; x += spacing) {
            const i = (y * width + x) * 4
            const a = data[i + 3]
            if (a > threshold) {
                const px = (x / width - 0.5) * 2 * aspect
                const py = -(y / height - 0.5) * 2
                positions.push(
                    px * scale + (Math.random() - 0.5) * jitter,
                    py * scale + (Math.random() - 0.5) * jitter,
                    0
                )
                const radius = Math.random()
                let size
                if (radius < 0.7) size = 1.0
                else if (radius < 0.9) size = 1.25
                else size = 1.5
                scales.push(size)
            }
        }
    }
    return { positions: new Float32Array(positions), scales: new Float32Array(scales) }
}

/**
 * Initialize the hero mouse tilt animation
 * @param {Object} options
 * @param {HTMLCanvasElement} [options.canvas] - Existing canvas element to use
 * @param {HTMLElement} [options.container] - Container element; canvas will be created inside if no canvas provided
 * @param {string} [options.imageUrl='/Logo-s.png'] - URL to the logo image (must be CORS-enabled for cross-origin)
 * @param {number} [options.spacing=6] - Particle spacing from image sampling
 * @param {number} [options.scale=3] - Scale of the logo
 * @returns {{ destroy: () => void }}
 */
function initHeroMouseTilt(options = {}) {
    const {
        canvas: providedCanvas,
        container,
        imageUrl = '/Logo-s.png',
        spacing = 6,
        scale: logoScale = 3,
    } = options

    let canvas = providedCanvas
    if (!canvas && container) {
        canvas = document.createElement('canvas')
        canvas.className = 'webgl'
        canvas.style.display = 'block'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        container.appendChild(canvas)
    }
    if (!canvas) {
        canvas = document.querySelector('canvas.webgl')
    }
    if (!canvas) {
        console.error('HeroMouseTilt: No canvas found. Provide canvas, container, or add a canvas.webgl element.')
        return { destroy: () => {} }
    }

    const scene = new THREE.Scene()
    const sizes = {
        width: canvas.clientWidth || window.innerWidth,
        height: canvas.clientHeight || window.innerHeight,
        pixelRatio: Math.min(window.devicePixelRatio, 2)
    }

    const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
    camera.position.set(0, 0, 16)
    scene.add(camera)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
    renderer.setClearColor(0x000000, 0)

    const particles = {
        geometry: new THREE.BufferGeometry(),
        material: new THREE.ShaderMaterial({
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            blending: THREE.NormalBlending,
            depthWrite: false,
            uniforms: {
                uExplosion: new THREE.Uniform(0),
                uExplosionStrength: new THREE.Uniform(0.3),
                uSize: new THREE.Uniform(0.06),
                uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
                uTime: new THREE.Uniform(0),
                uWaveFreq: new THREE.Uniform(16.0),
                uWaveAmp: new THREE.Uniform(3.5),
            }
        })
    }
    particles.geometry.setIndex(null)
    particles.points = new THREE.Points(particles.geometry, particles.material)
    scene.add(particles.points)

    let explosionCurrent = 0
    let explosionTarget = 0
    const explosionSpeed = 3
    const pointer = new THREE.Vector2()
    const logoCenter = new THREE.Vector3(0, 0, 0)
    const hoverRadius = 0.4
    const clock = new THREE.Clock()
    let animationFrameId = null
    let loadedImageData = null

    function setFallbackParticles() {
        const fallback = []
        const fallBackScales = []
        for (let i = -5; i <= 5; i += 0.5) {
            for (let j = -5; j <= 5; j += 0.5) {
                fallback.push(i, j, 0)
                fallBackScales.push(0.05 + Math.random() * 0.3)
            }
        }
        particles.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fallback), 3))
        particles.geometry.setAttribute('sizeScale', new THREE.BufferAttribute(new Float32Array(fallBackScales), 1))
        particles.geometry.attributes.position.needsUpdate = true
        particles.geometry.attributes.sizeScale.needsUpdate = true
    }

    function updateParticles() {
        if (!loadedImageData) return
        const { positions, scales } = createParticlesFromImage(loadedImageData, { spacing, scale: logoScale })
        particles.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        particles.geometry.setAttribute('sizeScale', new THREE.BufferAttribute(scales, 1))
        particles.geometry.attributes.position.needsUpdate = true
        particles.geometry.attributes.sizeScale.needsUpdate = true
    }

    function onResize() {
        sizes.width = canvas.clientWidth || window.innerWidth
        sizes.height = canvas.clientHeight || window.innerHeight
        sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)
        particles.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(sizes.pixelRatio)
    }

    function onPointerMove(e) {
        pointer.x = (e.clientX / sizes.width) * 2 - 1
        pointer.y = -((e.clientY / sizes.height) * 2 - 1)
    }

    function onPointerLeave() {
        pointer.set(0, 0)
    }

    function tick() {
        const delta = clock.getDelta()
        particles.material.uniforms.uTime.value = clock.getElapsedTime()

        const distanceFromCenter = Math.min(1, Math.hypot(pointer.x, pointer.y))
        const maxTilt = 0.75
        const tiltSpeed = 5
        const targetTiltX = -pointer.y * distanceFromCenter * maxTilt
        const targetTiltY = pointer.x * distanceFromCenter * maxTilt
        particles.points.rotation.x += (targetTiltX - particles.points.rotation.x) * Math.min(1, tiltSpeed * delta)
        particles.points.rotation.y += (targetTiltY - particles.points.rotation.y) * Math.min(1, tiltSpeed * delta)

        logoCenter.set(0, 0, 0)
        logoCenter.project(camera)
        const distance = pointer.distanceTo(new THREE.Vector2(logoCenter.x, logoCenter.y))
        const hoverExplosion = distance < hoverRadius ? 1 : 0
        explosionTarget = hoverExplosion

        explosionCurrent += (explosionTarget - explosionCurrent) * Math.min(1, explosionSpeed * delta)
        particles.material.uniforms.uExplosion.value = explosionCurrent

        renderer.render(scene, camera)
        animationFrameId = requestAnimationFrame(tick)
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerleave', onPointerLeave)

    loadImagePixels(imageUrl)
        .then((imageData) => {
            loadedImageData = imageData
            updateParticles()
        })
        .catch((err) => {
            console.warn('HeroMouseTilt: Could not load image, using fallback grid:', err.message)
            setFallbackParticles()
        })

    tick()

    return {
        destroy() {
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener('resize', onResize)
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('pointerleave', onPointerLeave)
            renderer.dispose()
            particles.geometry.dispose()
            particles.material.dispose()
            if (container && canvas && canvas.parentNode === container) {
                container.removeChild(canvas)
            }
        }
    }
}

export default initHeroMouseTilt
