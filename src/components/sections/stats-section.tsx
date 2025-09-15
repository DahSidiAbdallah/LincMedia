"use client";

import Image from 'next/image';
import AnimatedWrapper from '@/components/ui/animated-wrapper';
import { Button } from '../ui/button';
import React, { useState } from 'react';
import BookModal from '@/components/ui/book-modal';

const StatsSection = () => {
  const [open, setOpen] = useState(false);
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
            <AnimatedWrapper>
                <div className="grid grid-cols-2 gap-8">
                    <div className="col-span-2">
                        <Image
                        src="https://picsum.photos/800/500?random=7"
                        alt="Camera lens details"
                        data-ai-hint="camera lens"
                        width={800}
                        height={500}
                        className="object-cover w-full h-auto"
                        />
                    </div>
                    <div>
                        <Image
                        src="https://picsum.photos/400/500?random=8"
                        alt="Photographer in action"
                        data-ai-hint="photographer action"
                        width={400}
                        height={500}
                        className="object-cover w-full h-auto"
                        />
                    </div>
                    <div>
                        <Image
                        src="https://picsum.photos/400/500?random=9"
                        alt="Vintage camera"
                        data-ai-hint="vintage camera"
                        width={400}
                        height={500}
                        className="object-cover w-full h-auto"
                        />
                    </div>
                </div>
            </AnimatedWrapper>
            <AnimatedWrapper delay="200ms">
              <div>
                <h2 className="text-2xl font-semibold mb-6">My approach to photography is designed to make your journey from concept to final print as smooth and enjoyable as possible.</h2>
                <div className="space-y-6 text-muted-foreground">
                  <p>
                    With a clear, collaborative process, I prioritize your unique vision. At every step, I&apos;ll keep you informed, inspired, and involved in bringing your story to life.
                  </p>
                  <p>
                    Our platform&apos;s core is built on a foundation of smart automation.
                  </p>
                </div>
                <Button variant="outline" className="mt-8" onClick={() => setOpen(true)}>My Process</Button>
                <BookModal open={open} onClose={() => setOpen(false)}>
                  <p>Discover how our platform&apos;s capabilities empower businesses to scale faster.</p>
                  <p className="mb-4 text-muted-foreground">How I work with clients</p>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Consultation & Vision</li>
                    <li>Planning & Preparation</li>
                    <li>Shooting Day</li>
                    <li>Editing & Delivery</li>
                  </ul>
                  <p>Here you can describe your process in detail, so clients know what to expect. (Replace with real content.)</p>
                </BookModal>
              </div>
            </AnimatedWrapper>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
