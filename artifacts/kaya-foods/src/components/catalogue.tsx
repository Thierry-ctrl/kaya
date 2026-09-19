import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import type { Product } from "@/data/products";
import { useStorefront, resolveStorefrontImage } from "@/hooks/use-storefront";
import { useBasket } from "@/hooks/use-basket";
import { formatRWF } from "@/lib/basket";
import { en } from "@/content/en";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const preferredCategories = ["Jam", "Juices", "Chilli", "Tomato Paste"];
const knownCopy: Record<string, string> = {
  Jam: en.products.categories.jam,
  Juices: en.products.categories.juices,
  Chilli: en.products.categories.chilli,
  "Tomato Paste": en.products.categories.tomatoPaste,
};

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function Catalogue() {
  const { products } = useStorefront();
  const categories = [
    ...preferredCategories,
    ...products.map(product => product.category).filter(category => !preferredCategories.includes(category)),
  ].filter((category, index, all) => all.indexOf(category) === index);

  if (!categories.length) {
    return <p className="rounded-3xl bg-secondary/10 p-10 text-center font-bold text-foreground/70">No products are published yet. Please check back soon.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map(category => (
        <CategoryCard
          key={category}
          category={category}
          products={products.filter(product => product.category === category)}
        />
      ))}
    </div>
  );
}

