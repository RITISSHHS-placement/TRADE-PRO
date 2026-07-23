import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function ParticleBackground({ 
  theme = 'dark', 
  particleCount = 2000,
  connectionDistance = 150,
  mouseInteraction = true 
}) {
  const containerRef = useRef(null)
  const mouse = useRef({ x: 0, y: 0 })
  const isDark = theme === 'dark'

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight

    const bgColor = isDark ? 0x09090b : 0xffffff
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(bgColor)
    scene.fog = new THREE.FogExp2(bgColor, 0.001)

    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 2000)
    camera.position.z = 500

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colorData = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities = new Float32Array(particleCount * 3)

    const colorPalette = [
      new THREE.Color(0x6366f1),
      new THREE.Color(0x8b5cf6),
      new THREE.Color(0x22c55e),
      new THREE.Color(0x06b6d4),
    ]

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * w
      positions[i * 3 + 1] = (Math.random() - 0.5) * h
      positions[i * 3 + 2] = (Math.random() - 0.5) * 500

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      colorData[i * 3] = color.r
      colorData[i * 3 + 1] = color.g
      colorData[i * 3 + 2] = color.b

      sizes[i] = Math.random() * 3 + 1

      velocities[i * 3] = (Math.random() - 0.5) * 0.5
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorData, 3))
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const particlesMaterial = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particles)

    // Create connection lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: isDark ? 0x6366f1 : 0x4f46e5,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    })

    const lineGeometry = new THREE.BufferGeometry()
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lines)

    // Mouse interaction
    let mouseSphere = null
    if (mouseInteraction) {
      const sphereGeometry = new THREE.SphereGeometry(50, 32, 32)
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
      })
      mouseSphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      mouseSphere.visible = false
      scene.add(mouseSphere)
    }

    // Animation
    let raf
    let time = 0

    const animate = () => {
      time += 0.01

      const posArray = particlesGeometry.attributes.position.array
      const linePositions = []

      // Update particle positions
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3

        // Apply velocity
        posArray[i3] += velocities[i3]
        posArray[i3 + 1] += velocities[i3 + 1]
        posArray[i3 + 2] += velocities[i3 + 2]

        // Mouse interaction
        if (mouseInteraction) {
          const dx = posArray[i3] - mouse.current.x * (w / 2)
          const dy = posArray[i3 + 1] - -mouse.current.y * (h / 2)
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 150) {
            const force = (150 - dist) / 150
            velocities[i3] += (dx / dist) * force * 0.5
            velocities[i3 + 1] += (dy / dist) * force * 0.5
          }
        }

        // Boundary check
        if (posArray[i3] > w / 2) velocities[i3] *= -1
        if (posArray[i3] < -w / 2) velocities[i3] *= -1
        if (posArray[i3 + 1] > h / 2) velocities[i3 + 1] *= -1
        if (posArray[i3 + 1] < -h / 2) velocities[i3 + 1] *= -1
        if (posArray[i3 + 2] > 250) velocities[i3 + 2] *= -1
        if (posArray[i3 + 2] < -250) velocities[i3 + 2] *= -1

        // Damping
        velocities[i3] *= 0.99
        velocities[i3 + 1] *= 0.99
        velocities[i3 + 2] *= 0.99

        // Find connections
        for (let j = i + 1; j < particleCount; j++) {
          const j3 = j * 3
          const dx = posArray[i3] - posArray[j3]
          const dy = posArray[i3 + 1] - posArray[j3 + 1]
          const dz = posArray[i3 + 2] - posArray[j3 + 2]
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (dist < connectionDistance) {
            linePositions.push(
              posArray[i3], posArray[i3 + 1], posArray[i3 + 2],
              posArray[j3], posArray[j3 + 1], posArray[j3 + 2]
            )
          }
        }
      }

      particlesGeometry.attributes.position.array = posArray
      particlesGeometry.attributes.position.needsUpdate = true

      // Update lines
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))

      // Rotate entire system slowly
      particles.rotation.y = time * 0.05
      particles.rotation.x = Math.sin(time * 0.03) * 0.1
      lines.rotation.y = time * 0.05
      lines.rotation.x = Math.sin(time * 0.03) * 0.1

      // Update mouse sphere
      if (mouseSphere && mouseInteraction) {
        mouseSphere.position.set(
          mouse.current.x * (w / 2),
          -mouse.current.y * (h / 2),
          0
        )
        mouseSphere.visible = Math.abs(mouse.current.x) > 0.1 || Math.abs(mouse.current.y) > 0.1
      }

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }

    animate()

    // Mouse handler
    const onMove = (e) => {
      const rect = container.getBoundingClientRect()
      mouse.current.x = ((e.clientX - rect.left) / w) * 2 - 1
      mouse.current.y = -((e.clientY - rect.top) / h) * 2 + 1
    }

    if (mouseInteraction) {
      container.addEventListener('mousemove', onMove, { passive: true })
    }

    // Resize handler
    const onResize = () => {
      const cw = container.clientWidth
      const ch = container.clientHeight
      camera.aspect = cw / ch
      camera.updateProjectionMatrix()
      renderer.setSize(cw, ch)
    }

    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      if (mouseInteraction) {
        container.removeEventListener('mousemove', onMove)
      }
      window.removeEventListener('resize', onResize)
      if (container && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }
      particlesGeometry.dispose()
      particlesMaterial.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
      renderer.dispose()
    }
  }, [theme, particleCount, connectionDistance, mouseInteraction])

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: -1,
        pointerEvents: 'none'
      }} 
    />
  )
}
