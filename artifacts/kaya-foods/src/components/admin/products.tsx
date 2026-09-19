import { useState } from "react";
import { 
  useGetAdminProducts, 
  useCreateAdminProduct,
  useUpdateAdminProduct,
  useDeleteAdminProduct,
  getGetAdminProductsQueryKey,
  ProductInputCategory,
  ProductInputAvailability,
  type ProductSize
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "./image-upload";
import { Plus, Pencil, Trash2, X, PlusCircle, ArrowLeft, Loader2, Save, BadgeCheck, AlertCircle, EyeOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export function ProductsAdmin() {
  const { data: products, isPending, error, refetch } = useGetAdminProducts({
    query: { queryKey: getGetAdminProductsQueryKey() }
  });
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);

  if (isPending) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-black text-primary">Products</h1>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !products) return <div role="alert" className="p-8"><p>Unable to load products.</p><Button className="mt-4" onClick={() => void refetch()}>Try again</Button></div>;

  if (editingId) {
    const product = editingId === 'new' ? null : products?.find(p => p.id === editingId);
    if (editingId !== 'new' && !product) {
      setEditingId(null);
      return null;
    }
    return <ProductEditor product={product} onBack={() => setEditingId(null)} />;
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary">Products</h1>
          <p className="text-muted-foreground mt-2">Manage catalogue items, pricing, and availability.</p>
        </div>
        <Button onClick={() => setEditingId('new')} className="rounded-full shadow-sm flex-shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {!products?.length ? (
        <div className="text-center p-12 bg-muted/30 rounded-3xl border border-dashed border-border">
          <p className="text-muted-foreground mb-4">No products found.</p>
          <Button onClick={() => setEditingId('new')} variant="outline">Create your first product</Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(product => (
            <div 
              key={product.id} 
              className={`group flex flex-col bg-card rounded-2xl border ${product.published ? 'border-border shadow-sm' : 'border-dashed border-muted-foreground/30 opacity-75'} overflow-hidden transition-all hover:border-primary/40`}
            >
              <div className="aspect-[4/3] bg-muted relative border-b border-border/50">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.altText} className="w-full h-full object-cover p-4" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <EyeOff className="w-8 h-8 opacity-20" />
                  </div>
                )}
                
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {!product.published && (
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur border-dashed shadow-sm">Draft</Badge>
                  )}
                  {product.isSample && (
                    <Badge variant="outline" className="bg-accent/90 text-accent-foreground backdrop-blur border-accent-foreground/20 shadow-sm">Sample</Badge>
                  )}
                </div>
                
                <div className="absolute top-3 right-3">
                  {product.availability === 'available' ? (
                    <Badge className="bg-primary/90 hover:bg-primary shadow-sm">In Stock</Badge>
                  ) : product.availability === 'coming_soon' ? (
                    <Badge variant="secondary" className="bg-background/90 shadow-sm">Coming Soon</Badge>
                  ) : (
                    <Badge variant="outline" className="border-destructive text-destructive bg-destructive/5 shadow-sm">Out of Stock</Badge>
                  )}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs font-bold tracking-wider text-primary/70 uppercase mb-1">{product.category.replace('_', ' ')}</div>
                <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-1 text-foreground">{product.name}</h3>
                
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground">
                    {product.sizes.length} size{product.sizes.length !== 1 ? 's' : ''}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 text-primary group-hover:bg-primary/10 transition-colors"
                    onClick={() => setEditingId(product.id)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductEditor({ product, onBack }: { product: any, onBack: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createProduct = useCreateAdminProduct();
  const updateProduct = useUpdateAdminProduct();
  const deleteProduct = useDeleteAdminProduct();

  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || ProductInputCategory.Jam,
    shortDescription: product?.shortDescription || '',
    imageUrl: product?.imageUrl || '',
    altText: product?.altText || '',
    availability: product?.availability || ProductInputAvailability.available,
    sizes: product?.sizes ? [...product.sizes] : [] as ProductSize[],
    isSample: product?.isSample || false,
    published: product?.published ?? true,
  });

  const isSaving = createProduct.isPending || updateProduct.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.sizes.length === 0) {
      toast({ title: "Validation Error", description: "At least one size is required.", variant: "destructive" });
      return;
    }
    
    // Check for duplicate size IDs
    const sizeIds = formData.sizes.map(s => s.id);
    if (new Set(sizeIds).size !== sizeIds.length) {
      toast({ title: "Validation Error", description: "Size IDs must be unique within the product.", variant: "destructive" });
      return;
    }

    try {
      if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          data: { ...formData, version: product.version }
        });
        toast({ title: "Product Updated", description: "Changes saved successfully." });
      } else {
        await createProduct.mutateAsync({
          data: formData
        });
        toast({ title: "Product Created", description: "New product added to catalogue." });
      }
      
      queryClient.invalidateQueries({ queryKey: getGetAdminProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["/api/storefront"] });
      onBack();
    } catch (error: any) {
      if (error?.status === 409) {
        toast({ title: "Version Conflict", description: "This product was modified elsewhere. Please go back and try again.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error?.data?.error || "Could not save product.", variant: "destructive" });
      }
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    try {
      await deleteProduct.mutateAsync({
        id: product.id,
        params: { version: product.version }
      });
      toast({ title: "Product Deleted", description: "Removed from catalogue." });
      queryClient.invalidateQueries({ queryKey: getGetAdminProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["/api/storefront"] });
      onBack();
    } catch (error: any) {
      toast({ title: "Error", description: error?.data?.error || "Could not delete product.", variant: "destructive" });
    }
  };

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { id: '', label: '', price: 0 }]
    }));
  };

  const updateSize = (index: number, field: keyof ProductSize, value: string | number) => {
    setFormData(prev => {
      const newSizes = [...prev.sizes];
      newSizes[index] = { ...newSizes[index], [field]: value };
      return { ...prev, sizes: newSizes };
    });
  };

  const removeSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto pb-32">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-black text-primary flex-1">
          {product ? 'Edit Product' : 'New Product'}
        </h1>
        {product && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete <strong>{product.name}</strong> from your catalogue.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Yes, delete product
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-sm space-y-8">
          
          {/* Status Switches */}
          <div className="flex flex-wrap gap-8 p-4 bg-muted/40 rounded-2xl border border-border">
            <div className="flex items-center gap-3">
              <Switch 
                checked={formData.published}
                onCheckedChange={(v) => setFormData(p => ({ ...p, published: v }))}
                id="published"
              />
              <div className="grid gap-0.5">
                <Label htmlFor="published" className="text-base font-bold">Published</Label>
                <p className="text-xs text-muted-foreground">Visible on storefront</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Switch 
                checked={formData.isSample}
                onCheckedChange={(v) => setFormData(p => ({ ...p, isSample: v }))}
                id="sample"
              />
              <div className="grid gap-0.5">
                <Label htmlFor="sample" className="text-base font-bold text-accent-foreground">Mark as Sample</Label>
                <p className="text-xs text-muted-foreground">Forces zero price, special category</p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-base">Product Name</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                required
                className="text-lg bg-background"
                placeholder="e.g. Tree Tomato Jam"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-base">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v: ProductInputCategory) => setFormData(p => ({ ...p, category: v }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ProductInputCategory).map(([k, v]) => (
                    <SelectItem key={k} value={v}>{v.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base">Short Description</Label>
            <Textarea 
              value={formData.shortDescription} 
              onChange={e => setFormData(p => ({ ...p, shortDescription: e.target.value }))}
              required
              rows={3}
              className="resize-none bg-background text-base"
              placeholder="What makes this product special?"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-base">Product Image</Label>
              <ImageUpload 
                value={formData.imageUrl} 
                onChange={v => setFormData(p => ({ ...p, imageUrl: v }))}
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-base">Availability</Label>
              <Select 
                value={formData.availability} 
                onValueChange={(v: ProductInputAvailability) => setFormData(p => ({ ...p, availability: v }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available (In Stock)</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  <SelectItem value="unavailable">Unavailable (Out of Stock)</SelectItem>
                </SelectContent>
              </Select>

              <div className="pt-4 space-y-3">
                <Label className="text-base">Image Alt Text (Accessibility)</Label>
                <Input 
                  value={formData.altText} 
                  onChange={e => setFormData(p => ({ ...p, altText: e.target.value }))}
                  className="bg-background"
                  placeholder="Describe the image"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Label className="text-xl font-bold block text-foreground">Sizes & Pricing</Label>
                <p className="text-sm text-muted-foreground mt-1">At least one size variant is required. Use stable IDs (e.g. '300g').</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addSize} className="rounded-full">
                <PlusCircle className="w-4 h-4 mr-2" /> Add Size
              </Button>
            </div>
            
            {formData.sizes.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-destructive/30 rounded-xl bg-destructive/5 text-destructive font-medium">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No sizes defined. Product cannot be saved.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.sizes.map((size, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-muted/30 border border-border rounded-xl group">
                    <div className="w-full sm:w-1/4 space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Stable ID</Label>
                      <Input 
                        value={size.id} 
                        onChange={e => updateSize(index, 'id', e.target.value)}
                        placeholder="e.g. 300g"
                        required
                        className="bg-background"
                        disabled={!!product} // Disable changing ID if editing
                      />
                    </div>
                    <div className="w-full sm:w-1/3 space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Display Label</Label>
                      <Input 
                        value={size.label} 
                        onChange={e => updateSize(index, 'label', e.target.value)}
                        placeholder="e.g. 300g Jar"
                        required
                        className="bg-background"
                      />
                    </div>
                    <div className="w-full sm:w-1/4 space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Price (RWF)</Label>
                      <Input 
                        type="number"
                        min="0"
                        value={size.price} 
                        onChange={e => updateSize(index, 'price', parseInt(e.target.value) || 0)}
                        required
                        disabled={formData.isSample}
                        className="bg-background"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeSize(index)}
                      className="mt-6 sm:mt-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Sticky action bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur-md border-t border-border flex justify-end gap-3 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:pr-8">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            className="rounded-full px-6"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="rounded-full px-8 shadow-md"
            disabled={isSaving}
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Product</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}