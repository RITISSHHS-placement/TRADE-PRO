import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'

export default function MarketSentiment3D({ theme = 'dark', sentiment = 'neutral', intensity = 1 }) {
  const containerRef = useRef(null)
  const mouse = useRef({ x: 0, y: 0 })
  const isDark = theme === 'dark'

  const colors = useMemo(() => ({
    bull: isDark ? 0x00d084 : 0x059669,
    bear: isDark ? 0xff4d6a : 0xdc2626,
    neutral: isDark ? 0x7b61ff : 0x6366f1,
    bullGlow: isDark ? 0x00d084 : 0x10b981,
    bearGlow: isDark ? 0xff4d6a : 0xef4444,
    ground: isDark ? 0x0a0a12 : 0xf0f0f5,
    grid: isDark ? 0x2a2a3a : 0xe0e0e8,
  }), [isDark])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(colors.ground, 0.02)

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
    camera.position.set(0, 2.5, 6)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // ---- Ground plane with grid ----
    const groundGeo = new THREE.PlaneGeometry(40, 40)
    const groundMat = new THREE.MeshStandardMaterial({
      color: colors.ground,
      roughness: 0.9,
      metalness: 0.05,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Grid helper
    const grid = new THREE.GridHelper(40, 40, colors.grid, colors.grid)
    grid.material.opacity = 0.15
    grid.material.transparent = true
    grid.position.y = 0.02
    scene.add(grid)

    // ---- Build Bull (geometric, stylized) ----
    const bullGroup = new THREE.Group()
    
    // Body - elongated box with rounded edges
    const bodyGeo = new THREE.BoxGeometry(1.8, 1, 1.2)
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: colors.bull,
      metalness: 0.7,
      roughness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      emissive: colors.bull,
      emissiveIntensity: 0.1,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.set(0, 1.2, 0)
    body.castShadow = true
    bullGroup.add(body)

    // Head
    const headGeo = new THREE.BoxGeometry(0.8, 0.7, 0.9)
    const head = new THREE.Mesh(headGeo, bodyMat)
    head.position.set(-1.3, 1.7, 0)
    head.castShadow = true
    bullGroup.add(head)

    // Horns - two cones pointing forward and up
    const hornMat = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0xffd700 : 0xb8860b,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    })
    const hornGeo = new THREE.ConeGeometry(0.12, 0.5, 8)
    const horn1 = new THREE.Mesh(hornGeo, hornMat)
    horn1.rotation.x = -Math.PI / 3
    horn1.rotation.z = Math.PI / 6
    horn1.position.set(-1.55, 1.9, 0.35)
    horn1.castShadow = true
    bullGroup.add(horn1)

    const horn2 = new THREE.Mesh(hornGeo, hornMat)
    horn2.rotation.x = -Math.PI / 3
    horn2.rotation.z = -Math.PI / 6
    horn2.position.set(-1.55, 1.9, -0.35)
    horn2.castShadow = true
    bullGroup.add(horn2)

    // Legs - 4 cylinders
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 1.2, 8)
    const legMat = new THREE.MeshStandardMaterial({
      color: colors.bull,
      metalness: 0.5,
      roughness: 0.3,
    })
    const legPositions = [
      [-0.6, 0.6, 0.4], [0.6, 0.6, 0.4],
      [-0.6, 0.6, -0.4], [0.6, 0.6, -0.4],
    ]
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, legMat)
      leg.position.set(...pos)
      leg.castShadow = true
      bullGroup.add(leg)
    })

    // Tail
    const tailGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.6, 6)
    const tail = new THREE.Mesh(tailGeo, legMat)
    tail.position.set(1.1, 1.2, 0)
    tail.rotation.x = Math.PI / 4
    bullGroup.add(tail)

    bullGroup.position.set(-2.5, 0, 0)

    // ---- Build Bear (geometric, stylized) ----
    const bearGroup = new THREE.Group()
    
    // Body - larger, hunched
    const bearBodyGeo = new THREE.BoxGeometry(2, 1.1, 1.3)
    const bearBodyMat = new THREE.MeshPhysicalMaterial({
      color: colors.bear,
      metalness: 0.7,
      roughness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      emissive: colors.bear,
      emissiveIntensity: 0.1,
    })
    const bearBody = new THREE.Mesh(bearBodyGeo, bearBodyMat)
    bearBody.position.set(0, 1.3, 0)
    bearBody.castShadow = true
    bearGroup.add(bearBody)

    // Head - broader
    const bearHeadGeo = new THREE.BoxGeometry(0.9, 0.8, 1)
    const bearHead = new THREE.Mesh(bearHeadGeo, bearBodyMat)
    bearHead.position.set(1.4, 1.7, 0)
    bearHead.castShadow = true
    bearGroup.add(bearHead)

    // Ears
    const earGeo = new THREE.ConeGeometry(0.15, 0.3, 6)
    const earMat = new THREE.MeshStandardMaterial({ color: colors.bear, roughness: 0.3 })
    const ear1 = new THREE.Mesh(earGeo, earMat)
    ear1.rotation.x = -Math.PI / 2
    ear1.position.set(1.7, 2.1, 0.35)
    bearGroup.add(ear1)
    const ear2 = new THREE.Mesh(earGeo, earMat)
    ear2.rotation.x = -Math.PI / 2
    ear2.position.set(1.7, 2.1, -0.35)
    bearGroup.add(ear2)

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.4, 0.35, 0.5)
    const snout = new THREE.Mesh(snoutGeo, bearBodyMat)
    snout.position.set(1.85, 1.5, 0)
    bearGroup.add(snout)

    // Legs - thicker, hunched
    const bearLegGeo = new THREE.CylinderGeometry(0.15, 0.12, 1.1, 8)
    const bearLegPositions = [
      [-0.7, 0.55, 0.5], [0.7, 0.55, 0.5],
      [-0.7, 0.55, -0.5], [0.7, 0.55, -0.5],
    ]
    bearLegPositions.forEach(pos => {
      const leg = new THREE.Mesh(bearLegGeo, bearLegMat)
      leg.position.set(...pos)
      leg.castShadow = true
      bearGroup.add(leg)
    })

    bearGroup.position.set(2.5, 0, 0)

    // ---- Market Chart Pillars (background) ----
    const pillars = new THREE.Group()
    const pillarMat = new THREE.MeshPhysicalMaterial({
      color: colors.neutral,
      metalness: 0.6,
      roughness: 0.3,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      transparent: true,
      opacity: 0.6,
    })
    for (let i = 0; i < 12; i++) {
      const h = 0.5 + Math.random() * 3 * intensity
      const geo = new THREE.BoxGeometry(0.3, h, 0.3)
      const pillar = new THREE.Mesh(geo, pillarMat)
      pillar.position.set(
        (i % 4 - 1.5) * 2.5,
        h / 2,
        Math.floor(i / 4 - 1) * 2.5
      )
      pillar.castShadow = true
      pillars.add(pillar)
    }
    pillars.position.set(0, 0, -3)

    // ---- Candlestick particles floating ----
    const candleCount = 60
    const candleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08)
    const candleMats = [
      new THREE.MeshBasicMaterial({ color: colors.bull, transparent: true, opacity: 0.8 }),
      new THREE.MeshBasicMaterial({ color: colors.bear, transparent: true, opacity: 0.8 }),
      new THREE.MeshBasicMaterial({ color: colors.neutral, transparent: true, opacity: 0.6 }),
    ]
    const candles = []
    for (let i = 0; i < candleCount; i++) {
      const mat = candleMats[Math.floor(Math.random() * candleMats.length)]
      const candle = new THREE.Mesh(candleGeo, mat)
      candle.position.set(
        (Math.random() - 0.5) * 16,
        Math.random() * 6 + 1,
        (Math.random() - 0.5) * 10 - 2
      )
      candle.userData = {
        baseY: candle.position.y,
        speed: 0.005 + Math.random() * 0.01,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.01,
      }
      scene.add(candle)
      candles.push(candle)
    }

    // ---- Lights ----
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambient)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5)
    keyLight.position.set(5, 10, 7)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.camera.near = 1
    keyLight.shadow.camera.far = 30
    keyLight.shadow.camera.left = -10
    keyLight.shadow.camera.right = 10
    keyLight.shadow.camera.top = 10
    keyLight.shadow.camera.bottom = -10
    keyLight.shadow.bias = -0.001
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(colors.bull, 0.5)
    fillLight.position.set(-5, 5, -5)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(colors.bear, 0.4)
    rimLight.position.set(0, -5, -5)
    scene.add(rimLight)

    // Bull spotlight
    const bullSpot = new THREE.SpotLight(colors.bullGlow, 2)
    bullSpot.position.set(-2.5, 8, 2)
    bullSpot.target.position.set(-2.5, 1.2, 0)
    bullSpot.angle = Math.PI / 4
    bullSpot.penumbra = 0.5
    bullSpot.decay = 1.5
    bullSpot.distance = 20
    bullSpot.castShadow = true
    scene.add(bullSpot)
    scene.add(bullSpot.target)

    // Bear spotlight
    const bearSpot = new THREE.SpotLight(colors.bearGlow, 2)
    bearSpot.position.set(2.5, 8, 2)
    bearSpot.target.position.set(2.5, 1.3, 0)
    bearSpot.angle = Math.PI / 4
    bearSpot.penumbra = 0.5
    bearSpot.decay = 1.5
    bearSpot.distance = 20
    bearSpot.castShadow = true
    scene.add(bearSpot)
    scene.add(bearSpot.target)

    // ---- Animation ----
    let raf
    let time = 0
    const bullTargetRot = 0
    const bearTargetRot = 0

    const animate = () => {
      time += 0.01

      // Mouse parallax
      const targetX = mouse.current.y * 0.15
      const targetY = mouse.current.x * 0.15
      camera.position.x += (targetY - camera.position.x) * 0.02
      camera.position.y += (-targetX + 2.5 - camera.position.y) * 0.02
      camera.lookAt(0, 1.2, 0)

      // Bull animation - charging forward, head bob
      if (sentiment === 'bullish' || sentiment === 'neutral') {
        bullGroup.rotation.y = Math.sin(time * 0.5) * 0.08
        body.position.y = 1.2 + Math.sin(time * 2) * 0.03
        head.position.y = 1.7 + Math.sin(time * 2 + 0.3) * 0.02
        bullSpot.intensity = 2 + Math.sin(time * 1.5) * 0.3
      } else {
        bullGroup.rotation.y = 0
        body.position.y = 1.2
        head.position.y = 1.7
        bullSpot.intensity = 0.5
      }

      // Bear animation - defensive, growling
      if (sentiment === 'bearish' || sentiment === 'neutral') {
        bearGroup.rotation.y = -Math.sin(time * 0.4) * 0.08
        bearBody.position.y = 1.3 + Math.sin(time * 1.8) * 0.02
        bearHead.position.y = 1.7 + Math.sin(time * 1.8 + 0.5) * 0.03
        bearSpot.intensity = 2 + Math.sin(time * 1.3) * 0.3
      } else {
        bearGroup.rotation.y = 0
        bearBody.position.y = 1.3
        bearHead.position.y = 1.7
        bearSpot.intensity = 0.5
      }

      // Pillar pulse
      pillars.children.forEach((pillar, i) => {
        pillar.scale.y = 0.8 + Math.sin(time * 2 + i * 0.5) * 0.2 * intensity
        pillar.position.y = pillar.scale.y * (pillar.geometry.parameters.height / 2)
      })

      // Floating candles
      candles.forEach((candle, i) => {
        const d = candle.userData
        candle.position.y = d.baseY + Math.sin(time * d.speed * 100 + d.phase) * 0.3
        candle.position.x += d.drift
        candle.rotation.y += 0.01
        candle.rotation.x += 0.005
        if (candle.position.x > 8) candle.position.x = -8
        if (candle.position.x < -8) candle.position.x = 8
      })

      // Scene slow rotation
      scene.rotation.y = Math.sin(time * 0.1) * 0.02

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    // Mouse handler
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    // Resize
    const onResize = () => {
      if (!container) return
      const cw = container.clientWidth
      const ch = container.clientHeight
      camera.aspect = cw / ch
      camera.updateProjectionMatrix()
      renderer.setSize(cw, ch)
    }
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      if (container && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }
      // Dispose geometries and materials
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
      renderer.dispose()
    }
  }, [theme, sentiment, intensity])

  return <div ref={containerRef} className="market-3d-canvas" style={{ width: '100%', height: '100%' }} />
}