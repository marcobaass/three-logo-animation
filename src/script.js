import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
console.log('ok')
import particlesVertexShader from './shaders/particles/vertex.glsl'
import particlesFragmentShader from './shaders/particles/fragment.glsl'

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 })
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Pixel data
function loadImagePixels(imagePath) {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = image.width
            canvas.height = image.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(image, 0, 0)
            const imageData = ctx.getImageData(0, 0, image.width, image.height)
            resolve(imageData)
        }
        image.src = imagePath
    })
}

// Sample pixels
function createParticlesFromImage(imageData, options = {}) {
    const {
        spacing = 5,        // sample every Nth pixel
        scale = 1,           // Scale of the final shape(1 = original size)
        threshold = 8,    // alpha threshold(0-255)
    } = options

    const { data, width, height } = imageData
    const positions = []

    for (let y = 0; y < height; y += spacing) {
        for (let x = 0; x < width; x += spacing) {
            const i = (y * width + x) * 4
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const a = data[i + 3]
             
            const aspect = width / height
            const px = (x / width - 0.5) * 2 * aspect
            const py = - (y / height - 0.5) * 2 // flip y axis

            // const jitter = 0.005
            const jitter = 0.02

            const offsetX = (Math.random() - 0.5) * jitter
            const offsetY = (Math.random() - 0.5) * jitter

            if (a > threshold) {
            positions.push(
                    (px * scale) + offsetX,
                    (py * scale) + offsetY,
                    0
                )
            }
            
        }
    }

    return new Float32Array(positions)
}

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Materials
    particles.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 8 * 2)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

/**
 * Particles
 */
const particles = {}

particles.geometry = new THREE.BufferGeometry(3)
particles.geometry.setIndex(null)

particles.material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    blending: THREE.NormalBlending,
    depthWrite: false,
    uniforms: {
        uExplosion: new THREE.Uniform(0),
        uSize: new THREE.Uniform(0.05),
        uResolution: new THREE.Uniform(
            new THREE.Vector2(
                sizes.width * sizes.pixelRatio,
                sizes.height * sizes.pixelRatio
            )
        ),
        uTime: new THREE.Uniform(0),
    }
})

particles.points = new THREE.Points(particles.geometry, particles.material)
scene.add(particles.points)

loadImagePixels('/Logo-s.png').then((imageData) => {
    loadedImageData = imageData
    updateParticles()
})

/**
 * Tweaks
 */
// Background Color
debugObject.clearColor = '#fff'
gui.addColor(debugObject, 'clearColor').onChange(() => { renderer.setClearColor(debugObject.clearColor) })
renderer.setClearColor(debugObject.clearColor)

// Spacing
debugObject.spacing = 6
debugObject.scale = 3
let loadedImageData = null

function updateParticles() {
    if (!loadedImageData) return
    
    const positions = createParticlesFromImage(loadedImageData, {
        spacing: debugObject.spacing,
        scale: debugObject.scale
    })
    
    particles.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
    )
    particles.geometry.attributes.position.needsUpdate = true
}

gui.add(debugObject, 'spacing').min(1).max(20).step(1).name('Spacing').onChange(updateParticles)

// Scale
debugObject.scale = 3
gui.add(debugObject, 'scale').min(0.1).max(10).step(0.1).name('Scale').onChange(updateParticles)

// Particles size
gui.add(particles.material.uniforms.uSize, 'value').min(0.01).max(0.1).step(0.01).name('Size').onChange(updateParticles)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    particles.material.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render normal scene
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()