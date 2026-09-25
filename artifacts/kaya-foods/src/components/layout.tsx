import { Link } from "wouter";
import { useBasket } from "@/hooks/use-basket";
import { BasketDialog } from "@/components/basket-dialog";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { en } from "@/content/en";
import { resolveStorefrontImage, useStorefront } from "@/hooks/use-storefront";
import { splitTagline } from "@/lib/tagline";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { settings } = useStorefront();
  const { totalItemsCount } = useBasket();
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const taglineLines = splitTagline(settings.description);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-accent selection:text-accent-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground">
        Skip to main content
      </a>
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-foreground/10 bg-foreground/95 backdrop-blur supports-[backdrop-filter]:bg-foreground/90 text-background">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={en.header.toggleMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md p-1 -m-1">
              {settings.logoUrl ? (
                <img
                  src={resolveStorefrontImage(settings.logoUrl)}
                  alt={settings.name}
                  className="h-9 md:h-11 w-auto object-contain"
                />
              ) : <span className="text-xl font-black text-background">{settings.name}</span>}
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#products" className="text-sm font-bold text-background/80 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md p-1">{en.header.products}</a>
            <a href="#story" className="text-sm font-bold text-background/80 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md p-1">{en.header.story}</a>
            <a href="#how-to-order" className="text-sm font-bold text-background/80 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md p-1">{en.header.howToOrder}</a>
          </nav>

          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="relative rounded-full h-10 px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent border-background/20 bg-foreground text-background hover:bg-background/10 hover:text-accent transition-colors"
              onClick={() => setIsBasketOpen(true)}
            >
              <ShoppingBag size={18} className="mr-2" />
              <span className="font-bold">{en.header.basket}</span>
              {totalItemsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-accent text-accent-foreground border-none font-bold">
                  {totalItemsCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div id="mobile-nav" className="md:hidden border-t border-background/10 bg-foreground p-4 flex flex-col gap-4">
            <a 
              href="#products" 
              className="text-lg font-bold text-background p-2 rounded-md hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {en.header.products}
            </a>
            <a 
              href="#story" 
              className="text-lg font-bold text-background p-2 rounded-md hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {en.header.story}
            </a>
            <a 
              href="#how-to-order" 
              className="text-lg font-bold text-background p-2 rounded-md hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {en.header.howToOrder}
            </a>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16 md:py-20 mt-auto border-t-8 border-primary relative overflow-hidden">
        {/* Subtle decorative monogram in footer background */}
        {settings.logoUrl && <img
          src={resolveStorefrontImage(settings.logoUrl)}
          alt=""
          className="absolute -right-10 -bottom-10 h-64 opacity-5 pointer-events-none object-contain"
        />}
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md mb-6">
              {settings.logoUrl ? (
                <img
                  src={resolveStorefrontImage(settings.logoUrl)}
                  alt={settings.name}
                  className="h-20 w-auto object-contain"
                />
              ) : <span className="text-2xl font-black">{settings.name}</span>}
            </Link>
            <p className="max-w-md leading-tight">
              {taglineLines.map((line, index) => (
                <span key={line} className={`block ${index === 0 ? "text-base font-medium text-background/70" : "mt-1 text-xl font-black text-background"}`}>{line}</span>
              ))}
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-xl mb-6 text-accent">{en.footer.contact}</h3>
            <ul className="space-y-4 text-background/90 font-medium">
              <li>{settings.contactEmail ? <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> : <span>Email: {en.footer.pending}</span>}</li>
              <li>{settings.contactPhone ? <a href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a> : <span>Phone: {en.footer.pending}</span>}</li>
              <li>{settings.openingHours || <span>Hours: {en.footer.pending}</span>}</li>
              <li className="pt-2 flex gap-4">
                {settings.socialLinks.instagram ? (
                  <a href={settings.socialLinks.instagram} className="hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm font-bold">Instagram</a>
                ) : (
                  <span className="opacity-50">Instagram {en.footer.pending}</span>
                )}
                {settings.socialLinks.facebook ? (
                  <a href={settings.socialLinks.facebook} className="hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm font-bold">Facebook</a>
                ) : null}
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-xl mb-6 text-accent">{en.footer.ordering}</h3>
            <ul className="space-y-4 text-background/90 font-medium">
              <li>{en.footer.delivery} <span className="text-background">{settings.deliveryAreas || en.footer.pending}</span></li>
              <li>Fee: <span className="text-background">{settings.deliveryFee || en.footer.pending}</span></li>
              <li>{en.footer.payment} <span className="text-background">{settings.paymentMethods || en.footer.pending}</span></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-16 pt-8 border-t border-background/10 text-background/50 text-sm font-medium relative z-10">
           &copy; {new Date().getFullYear()} {settings.name}. All rights reserved.
        </div>
      </footer>

      <BasketDialog open={isBasketOpen} onOpenChange={setIsBasketOpen} />
    </div>
  );
}
