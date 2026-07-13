import React, { useEffect, useMemo, useState } from 'react'
import styles from './HeroCarousel.module.css'

const slides = [
  {
    id: 'fractional',
    eyebrow: 'Fractional shares',
    title: ['Build conviction', 'with smaller steps'],
    copy: 'Start with future-ready ideas, flexible allocations, and a calm, guided experience.',
    visual: 'cube',
  },
  {
    id: 'usstocks',
    eyebrow: 'US stocks',
    title: ['Follow the market', 'without the noise'],
    copy: 'Track movers, compare sectors, and see clean signals in one premium workspace.',
    visual: 'tiles',
  },
  {
    id: 'portfolio',
    eyebrow: 'Portfolio tracking',
    title: ['See every move', 'with confidence'],
    copy: 'Visual portfolio snapshots, daily performance, and smart celebrations keep you in sync.',
    visual: 'portfolio',
  },
  {
    id: 'screeners',
    eyebrow: 'Smart screeners',
    title: ['Search ideas', 'before the crowd does'],
    copy: 'Filter by momentum, quality, valuation, and risk with fluid, elegant controls.',
    visual: 'screen',
  },
]

function SlideVisual({ variant }) {
  if (variant === 'cube') {
    return (
      <div className={styles.cubeScene} aria-hidden="true">
        <div className={styles.cubeRing} />
        <div className={styles.cube}>
          <span className={styles.face} />
          <span className={styles.face} />
          <span className={styles.face} />
        </div>
      </div>
    )
  }

  if (variant === 'tiles') {
    return (
      <div className={styles.tileScene} aria-hidden="true">
        <div className={styles.tileOrb} />
        <div className={styles.tileCardPrimary}>
          <span className={styles.tileLabel}>Momentum</span>
          <strong>+12.4%</strong>
        </div>
        <div className={styles.tileCardSecondary}>
          <span className={styles.tileLabel}>Screened</span>
          <strong>24 names</strong>
        </div>
        <div className={styles.tileCardTertiary}>
          <span className={styles.tileLabel}>Watch</span>
          <strong>7 alerts</strong>
        </div>
      </div>
    )
  }

  if (variant === 'portfolio') {
    return (
      <div className={styles.portfolioScene} aria-hidden="true">
        <div className={styles.ring}>
          <div className={styles.ringInner}>
            <span>84%</span>
            <small>Growth</small>
          </div>
        </div>
        <div className={styles.portfolioCard}>\n          <span className={styles.tileLabel}>Cash</span>
          <strong>₹1.24L</strong>
        </div>
        <div className={styles.portfolioCardSecondary}>\n          <span className={styles.tileLabel}>Equity</span>
          <strong>₹8.6L</strong>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.screenScene} aria-hidden="true">
      <div className={styles.screenPanel}>
        <span className={styles.tileLabel}>Filters</span>
        <div className={styles.screenRow} />
        <div className={styles.screenRowWide} />
        <div className={styles.screenBars}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}

export default function HeroCarousel({ onPrimaryClick, onSecondaryClick }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeSlide = useMemo(() => slides[activeIndex], [activeIndex])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [])

  const goToSlide = (index) => setActiveIndex(index)

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)
    }
  }

  return (
    <section className={styles.heroShell} aria-label="Featured investing highlights">
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.heroAmbient} aria-hidden="true">
        <span className={styles.ambientDot} />
        <span className={styles.ambientDot} />
        <span className={styles.ambientDot} />
      </div>

      <div className={styles.copyColumn}>
        <div className={styles.eyebrow}>Research-led investing, reimagined</div>
        <h1>
          {activeSlide.title[0]}<br />
          {activeSlide.title[1]}
        </h1>
        <p>{activeSlide.copy}</p>

        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={onPrimaryClick}>
            Get Started
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={onSecondaryClick}>
            Explore platform
          </button>
        </div>

        <div className={styles.trustRow}>
          <span>SEBI learning context</span>
          <span>Zero-friction onboarding</span>
          <span>Secure by design</span>
        </div>

        <div className={styles.indicators} role="tablist" aria-label="Hero slides">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to ${slide.eyebrow} slide`}
              aria-selected={index === activeIndex}
              role="tab"
            />
          ))}
        </div>
      </div>

      <div className={styles.visualColumn} onKeyDown={handleKeyDown} tabIndex={0}>
        <div className={styles.visualFrame}>
          <div className={styles.visualBadge}>{activeSlide.eyebrow}</div>
          <SlideVisual variant={activeSlide.visual} />
        </div>
      </div>
    </section>
  )
}
