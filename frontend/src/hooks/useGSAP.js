/**
 * Reusable GSAP animation hooks
 * - useFadeUp: fade + translate-up on mount
 * - useStagger: stagger animate a list of elements
 * - useCountUp: animate a number counting up
 * - useScrollReveal: reveal on scroll via ScrollTrigger
 */
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ── Fade up on mount ── */
export function useFadeUp(deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'all' }
      )
    }, ref)
    return () => ctx.revert()
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return ref
}

/* ── Stagger children on mount ── */
export function useStagger(selector = '[data-stagger]', deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      const els = ref.current.querySelectorAll(selector)
      if (!els.length) return
      gsap.fromTo(els,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.07, clearProps: 'all' }
      )
    }, ref)
    return () => ctx.revert()
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return ref
}

/* ── Count-up number animation ── */
export function useCountUp(target, duration = 1.2, deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current || typeof target !== 'number') return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        { val: 0 },
        { val: target, duration, ease: 'power2.out',
          onUpdate: function () { if (ref.current) ref.current.textContent = Math.round(this.targets()[0].val).toLocaleString('en-IN') }
        }
      )
    })
    return () => ctx.revert()
  }, [target, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps
  return ref
}

/* ── Scroll-triggered reveal ── */
export function useScrollReveal(deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'all',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 88%',
            once: true,
          }
        }
      )
    }, ref)
    return () => ctx.revert()
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return ref
}

/* ── Nav link hover timeline ── */
export function useNavHover() {
  const ref = useRef(null)
  const tl  = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    tl.current = gsap.timeline({ paused: true })
      .to(el, { scaleX: 1.04, duration: 0.18, ease: 'power1.out' })
    const enter = () => tl.current?.play()
    const leave = () => tl.current?.reverse()
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mouseenter', enter); el.removeEventListener('mouseleave', leave); tl.current?.kill() }
  }, [])
  return ref
}

/* ── Card hover lift ── */
export function useCardHover() {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const enter = () => gsap.to(el, { y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', duration: 0.22, ease: 'power2.out' })
    const leave = () => gsap.to(el, { y: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', duration: 0.22, ease: 'power2.out' })
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mouseenter', enter); el.removeEventListener('mouseleave', leave) }
  }, [])
  return ref
}

/* ── Price flash (green/red on value change) ── */
export function usePriceFlash(value, isUp) {
  const ref  = useRef(null)
  const prev = useRef(value)
  useEffect(() => {
    if (!ref.current || value === prev.current) return
    prev.current = value
    const color = isUp ? '#00B386' : '#E84040'
    const ctx = gsap.context(() => {
      gsap.timeline()
        .to(ref.current, { color, scale: 1.04, duration: 0.18, ease: 'power2.out' })
        .to(ref.current, { color: '#1E2636', scale: 1, duration: 0.4, ease: 'power2.inOut' })
    }, ref)
    return () => ctx.revert()
  }, [value])
  return ref
}
