"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { openExternal } from '@/lib/openExternal';

type HeaderProps = {
  scrollToSection: (section: 'hero' | 'about' | 'works' | 'process' | 'contact') => void;
};

const Header = ({ scrollToSection }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobilePanelRef = useRef<HTMLDialogElement | null>(null);
  const mobileToggleRef = useRef<HTMLButtonElement | null>(null);

  // Close mobile menu helper
  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    // restore focus back to toggle after close for accessibility
    requestAnimationFrame(() => {
      mobileToggleRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll lock while mobile menu open (avoids making entire body inert which blocked clicks)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    if (mobileOpen) {
      const prev = body.style.overflow;
      body.style.overflow = 'hidden';
      return () => { body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  return (
    <header
      data-scrolled={isScrolled ? 'true' : 'false'}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out',
        isScrolled
          ? 'bg-neutral-900/90 supports-[backdrop-filter]:backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className={cn(
        "container mx-auto flex items-center justify-between px-4 md:px-6 transition-all duration-300 ease-in-out",
        isScrolled ? "h-16" : "h-20"
      )}>
        <button className="flex items-center gap-3" onClick={() => scrollToSection('hero')} aria-label="Go to top">
          <Image
            src="/LINC.png"
            alt="LincMedia"
            width={120}
            height={56}
            priority
            className={cn(
              'w-auto h-14 md:h-16 object-contain transition-all select-none pointer-events-none',
              isScrolled
                ? 'brightness-110 contrast-125 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]'
                : 'brightness-95'
            )}
          />
        </button>
        {/* mobile menu button - visible on very small screens */}
        <button
          ref={mobileToggleRef}
          className={cn('md:hidden ml-2 p-2 rounded transition-colors text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/60')}
          onClick={() => setMobileOpen(s => !s)}
          aria-label="Toggle menu"
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
  <nav className="hidden md:flex items-center gap-4">
          <Button variant="link" className={cn(isScrolled ? 'text-white' : 'text-white drop-shadow')} onClick={() => scrollToSection('about')}>About</Button>
          <Button variant="link" className={cn(isScrolled ? 'text-white' : 'text-white drop-shadow')} onClick={() => scrollToSection('works')}>Portfolio</Button>
          <Button variant="link" className={cn(isScrolled ? 'text-white' : 'text-white drop-shadow')} onClick={() => scrollToSection('process')}>Process</Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className={cn(
                  'transition-colors',
                  isScrolled
                    ? 'bg-white text-neutral-900 hover:bg-neutral-100 shadow-sm'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800'
                )}
              >
                Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contact Linc Media</DialogTitle>
                <DialogDescription>Send a message and we&apos;ll get back to you.</DialogDescription>
              </DialogHeader>
              <form className="grid gap-2 mt-2">
                <input placeholder="Name" className="border p-2 rounded" />
                <input placeholder="Email" className="border p-2 rounded" />
                <textarea placeholder="Message" className="border p-2 rounded" />
                <DialogFooter>
                  <Button type="submit">Send</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <div className="hidden sm:flex items-center gap-2 ml-2">
            {/* social icons (hidden on very small screens) - high contrast when unscrolled */}
            <button type="button" title="Instagram" onClick={() => openExternal(undefined, 'https://www.instagram.com/lincchevie')} aria-label="Instagram" className={cn('p-1 rounded-full transition-all', isScrolled ? 'text-white hover:bg-white/10' : 'text-white ring-1 ring-white/20 bg-black/20') }>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17.5 6.5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button type="button" title="LinkedIn" onClick={() => openExternal(undefined, 'https://www.linkedin.com/company/lincmedia/')} aria-label="LinkedIn" className={cn('p-1 rounded-full transition-all', isScrolled ? 'text-white hover:bg-white/10' : 'text-white ring-1 ring-white/20 bg-black/20') }>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="currentColor"><path d="M4 4h4v16H4zM6 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM14 10v10h4v-6c0-3-4-2.5-4 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button type="button" title="YouTube" onClick={() => openExternal(undefined, 'https://www.youtube.com/@lincmedia495')} aria-label="YouTube" className={cn('p-1 rounded-full transition-all', isScrolled ? 'text-white hover:bg-white/10' : 'text-white ring-1 ring-white/20 bg-black/20') }>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="currentColor"><path d="M22 7.2a2.4 2.4 0 0 0-1.7-1.7C18.4 5 12 5 12 5s-6.4 0-8.3.5A2.4 2.4 0 0 0 2 7.2 24 24 0 0 0 2 12a24 24 0 0 0 0 4.8 2.4 2.4 0 0 0 1.7 1.7C5.6 19 12 19 12 19s6.4 0 8.3-.5a2.4 2.4 0 0 0 1.7-1.7A24 24 0 0 0 22 12a24 24 0 0 0 0-4.8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 15l5-3-5-3v6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button type="button" title="X" onClick={() => openExternal(undefined, 'https://x.com/lchevi3')} aria-label="X" className={cn('p-1 rounded-full transition-all', isScrolled ? 'text-white hover:bg-white/10' : 'text-white ring-1 ring-white/20 bg-black/20') }>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="currentColor"><path d="M23 3.5c-.8.3-1.6.5-2.5.6.9-.6 1.6-1.5 2-2.7-.8.5-1.7.9-2.7 1.1C18 1 16.7.5 15.3.5c-2.2 0-4 1.8-4 4 0 .3 0 .6.1.9C7.6 5.1 4.1 3.1 1.7.4c-.3.6-.4 1.2-.4 1.9 0 1.4.7 2.7 1.9 3.4-.7 0-1.3-.2-1.8-.5 0 2 1.4 3.7 3.3 4.1-.5.1-1 .2-1.6.1.5 1.6 2 2.8 3.7 2.8C6 17 3.6 18 1 18c2.1 1.4 4.6 2.2 7.3 2.2 8.8 0 13.6-7.3 13.6-13.6v-.6c.9-.7 1.6-1.5 2.2-2.5-.8.4-1.6.7-2.5.8z" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button type="button" title="Tumblr" onClick={() => openExternal(undefined, 'https://www.tumblr.com/lincchevie')} aria-label="Tumblr" className={cn('p-1 rounded-full transition-all', isScrolled ? 'text-white hover:bg-white/10' : 'text-white ring-1 ring-white/20 bg-black/20') }>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="currentColor"><path d="M17 3h-3c-.6 0-1 .4-1 1v3c0 .6-.4 1-1 1H9v3c0 1.7.9 2.9 3 3 0 0 2 0 3-1v3c0 1.1-.9 2-2 2h-1c-3 0-5-2.2-5-5V9H5V6h3V4c0-2.2 1.8-4 4-4h2v3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button type="button" title="Facebook" onClick={() => openExternal(undefined, 'https://www.facebook.com/lincchevie')} aria-label="Facebook" className={cn('p-1 rounded-full transition-all', isScrolled ? 'text-white hover:bg-white/10' : 'text-white ring-1 ring-white/20 bg-black/20') }>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-3h2.4V9.3c0-2.4 1.4-3.7 3.5-3.7 1 0 2 .2 2 .2v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4V12H19l-.5 3h-2.5v7A10 10 0 0 0 22 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          {/* mobile menu button */}
          {/* duplicate mobile toggle inside nav removed (now only one toggle) */}
        </nav>
        {/* mobile menu drawer */}
        {mobileOpen && (
          <div
            role="presentation"
            className="md:hidden fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-[2px] animate-fadeIn"
            onClick={(e) => { if (e.target === e.currentTarget) closeMobile(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); closeMobile(); } }}
            tabIndex={-1}
          >
            <dialog
              ref={mobilePanelRef}
              open
              className="mt-20 w-full max-w-md bg-background/95 backdrop-blur-sm rounded-b-lg shadow-lg p-6 mx-4 transform transition-all duration-300 ease-out opacity-100 translate-y-0 focus:outline-none [&::backdrop]:hidden"
              aria-labelledby="mobile-menu-heading"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-2" id="mobile-menu-heading">
                <h2 className="text-sm tracking-wide uppercase font-semibold text-muted-foreground">Menu</h2>
                <button
                  onClick={closeMobile}
                  aria-label="Close menu"
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              <div className="flex flex-col gap-3 pb-4 border-b border-border">
                <button className="text-left text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/60 rounded" onClick={() => { closeMobile(); scrollToSection('about'); }}>About</button>
                <button className="text-left text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/60 rounded" onClick={() => { closeMobile(); scrollToSection('works'); }}>Portfolio</button>
                <button className="text-left text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/60 rounded" onClick={() => { closeMobile(); scrollToSection('process'); }}>Process</button>
                <button className="text-left text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/60 rounded" onClick={() => { closeMobile(); scrollToSection('contact'); }}>Contact</button>
              </div>
              <div className="pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Follow</p>
                <div className="grid grid-cols-6 gap-2">
                  {/* Social icon buttons */}
                  <button type="button" title="Instagram" onClick={() => openExternal(undefined, 'https://www.instagram.com/lincchevie')} aria-label="Instagram" className='p-2 rounded-md flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10'>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17.5 6.5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button type="button" title="LinkedIn" onClick={() => openExternal(undefined, 'https://www.linkedin.com/company/lincmedia/')} aria-label="LinkedIn" className='p-2 rounded-md flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10'>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h4v16H4zM6 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM14 10v10h4v-6c0-3-4-2.5-4 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button type="button" title="YouTube" onClick={() => openExternal(undefined, 'https://www.youtube.com/@lincmedia495')} aria-label="YouTube" className='p-2 rounded-md flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10'>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 7.2a2.4 2.4 0 0 0-1.7-1.7C18.4 5 12 5 12 5s-6.4 0-8.3.5A2.4 2.4 0 0 0 2 7.2 24 24 0 0 0 2 12a24 24 0 0 0 0 4.8 2.4 2.4 0 0 0 1.7 1.7C5.6 19 12 19 12 19s6.4 0 8.3-.5a2.4 2.4 0 0 0 1.7-1.7A24 24 0 0 0 22 12a24 24 0 0 0 0-4.8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 15l5-3-5-3v6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button type="button" title="X" onClick={() => openExternal(undefined, 'https://x.com/lchevi3')} aria-label="X" className='p-2 rounded-md flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10'>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 3.5c-.8.3-1.6.5-2.5.6.9-.6 1.6-1.5 2-2.7-.8.5-1.7.9-2.7 1.1C18 1 16.7.5 15.3.5c-2.2 0-4 1.8-4 4 0 .3 0 .6.1.9C7.6 5.1 4.1 3.1 1.7.4c-.3.6-.4 1.2-.4 1.9 0 1.4.7 2.7 1.9 3.4-.7 0-1.3-.2-1.8-.5 0 2 1.4 3.7 3.3 4.1-.5.1-1 .2-1.6.1.5 1.6 2 2.8 3.7 2.8C6 17 3.6 18 1 18c2.1 1.4 4.6 2.2 7.3 2.2 8.8 0 13.6-7.3 13.6-13.6v-.6c.9-.7 1.6-1.5 2.2-2.5-.8.4-1.6.7-2.5.8z" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button type="button" title="Tumblr" onClick={() => openExternal(undefined, 'https://www.tumblr.com/lincchevie')} aria-label="Tumblr" className='p-2 rounded-md flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10'>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 3h-3c-.6 0-1 .4-1 1v3c0 .6-.4 1-1 1H9v3c0 1.7.9 2.9 3 3 0 0 2 0 3-1v3c0 1.1-.9 2-2 2h-1c-3 0-5-2.2-5-5V9H5V6h3V4c0-2.2 1.8-4 4-4h2v3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button type="button" title="Facebook" onClick={() => openExternal(undefined, 'https://www.facebook.com/lincchevie')} aria-label="Facebook" className='p-2 rounded-md flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10'>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-3h2.4V9.3c0-2.4 1.4-3.7 3.5-3.7 1 0 2 .2 2 .2v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4V12H19l-.5 3h-2.5v7A10 10 0 0 0 22 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </dialog>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
