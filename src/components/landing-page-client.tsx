"use client";

import type { FC } from 'react';
import React, { useRef, useEffect, useState } from 'react';

import Header from '@/components/layout/header';
import HeroSection from '@/components/sections/hero-section';
import AboutSection from '@/components/sections/about-section';
import ProductShowcase from '@/components/sections/product-showcase';
import StatsSection from '@/components/sections/stats-section';
import CtaSection from '@/components/sections/cta-section';
import Footer from '@/components/layout/footer';
import { optimizeScrollTransitions, type OptimizeScrollTransitionsOutput } from '@/ai/flows/optimize-scroll-transitions';

const LandingPageClient: FC = () => {
  const [transitionSpeeds, setTransitionSpeeds] = useState<OptimizeScrollTransitionsOutput>([]);

  const sectionRefs = {
    hero: useRef<HTMLDivElement>(null),
    about: useRef<HTMLDivElement>(null),
    works: useRef<HTMLDivElement>(null),
    process: useRef<HTMLDivElement>(null),
    contact: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    const getSpeeds = async () => {
      const sectionDetails = [
        { sectionName: 'hero', contentDescription: 'Large background image with headline text.', elementCount: 4, averageElementComplexity: 8 },
        { sectionName: 'about', contentDescription: 'Text-heavy section with one image.', elementCount: 5, averageElementComplexity: 5 },
        { sectionName: 'works', contentDescription: 'Grid of 6 project images with titles.', elementCount: 15, averageElementComplexity: 7 },
        { sectionName: 'process', contentDescription: 'Image collage and descriptive text.', elementCount: 6, averageElementComplexity: 6 },
        { sectionName: 'contact', contentDescription: 'Large call-to-action text and a button.', elementCount: 2, averageElementComplexity: 3 },
      ];
      try {
        const speeds = await optimizeScrollTransitions({ sectionDetails });
        setTransitionSpeeds(speeds);
      } catch (error) {
        console.error("Error optimizing scroll transitions:", error);
        // Fallback to default speeds
        setTransitionSpeeds(
          sectionDetails.map(s => ({ sectionName: s.sectionName, suggestedTransitionSpeed: 1000, reasoning: 'fallback' }))
        );
      }
    };
    getSpeeds();
  }, []);

  const smoothScroll = (targetPosition: number, duration: number) => {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = ease(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    const ease = (t: number, b: number, c: number, d: number) => {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    };

    requestAnimationFrame(animation);
  };
  
  const scrollToSection = (sectionName: keyof typeof sectionRefs) => {
    const ref = sectionRefs[sectionName];
    const speedConfig = transitionSpeeds.find(s => s.sectionName === sectionName);
    const duration = speedConfig?.suggestedTransitionSpeed || 1000;
    
    if (ref.current) {
      const targetPosition = ref.current.offsetTop;
      smoothScroll(targetPosition, duration);
    }
  };

  return (
    <div className="bg-background text-foreground">
      <Header scrollToSection={scrollToSection} />
      <main>
        <div id="hero" ref={sectionRefs.hero}><HeroSection /></div>
        <div id="about" ref={sectionRefs.about}><AboutSection /></div>
        <div id="works" ref={sectionRefs.works}><ProductShowcase /></div>
        <div id="process" ref={sectionRefs.process}><StatsSection /></div>
        <div id="contact" ref={sectionRefs.contact}><CtaSection /></div>
      </main>
      <Footer scrollToSection={scrollToSection} />
    </div>
  );
};

export default LandingPageClient;
