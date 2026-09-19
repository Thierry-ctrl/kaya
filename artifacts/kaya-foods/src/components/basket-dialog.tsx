import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBasket } from "@/hooks/use-basket";
import { resolveStorefrontImage, useStorefront } from "@/hooks/use-storefront";
import { 
  populateBasketItems, 
  calculateBasketTotal, 
  formatRWF, 
  generateOrderSummary, 
  generateWhatsAppLink,
  isValidWhatsAppNumber
} from "@/lib/basket";
import { Minus, Plus, Trash2, Copy, Send } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { en } from "@/content/en";

export function BasketDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { items, updateQuantity, removeItem, storageError } = useBasket();
  const { products, settings } = useStorefront();
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);
  const [copyFallback, setCopyFallback] = useState("");

  const populatedItems = useMemo(() => {
    try {
      return populateBasketItems(items, products);
    } catch (e) {
      console.error("Error populating basket", e);
      return [];
    }
  }, [items, products]);

  const total = useMemo(() => calculateBasketTotal(populatedItems), [populatedItems]);

  const handleCopySummary = async () => {
    setIsCopying(true);
    setCopyFallback("");
    const summary = generateOrderSummary(populatedItems, total, settings.deliveryFee);
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API not available");
      }
      await navigator.clipboard.writeText(summary);
      toast({
        title: en.basket.copied,
      });
    } catch (err) {
      setCopyFallback(summary);
    } finally {
      setIsCopying(false);
    }
  };

  const handleWhatsApp = () => {
    if (!isValidWhatsAppNumber(settings.whatsappNumber) || !populatedItems.length) return;
    const summary = generateOrderSummary(populatedItems, total, settings.deliveryFee);
    const link = generateWhatsAppLink(summary, settings.whatsappNumber);
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const isWaValid = isValidWhatsAppNumber(settings.whatsappNumber);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-none sm:rounded-xl">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">{en.basket.title}</DialogTitle>
          <DialogDescription>
            {en.basket.description}
          </DialogDescription>
          {storageError && (
             <div className="mt-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
               {storageError}
             </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {populatedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70 py-12">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                <Trash2 size={32} className="text-muted-foreground" />
              </div>
              <p className="text-lg">{en.basket.empty}</p>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {en.basket.continueShopping}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {populatedItems.map((item) => (
                <div key={`${item.productId}-${item.sizeId}`} className="flex gap-4 items-start">
                  <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center p-2">
                    {item.product.imageUrl ? (
                      <img 
                         src={resolveStorefrontImage(item.product.imageUrl)}
                        alt={item.product.altText}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-[10px] text-muted-foreground uppercase opacity-50">{en.products.imagePlaceholder}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{item.size.label}</p>
                    <div className="font-medium">{formatRWF(item.lineTotal)}</div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-20">
                    <button 
                      onClick={() => removeItem(item.productId, item.sizeId)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors -mr-2 -mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      aria-label={en.basket.remove}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-center gap-3 bg-muted rounded-full px-2 py-1">
                      <button 
                        onClick={() => updateQuantity(item.productId, item.sizeId, item.quantity - 1)}
                        className="p-1 hover:bg-background rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={en.basket.decrease}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.sizeId, item.quantity + 1)}
                        disabled={item.quantity >= 99}
                        className="p-1 hover:bg-background rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={en.basket.increase}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {populatedItems.length > 0 && (
          <div className="border-t bg-muted/30 p-6 space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>{en.basket.subtotal}</span>
              <span>{formatRWF(total)}</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
               {settings.deliveryFee || en.basket.deliveryConfirmedOnWa}
            </p>
            
            <div className="space-y-3 pt-2">
              <Button 
                className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                size="lg" 
                variant="accent"
                onClick={handleWhatsApp}
                disabled={!isWaValid}
              >
                <Send className="mr-2 h-5 w-5" />
                {en.basket.orderOnWa}
              </Button>
              {!isWaValid && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded-md text-center">
                  {en.basket.waAwaitingSetup}
                </p>
              )}
              
              <Button 
                className="w-full bg-foreground text-background hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                size="lg"
                onClick={handleCopySummary}
                disabled={isCopying}
              >
                <Copy className="mr-2 h-5 w-5" />
                {isCopying ? en.basket.copied : en.basket.copySummary}
              </Button>
              
              {copyFallback && (
                <div className="mt-2 flex flex-col gap-2 animate-in fade-in zoom-in-95">
                  <p className="text-sm text-destructive">{en.basket.copyFailed}</p>
                  <textarea 
                    readOnly 
                    className="w-full h-32 p-2 text-xs border rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-background text-foreground"
                    value={copyFallback}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-primary/5 text-primary text-xs rounded-md border border-primary/20 text-center leading-relaxed font-medium">
              {en.basket.mustPressSend}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
