import { useState, useRef, useEffect } from "react";
import { 
  useGetAdminSettings, 
  useUpdateAdminSettings,
  getGetAdminSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "./image-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";

export function SettingsAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: settings, isPending: loadingSettings, error: settingsError, refetch } = useGetAdminSettings({
    query: { queryKey: getGetAdminSettingsQueryKey() }
  });
  const updateSettings = useUpdateAdminSettings();

  const [formData, setFormData] = useState<any>(null);
  const isDirty = useRef(false);

  useEffect(() => {
    if (settings && !isDirty.current) {
      setFormData({
        ...settings
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    isDirty.current = true;
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (network: string, value: string) => {
    isDirty.current = true;
    setFormData((prev: any) => ({ 
      ...prev, 
      socialLinks: { ...prev.socialLinks, [network]: value } 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      const updated = await updateSettings.mutateAsync({
        data: formData
      });
      
      queryClient.setQueryData(getGetAdminSettingsQueryKey(), updated);
      isDirty.current = false;
      
      toast({
        title: "Settings Saved",
        description: "Your shop settings have been updated successfully.",
      });
      
      // Also invalidate storefront so public site gets new settings
      queryClient.invalidateQueries({ queryKey: ["/api/storefront"] });
      
    } catch (error: any) {
      if (error?.status === 409) {
        toast({
          title: "Version Conflict",
          description: "Someone else modified settings recently. Please refresh and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error?.data?.error || "Could not save settings.",
          variant: "destructive"
        });
      }
    }
  };

  if (loadingSettings) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-black text-primary">Settings</h1>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!formData) return <div role="alert" className="p-8"><p>{settingsError ? "Unable to load shop settings." : "Shop settings are not available."}</p><Button className="mt-4" onClick={() => void refetch()}>Try again</Button></div>;

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary">Shop Settings</h1>
          <p className="text-muted-foreground mt-2">Manage shop details, story, and contact info.</p>
        </div>
        <Button 
          type="submit" 
          disabled={updateSettings.isPending || !isDirty.current} 
          className="rounded-full shadow-sm"
        >
          {updateSettings.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle>Brand & Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Shop Name</Label>
            <Input 
              value={formData.name} 
              onChange={e => handleChange('name', e.target.value)} 
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <ImageUpload 
              value={formData.logoUrl} 
              onChange={v => handleChange('logoUrl', v)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Shop tagline (homepage heading)</Label>
            <Textarea 
              value={formData.description} 
              onChange={e => handleChange('description', e.target.value)} 
              className="resize-none"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Hero Badge (Small tag above title)</Label>
            <Input 
              value={formData.heroBadge} 
              onChange={e => handleChange('heroBadge', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Hero introduction (text below heading)</Label>
            <Textarea 
              value={formData.heroText} 
              onChange={e => handleChange('heroText', e.target.value)} 
              className="font-serif text-lg"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle>Contact & Ordering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>WhatsApp Number</Label>
              <Input 
                value={formData.whatsappNumber} 
                onChange={e => handleChange('whatsappNumber', e.target.value)} 
                placeholder="250781234567"
              />
              <p className="text-xs text-muted-foreground">International format, digits only</p>
            </div>
            <div className="space-y-2">
              <Label>Contact Phone (Display)</Label>
              <Input 
                value={formData.contactPhone} 
                onChange={e => handleChange('contactPhone', e.target.value)} 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contact Email</Label>
            <Input 
              type="email"
              value={formData.contactEmail} 
              onChange={e => handleChange('contactEmail', e.target.value)} 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle>Logistics & Opening</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Opening Hours</Label>
            <Input 
              value={formData.openingHours} 
              onChange={e => handleChange('openingHours', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Delivery Areas</Label>
            <Input 
              value={formData.deliveryAreas} 
              onChange={e => handleChange('deliveryAreas', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Delivery Fee Details</Label>
            <Input 
              value={formData.deliveryFee} 
              onChange={e => handleChange('deliveryFee', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Methods</Label>
            <Input 
              value={formData.paymentMethods} 
              onChange={e => handleChange('paymentMethods', e.target.value)} 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle>Our Story</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Story Title</Label>
            <Input 
              value={formData.storyTitle} 
              onChange={e => handleChange('storyTitle', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Paragraph 1</Label>
            <Textarea 
              value={formData.storyParagraph1} 
              onChange={e => handleChange('storyParagraph1', e.target.value)} 
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Paragraph 2</Label>
            <Textarea 
              value={formData.storyParagraph2} 
              onChange={e => handleChange('storyParagraph2', e.target.value)} 
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Story Image</Label>
            <ImageUpload 
              value={formData.storyImageUrl} 
              onChange={v => handleChange('storyImageUrl', v)} 
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Image Alt Text</Label>
              <Input 
                value={formData.storyImageAlt} 
                onChange={e => handleChange('storyImageAlt', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Image Caption</Label>
              <Input 
                value={formData.storyImageCaption} 
                onChange={e => handleChange('storyImageCaption', e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle>Social Links & Footer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input 
                value={formData.socialLinks?.instagram || ""} 
                onChange={e => handleSocialChange('instagram', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input 
                value={formData.socialLinks?.facebook || ""} 
                onChange={e => handleSocialChange('facebook', e.target.value)} 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Illustration Notice / Footer text</Label>
            <Input 
              value={formData.illustrationNotice} 
              onChange={e => handleChange('illustrationNotice', e.target.value)} 
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Sticky mobile action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur-md border-t border-border sm:hidden flex justify-end z-50 shadow-lg">
        <Button 
          type="submit" 
          disabled={updateSettings.isPending || !isDirty.current} 
          className="rounded-full w-full shadow-sm"
        >
          {updateSettings.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}