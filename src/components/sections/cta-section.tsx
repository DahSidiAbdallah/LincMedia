"use client";

import { Button } from "@/components/ui/button";
import AnimatedWrapper from '@/components/ui/animated-wrapper';
import React, { useState } from 'react';
import BookModal from '@/components/ui/book-modal';

const CtaSection = () => {
  const [open, setOpen] = useState(false);
  return (
    <section className="py-20 md:py-32 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <AnimatedWrapper>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            READY TO CAPTURE
            <br />
            YOUR NEXT MOMENT?
          </h2>
          <div>
            <Button variant="secondary" size="lg" className="mt-8" onClick={() => setOpen(true)}>Let's Work Together</Button>
            <BookModal open={open} onClose={() => setOpen(false)}>
              <h2 className="text-3xl font-bold mb-2">Contact</h2>
              <p className="mb-4 text-muted-foreground">Let's work together!</p>
              <form className="space-y-4">
                <input type="text" placeholder="Your Name" className="w-full border rounded px-3 py-2" />
                <input type="email" placeholder="Your Email" className="w-full border rounded px-3 py-2" />
                <textarea placeholder="Your Message" className="w-full border rounded px-3 py-2" rows={4} />
                <Button type="submit" variant="default">Send</Button>
              </form>
            </BookModal>
          </div>
        </AnimatedWrapper>
      </div>
    </section>
  );
};

export default CtaSection;
