import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Catalogue } from "@/components/catalogue";
import { ArrowRight } from "lucide-react";
import { en } from "@/content/en";
import { resolveStorefrontImage, useStorefront } from "@/hooks/use-storefront";
import { splitTagline } from "@/lib/tagline";

export default function Home() {
  const { settings } = useStorefront();
  const taglineLines = splitTagline(settings.description);
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary py-20 md:py-28 lg:py-24">
        {/* Soft atmospheric glows using brand colors */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] bg-foreground/40 blur-[100px] rounded-full"></div>
        </div>
        
        <div className="container relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div className="text-center lg:text-left">
            <Badge className="mb-8 border border-accent/40 bg-foreground/20 px-6 py-2 text-sm font-bold uppercase tracking-[0.2em] text-accent shadow-lg backdrop-blur-md">
              {settings.heroBadge}
            </Badge>
            <h1 className="mb-8 text-5xl font-black leading-[1.02] tracking-tight text-primary-foreground md:text-7xl lg:text-7xl">
              {taglineLines.map((line, index) => (
                <span key={line} className={`block ${index === 1 ? "text-accent" : ""}`}>{line}</span>
              ))}
            </h1>
            <p className="mx-auto mb-12 max-w-2xl text-lg font-medium leading-relaxed text-primary-foreground/90 md:text-xl lg:mx-0">
              {settings.heroText}
            </p>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                size="lg"
                className="h-16 w-full rounded-full bg-accent px-10 text-lg font-bold text-accent-foreground shadow-xl transition-all hover:scale-105 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:w-auto"
                onClick={() => {
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {en.hero.exploreBtn}
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </div>
          </div>

          <figure className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="absolute -inset-3 rotate-2 rounded-[2.5rem] border-2 border-accent/50"></div>
            <div className="absolute -bottom-5 -right-5 h-28 w-28 rounded-full bg-accent/30 blur-2xl"></div>
            <img
              src="/images/landing/strawberry-jam-breakfast.webp"
              alt="Strawberry jam served with fresh strawberries and wholegrain bread in a bright kitchen"
              width={1597}
              height={2400}
              fetchPriority="high"
              className="relative aspect-[4/5] w-full rounded-[2rem] border-4 border-primary-foreground/10 object-cover object-[center_70%] shadow-2xl"
            />
            <figcaption className="absolute bottom-4 left-4 rounded-full bg-foreground/75 px-4 py-2 text-xs font-bold text-background backdrop-blur-md">
              Everyday pantry favourites
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-24 bg-background scroll-mt-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col items-center mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">{en.products.title}</h2>
            <p className="text-foreground/70 max-w-xl mb-8 text-lg font-medium">
              {en.products.subtitle}
            </p>
          </div>
          
          <Catalogue />
        </div>
      </section>

      {/* Our Story Section */}
      <section id="story" className="relative py-28 md:py-36 bg-foreground text-background overflow-hidden scroll-mt-20">
        {/* Large faint monogram background */}
        {settings.logoUrl && <img
          src={resolveStorefrontImage(settings.logoUrl)}
          alt=""
          className="absolute -right-20 top-1/2 -translate-y-1/2 h-[140%] opacity-[0.04] pointer-events-none object-contain"
        />}
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
            <div className="order-2 md:order-1 space-y-8">
              <h2 className="text-4xl md:text-6xl font-black text-accent mb-2">{settings.storyTitle}</h2>
              <div className="w-24 h-2 bg-primary rounded-full mb-10"></div>
              <p className="text-background/90 text-xl md:text-2xl leading-relaxed font-medium">
                {settings.storyParagraph1}
              </p>
              <p className="text-background/80 text-lg md:text-xl leading-relaxed">
                {settings.storyParagraph2}
              </p>
            </div>
            <div className="order-1 md:order-2">
              <figure className="relative">
                <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-xl"></div>
                {settings.storyImageUrl ? (
                  <img
                    src={resolveStorefrontImage(settings.storyImageUrl)}
                    alt={settings.storyImageAlt}
                    width={900}
                    height={900}
                    loading="lazy"
                    className="relative aspect-square w-full object-contain rounded-3xl border-4 border-primary/30 bg-background/5 shadow-2xl"
                  />
                ) : (
                  <div className="relative flex aspect-square items-center justify-center rounded-3xl border-4 border-primary/30 bg-background/5 text-background/60">
                    {en.story.imagePlaceholder}
                  </div>
                )}
                {settings.storyImageCaption && <figcaption className="mt-4 text-sm text-background/60 font-medium text-center uppercase tracking-widest">{settings.storyImageCaption}</figcaption>}
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-28 bg-accent text-accent-foreground text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiMwMDAiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        <div className="container mx-auto px-4 max-w-3xl relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">{en.comingSoon.title}</h2>
          <p className="text-accent-foreground/80 text-xl md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed">
            {en.comingSoon.subtitle}
          </p>
        </div>
      </section>

      {/* How to Order Section */}
      <section id="how-to-order" className="py-28 bg-background scroll-mt-20">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-20 text-foreground">{en.howToOrder.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
            <div className="hidden md:block absolute top-[48px] left-[15%] right-[15%] h-1 bg-secondary/20 z-0"></div>
            
            {[ 
              { title: en.howToOrder.step1Title, desc: en.howToOrder.step1Desc },
              { title: en.howToOrder.step2Title, desc: en.howToOrder.step2Desc },
              { title: en.howToOrder.step3Title, desc: en.howToOrder.step3Desc }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center relative z-10 group">
                <div className="w-24 h-24 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-3xl font-black mb-8 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform duration-300 border-4 border-background">
                  {i + 1}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">{step.title}</h3>
                <p className="text-foreground/70 text-lg font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-24 inline-flex flex-col items-center bg-secondary/10 p-10 md:p-12 rounded-[2rem] max-w-2xl mx-auto border border-secondary/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
            <h4 className="font-black text-2xl mb-4 text-foreground uppercase tracking-wide">{en.howToOrder.deliveryInfo}</h4>
            <p className="text-foreground/80 mb-8 text-xl font-medium">
              {en.howToOrder.deliveryTo} <span className="font-bold text-primary">{settings.deliveryAreas || en.footer.pending}</span>.
            </p>
            <p className="text-foreground/70 text-base bg-background px-6 py-3 rounded-full font-bold shadow-sm border border-secondary/10">
              {en.howToOrder.paymentVia} <span className="text-destructive">{settings.paymentMethods || en.footer.pending}</span> {en.howToOrder.uponConfirmation}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
