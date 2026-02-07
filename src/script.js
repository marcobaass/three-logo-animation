import * as THREE from 'three'
import GUI from 'lil-gui'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import particlesVertexShader from './shaders/particles/vertex.glsl'
import particlesFragmentShader from './shaders/particles/fragment.glsl'

gsap.registerPlugin(ScrollTrigger)

/**
 * Base
 */
const gui = new GUI({ width: 340 })
const debugObject = {}

const canvas = document.querySelector('canvas.webgl')
if (!canvas) throw new Error('Canvas not found')

const scene = new THREE.Scene()

/**
 * Pixel data
 */
function loadImagePixels(imagePath) {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => {
            const c = document.createElement('canvas')
            c.width = image.width
            c.height = image.height
            const ctx = c.getContext('2d')
            ctx.drawImage(image, 0, 0)
            resolve(ctx.getImageData(0, 0, image.width, image.height))
        }
        image.onerror = () => reject(new Error('Image load failed: ' + imagePath))
        image.src = imagePath
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

                // 70% small, 20% medium, 10% large
                const radius = Math.random()
                let size
                if (radius < 0.7) {
                    size = 0.75 + Math.random() * 0.5
                } else if (radius < 0.9) {
                    size = 1.0 + Math.random() * 0.4
                } else {
                    size = 1.25 + Math.random() * 0.3
                }
                scales.push(size)
            }
        }
    }
    return { positions: new Float32Array(positions), scales: new Float32Array(scales) }
}

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)
    particles.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 16)
scene.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
renderer.setClearColor(0x000000, 0)

/**
 * Particles
 */
const particles = {
    geometry: new THREE.BufferGeometry(),
    material: new THREE.ShaderMaterial({
        vertexShader: particlesVertexShader,
        fragmentShader: particlesFragmentShader,
        blending: THREE.NormalBlending,
        depthWrite: false,
        uniforms: {
            uExplosion: new THREE.Uniform(0),
            uExplosionStrength: new THREE.Uniform(0.3),
            uSize: new THREE.Uniform(0.07),
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

/**
 * Explosion (GSAP ScrollTrigger + hover)
 */
let explosionCurrent = 0
let explosionTarget = 0
let scrollExplosionTarget = 0
const explosionSpeed = 3

const pointer = new THREE.Vector2()
const logoCenter = new THREE.Vector3(0, 0, 0)
const hoverRadius = 0.4

window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / sizes.width) * 2 - 1
    pointer.y = -((e.clientY / sizes.height) * 2 - 1)
})

window.addEventListener('pointerleave', () => {
    pointer.set(-10, -10)
})

// gsap.to({}, {
//     scrollTrigger: {
//         trigger: '.scroll-spacer',
//         start: 'top top',
//         end: 'bottom bottom',
//         scrub: 1,
//         yoyo: true,
//         repeat: 1,
//         onUpdate: (self) => {
//             scrollExplosionTarget = Math.sin(self.progress * Math.PI)
//         }
//     }
// })

/**
 * Load image & update particles
 */
let loadedImageData = null
const imagePath = '/Logo-s.png'

loadImagePixels(imagePath)
    .then((imageData) => {
        loadedImageData = imageData
        updateParticles()
    })
    .catch((err) => {
        console.error(err)
        // Fallback: create a simple grid of particles so something renders
        const fallback = []
        const fallBackScales = []
        for (let i = -5; i <= 5; i += 0.5) {
            for (let j = -5; j <= 5; j += 0.5) {
                fallback.push(i, j, 0)
                fallBackScales.push(0.05 + Math.random() * 0.3)
            }
        }
        particles.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fallback), 3))
        particles.geometry.attributes.position.needsUpdate = true
        particles.geometry.setAttribute('sizeScale', new THREE.BufferAttribute(new Float32Array(fallBackScales), 1))
        particles.geometry.attributes.sizeScale.needsUpdate = true
    })

function updateParticles() {
    if (!loadedImageData) return
    const { positions, scales } = createParticlesFromImage(loadedImageData, {
        spacing: debugObject.spacing ?? 6,
        scale: debugObject.scale ?? 3
    })
    particles.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particles.geometry.setAttribute('sizeScale', new THREE.BufferAttribute(scales, 1))
    particles.geometry.attributes.position.needsUpdate = true
    particles.geometry.attributes.sizeScale.needsUpdate = true
}

/**
 * GUI
 */
debugObject.clearColor = '#fff'
gui.addColor(debugObject, 'clearColor').onChange((c) => renderer.setClearColor(c))
// renderer.setClearColor(debugObject.clearColor)

debugObject.spacing = 12
debugObject.scale = 3
gui.add(debugObject, 'spacing').min(1).max(20).step(1).name('Spacing').onChange(updateParticles)
gui.add(debugObject, 'scale').min(0.1).max(10).step(0.1).name('Scale').onChange(updateParticles)
gui.add(particles.material.uniforms.uSize, 'value').min(0.01).max(0.1).step(0.01).name('Size')
debugObject.explosion = 0
gui.add(debugObject, 'explosion', 0, 1, 0.01).name('Explosion').onChange((v) => { explosionTarget = v })

gui.add(particles.material.uniforms.uWaveFreq, 'value').min(1).max(20).step(1).name('Wave Frequency')
gui.add(particles.material.uniforms.uWaveAmp, 'value').min(0.1).max(5).step(0.1).name('Wave Amplitude')
gui.add(particles.material.uniforms.uExplosionStrength, 'value').min(0.1).max(3).step(0.1).name('Explosion Strength')
/**
 * Animate
 */
const clock = new THREE.Clock()

function tick() {
    const delta = clock.getDelta()
    particles.material.uniforms.uTime.value = clock.getElapsedTime()

    // Rotate the particles logo
    // particles.points.rotation.y += 0.0025

    // Hover: project logo center to screen, check if pointer is near
    logoCenter.set(0, 0, 0)
    logoCenter.project(camera)
    const distance = pointer.distanceTo(new THREE.Vector2(logoCenter.x, logoCenter.y))
    const hoverExplosion = distance < hoverRadius ? 1 : 0
    explosionTarget = Math.max(scrollExplosionTarget, hoverExplosion, debugObject.explosion ?? 0)

    explosionCurrent += (explosionTarget - explosionCurrent) * Math.min(1, explosionSpeed * delta)
    particles.material.uniforms.uExplosion.value = explosionCurrent
    renderer.render(scene, camera)
    requestAnimationFrame(tick)
}
tick()
