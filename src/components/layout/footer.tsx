type FooterProps = {
    scrollToSection: (section: 'hero' | 'about' | 'works' | 'process' | 'contact') => void;
  };

const Footer = ({ scrollToSection }: FooterProps) => {
    return (
        <footer className="bg-background py-16">
            <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-3 gap-8 text-muted-foreground">
                <div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">Linc</h3>
                    <p>&copy; {new Date().getFullYear()}. All rights reserved.</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Navigate</h3>
                    <nav className="flex flex-col gap-2">
                        <button onClick={() => scrollToSection('hero')} className="text-left hover:text-foreground">Home</button>
                        <button onClick={() => scrollToSection('works')} className="text-left hover:text-foreground">Portfolio</button>
                        <button onClick={() => scrollToSection('about')} className="text-left hover:text-foreground">About</button>
                        <button onClick={() => scrollToSection('process')} className="text-left hover:text-foreground">Process</button>
                    </nav>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Social</h3>
                    <div className="flex items-center gap-3">
                        <a href="https://www.instagram.com/lincchevie" target="_blank" rel="noreferrer" aria-label="Instagram" className="p-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17.5 6.5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </a>
                        <a href="https://www.linkedin.com/company/lincmedia/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="p-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M4 4h4v16H4zM6 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM14 10v10h4v-6c0-3-4-2.5-4 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </a>
                        <a href="https://www.youtube.com/@lincmedia495" target="_blank" rel="noreferrer" aria-label="YouTube" className="p-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M22 7.2a2.4 2.4 0 0 0-1.7-1.7C18.4 5 12 5 12 5s-6.4 0-8.3.5A2.4 2.4 0 0 0 2 7.2 24 24 0 0 0 2 12a24 24 0 0 0 0 4.8 2.4 2.4 0 0 0 1.7 1.7C5.6 19 12 19 12 19s6.4 0 8.3-.5a2.4 2.4 0 0 0 1.7-1.7A24 24 0 0 0 22 12a24 24 0 0 0 0-4.8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 15l5-3-5-3v6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </a>
                        <a href="https://x.com/lchevi3" target="_blank" rel="noreferrer" aria-label="X" className="p-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M23 3.5c-.8.3-1.6.5-2.5.6.9-.6 1.6-1.5 2-2.7-.8.5-1.7.9-2.7 1.1C18 1 16.7.5 15.3.5c-2.2 0-4 1.8-4 4 0 .3 0 .6.1.9C7.6 5.1 4.1 3.1 1.7.4c-.3.6-.4 1.2-.4 1.9 0 1.4.7 2.7 1.9 3.4-.7 0-1.3-.2-1.8-.5 0 2 1.4 3.7 3.3 4.1-.5.1-1 .2-1.6.1.5 1.6 2 2.8 3.7 2.8C6 17 3.6 18 1 18c2.1 1.4 4.6 2.2 7.3 2.2 8.8 0 13.6-7.3 13.6-13.6v-.6c.9-.7 1.6-1.5 2.2-2.5-.8.4-1.6.7-2.5.8z" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </a>
                        <a href="https://www.tumblr.com/lincchevie" target="_blank" rel="noreferrer" aria-label="Tumblr" className="p-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M17 3h-3c-.6 0-1 .4-1 1v3c0 .6-.4 1-1 1H9v3c0 1.7.9 2.9 3 3 0 0 2 0 3-1v3c0 1.1-.9 2-2 2h-1c-3 0-5-2.2-5-5V9H5V6h3V4c0-2.2 1.8-4 4-4h2v3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </a>
                        <a href="https://www.facebook.com/lincchevie" target="_blank" rel="noreferrer" aria-label="Facebook" className="p-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-3h2.4V9.3c0-2.4 1.4-3.7 3.5-3.7 1 0 2 .2 2 .2v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4V12H19l-.5 3h-2.5v7A10 10 0 0 0 22 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
