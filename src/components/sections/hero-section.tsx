"use client";
import AnimatedWrapper from '@/components/ui/animated-wrapper';
import Image from 'next/image';

const HeroSection = () => {
  return (
    <section className="relative h-screen flex flex-col justify-end overflow-hidden bg-background pb-16">
      <div className="absolute inset-0">
        <video
          src="/20250904_1048_Scenic%20Journey%20Visuals_simple_compose_01k4a5e9fpenqr6wt3t93x998e.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ position: 'absolute', inset: 0 }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
  <div className="relative z-10 container mx-auto px-4 md:px-6">
          <div className="max-w-4xl">
            <AnimatedWrapper>
              <p className="text-lg text-primary-foreground/80 mb-4">
                We create images and videos that do more than just exist; <br />
                We are your partner in audio visual communications
              </p>
            </AnimatedWrapper>
             <AnimatedWrapper delay="200ms">
                <h1 className="text-5xl md:text-8xl font-bold text-primary-foreground leading-tight">
                    CAPTURING
                </h1>
             </AnimatedWrapper>
             <AnimatedWrapper delay="400ms">
                <h1 className="text-5xl md:text-8xl font-bold text-primary-foreground leading-tight">
                    MOMENTS & STORIES
                </h1>
             </AnimatedWrapper>
          </div>
          {/* subtle caption overlay: title + year + credit */}
          <div className="absolute left-6 bottom-8 bg-black/40 backdrop-blur-sm text-white rounded-md px-4 py-2 text-sm flex items-center gap-3">
            <div className="font-semibold">CAPTURING MOMENTS &amp; STORIES</div>
            <div className="opacity-80">·</div>
            <div className="opacity-80">2025</div>
            <div className="opacity-70">— Linc Media</div>
          </div>
      </div>
    </section>
  );
};

export default HeroSection;
