import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ShoppingCart, Minus, Plus, Trash2, ExternalLink, Loader2, Search, Store, Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { storefrontApiRequest, useCartStore, ShopifyProduct } from '@/stores/cartStore';
import { toast } from 'sonner';

const STOREFRONT_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id title description handle
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 5) { edges { node { url altText } } }
          variants(first: 10) { edges { node { id title price { amount currencyCode } availableForSale selectedOptions { name value } } } }
          options { name values }
        }
      }
    }
  }
`;

export function EcommercePage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { items, isLoading, isSyncing, addItem, updateQuantity, removeItem, getCheckoutUrl, syncCart } = useCartStore();
  const [cartOpen, setCartOpen] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => { if (cartOpen) syncCart(); }, [cartOpen, syncCart]);

  const loadProducts = async (query?: string) => {
    setLoading(true);
    try {
      const data = await storefrontApiRequest(STOREFRONT_QUERY, { first: 50, query: query || null });
      setProducts(data?.data?.products?.edges || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadProducts(search || undefined);
  };

  const handleAddToCart = async (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success(t.ecom_added_to_cart, { position: 'top-center' });
  };

  const handleCheckout = () => {
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
      setCartOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.ecom_title}</h1>
          <p className="text-muted-foreground">{t.ecom_subtitle}</p>
        </div>
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
            <SheetHeader className="flex-shrink-0">
              <SheetTitle>{t.ecom_cart}</SheetTitle>
              <SheetDescription>
                {totalItems === 0 ? t.ecom_cart_empty : `${totalItems} ${t.ecom_items_in_cart}`}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col flex-1 pt-6 min-h-0">
              {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t.ecom_cart_empty}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-4">
                    {items.map((item) => (
                      <div key={item.variantId} className="flex gap-4 p-2">
                        <div className="w-16 h-16 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0">
                          {item.product.node.images?.edges?.[0]?.node && (
                            <img src={item.product.node.images.edges[0].node.url} alt={item.product.node.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{item.product.node.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.selectedOptions.map(o => o.value).join(' • ')}</p>
                          <p className="font-semibold">{item.price.currencyCode} {parseFloat(item.price.amount).toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.variantId)}><Trash2 className="h-3 w-3" /></Button>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex-shrink-0 space-y-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">{t.total}</span>
                      <span className="text-xl font-bold">{items[0]?.price.currencyCode} {totalPrice.toFixed(2)}</span>
                    </div>
                    <Button onClick={handleCheckout} className="w-full" size="lg" disabled={items.length === 0 || isLoading || isSyncing}>
                      {isLoading || isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4 mr-2" />{t.ecom_checkout}</>}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Store className="w-6 h-6 mx-auto mb-1 text-primary" /><div className="text-2xl font-bold">{products.length}</div><p className="text-sm text-muted-foreground">{t.ecom_total_products}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><ShoppingCart className="w-6 h-6 mx-auto mb-1 text-primary" /><div className="text-2xl font-bold">{totalItems}</div><p className="text-sm text-muted-foreground">{t.ecom_cart_items}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Package className="w-6 h-6 mx-auto mb-1 text-primary" /><div className="text-2xl font-bold">{products.filter(p => p.node.variants.edges.some(v => v.node.availableForSale)).length}</div><p className="text-sm text-muted-foreground">{t.ecom_available}</p></CardContent></Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input placeholder={t.ecom_search_products} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="max-w-xs" />
        <Button variant="outline" size="sm" onClick={handleSearch}>{t.search}</Button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t.loading}</div>
      ) : products.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" /><p className="text-lg text-muted-foreground">{t.ecom_no_products}</p><p className="text-sm text-muted-foreground mt-2">{t.ecom_no_products_hint}</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => {
            const variant = product.node.variants.edges[0]?.node;
            const image = product.node.images.edges[0]?.node;
            return (
              <Card key={product.node.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-secondary/10 overflow-hidden">
                  {image ? (
                    <img src={image.url} alt={image.altText || product.node.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-muted-foreground" /></div>
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold truncate">{product.node.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.node.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {variant?.price.currencyCode} {parseFloat(variant?.price.amount || '0').toFixed(2)}
                    </span>
                    {!variant?.availableForSale && <Badge variant="secondary">{t.ecom_sold_out}</Badge>}
                  </div>
                  <Button className="w-full" disabled={!variant?.availableForSale || isLoading} onClick={() => handleAddToCart(product)}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingCart className="w-4 h-4 mr-2" />{t.ecom_add_to_cart}</>}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
