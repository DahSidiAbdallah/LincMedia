"use client";

import Image from 'next/image';
import AnimatedWrapper from '@/components/ui/animated-wrapper';
import { Button } from '../ui/button';
import React, { useState } from 'react';
import BookModal from '@/components/ui/book-modal';

const AboutSection = () => {
  const [open, setOpen] = useState(false);
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <AnimatedWrapper>
            <div>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                STORIES
                <br />
                THROUGH LENS
              </h2>
              <div className="space-y-6 text-muted-foreground max-w-md">
                <p>
                  My approach to photography is to make your moments last a lifetime. I build a collaborative relationship to create the images you&apos;ve always envisioned.
                </p>
                <p>
                  I am a dedicated photographer who believes in the power of a single frame. I create images that are not only beautiful but also authentic and emotional.
                </p>
              </div>
              <div>
                <Button variant="outline" className="mt-8" onClick={() => setOpen(true)}>More About Me</Button>
                <BookModal open={open} onClose={() => setOpen(false)}>
                  <h2 className="text-3xl font-bold mb-2">About Me</h2>
                  <p className="mb-4 text-muted-foreground">Photographer, Storyteller, Creative</p>
                  <p>
                    Here you can add more detailed information about yourself, your journey, philosophy, and what makes your photography unique. (Replace with real content.)
                  </p>
                </BookModal>
              </div>
            </div>
          </AnimatedWrapper>
          <AnimatedWrapper delay="200ms">
            <Image
              src="https://picsum.photos/800/1000?random=10"
              alt="Photographer portrait"
              data-ai-hint="photographer portrait"
              width={800}
              height={1000}
              className="object-cover w-full h-auto"
            />
          </AnimatedWrapper>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