function CategoryCard({ category, products }: { category: string; products: Product[] }) {
  const available = products.filter(product => product.availability === "available" && product.sizes.length > 0);
  const representative = available[0] ?? products[0];
  const canExplore = available.length > 0;
  const card = (
    <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border-2 border-secondary/15 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-2xl" data-testid={`card-category-${slug(category)}`}>
      <div className="relative aspect-square overflow-hidden bg-secondary/5 p-6">
        {!canExplore && (
          <div className="absolute right-4 top-4 z-10">
            <Badge className="border-none bg-destructive px-3 py-1.5 text-xs font-bold text-foreground shadow-lg">
              {products.length ? en.products.comingSoon : en.products.unavailable}
            </Badge>
          </div>
        )}
        {representative?.imageUrl ? (
          <img src={resolveStorefrontImage(representative.imageUrl)} alt={representative.altText} width={900} height={900} loading="lazy" className="h-full w-full object-contain drop-shadow-md transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="flex h-full items-center justify-center text-center text-sm font-bold uppercase tracking-widest text-foreground/40">{en.products.imagePlaceholder}</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-7">
        <h3 className="mb-3 text-2xl font-black leading-tight text-foreground">{category}</h3>
        <p className="mb-7 flex-1 text-base font-medium leading-relaxed text-foreground/70">
          {knownCopy[category] ?? representative?.shortDescription ?? "More products will be added to this category soon."}
        </p>
        {canExplore && (
          <DialogTrigger asChild>
            <Button size="lg" className="w-full rounded-full font-black shadow-lg shadow-primary/20" data-testid={`button-explore-${slug(category)}`}>
              {en.products.exploreOptions}
            </Button>
          </DialogTrigger>
        )}
      </div>
    </article>
  );

  if (!canExplore) return card;
  return (
    <Dialog>
      {card}
      <CategoryDialog category={category} products={products} />
    </Dialog>
  );
}

function CategoryDialog({ category, products }: { category: string; products: Product[] }) {
  const { settings } = useStorefront();
  const showsSampleNotice = products.some(product => product.isSample) && settings.illustrationNotice.trim();
  return (
    <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-4xl grid-rows-none flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-h-[calc(100dvh-3rem)]">
      <DialogHeader className="shrink-0 border-b border-secondary/20 px-5 py-5 pr-14 text-left sm:px-7">
        <DialogTitle className="text-2xl font-black text-foreground sm:text-3xl">Choose from {category}</DialogTitle>
        <DialogDescription className="mt-2 text-sm font-medium leading-relaxed text-foreground/70">
          {en.products.jamDialogDescription}
        </DialogDescription>
        {showsSampleNotice && <p className="text-xs font-bold leading-relaxed text-foreground/60">{settings.illustrationNotice}</p>}
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7">
        <div className="space-y-5">{products.map(product => <ProductOption key={product.id} product={product} />)}</div>
      </div>
      <DialogFooter className="shrink-0 border-t border-secondary/20 bg-background px-4 py-3 sm:px-7">
        <DialogClose asChild><Button variant="outline" className="w-full rounded-full font-bold sm:w-auto">{en.products.continueBrowsing}</Button></DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

function ProductOption({ product }: { product: Product }) {
  const { addItem } = useBasket();
  const canOrder = product.availability === "available" && product.sizes.length > 0;
  const [selectedSizeId, setSelectedSizeId] = useState(canOrder ? product.sizes[0]?.id ?? "" : "");
  const [quantity, setQuantity] = useState(1);
  const [confirmation, setConfirmation] = useState("");
  useEffect(() => {
    if (!product.sizes.some(size => size.id === selectedSizeId)) setSelectedSizeId(canOrder ? product.sizes[0]?.id ?? "" : "");
  }, [canOrder, product.sizes, selectedSizeId]);
  const selectedSize = product.sizes.find(size => size.id === selectedSizeId);

  const handleAdd = () => {
    if (!selectedSize || !canOrder) return;
    addItem(product.id, selectedSize.id, quantity);
    setConfirmation(en.products.addedConfirmation.replace("{quantity}", String(quantity)).replace("{product}", product.name).replace("{size}", selectedSize.label));
    setQuantity(1);
  };

  return (
    <article className={`rounded-2xl border-2 border-secondary/15 bg-card p-4 sm:p-5 ${canOrder ? "" : "opacity-65"}`} data-testid={`card-product-option-${product.id}`}>
      <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
        <div className="aspect-square overflow-hidden rounded-xl bg-secondary/5 p-3">
          {product.imageUrl ? <img src={resolveStorefrontImage(product.imageUrl)} alt={product.altText} width={900} height={900} loading="lazy" className="h-full w-full object-contain drop-shadow-sm" /> : null}
        </div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-black text-foreground">{product.name}</h3>
            {!canOrder && <Badge variant="secondary">{en.products.unavailable}</Badge>}
          </div>
          <p className="mt-1 text-sm font-medium leading-relaxed text-foreground/70">{product.shortDescription}</p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`${product.name} ${en.products.sizeLabel}`}>
            {product.sizes.map(size => (
              <button key={size.id} type="button" disabled={!canOrder} onClick={() => { setSelectedSizeId(size.id); setConfirmation(""); }} aria-pressed={selectedSizeId === size.id} className={`rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all disabled:cursor-not-allowed ${selectedSizeId === size.id ? "border-primary bg-primary text-primary-foreground" : "border-secondary/20 text-foreground/70"}`}>
                {size.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-secondary/20 py-3">
            <span className="text-xs font-black uppercase tracking-widest text-foreground/60">{en.products.quantity}</span>
            <div className="flex items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/10 p-1">
              <button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} disabled={!canOrder || quantity <= 1} className="rounded-lg p-2 disabled:opacity-50" aria-label={`${en.basket.decrease}: ${product.name}`}><Minus size={16} /></button>
              <span className="w-8 text-center font-black">{quantity}</span>
              <button type="button" onClick={() => setQuantity(value => Math.min(99, value + 1))} disabled={!canOrder || quantity >= 99} className="rounded-lg p-2 disabled:opacity-50" aria-label={`${en.basket.increase}: ${product.name}`}><Plus size={16} /></button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-2xl font-black">{selectedSize ? formatRWF(selectedSize.price * quantity) : "—"}</div>
            <Button type="button" onClick={handleAdd} disabled={!canOrder || !selectedSize} className="rounded-full px-5 font-black"><ShoppingBag className="mr-2 h-5 w-5" />{en.products.add}</Button>
          </div>
          <div role="status" aria-live="polite" className={confirmation ? "mt-4 rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold" : "sr-only"}>{confirmation}</div>
        </div>
      </div>
    </article>
  );
}