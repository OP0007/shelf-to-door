import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShoppingCart, Trash2, CheckCircle, Weight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  item_weight: number;
  products: {
    name: string;
    price: number;
    weight: number;
  };
}

interface Cart {
  id: number;
  status: string;
  total_weight: number;
}

const CustomerScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cartIdParam = searchParams.get("cart_id");
  
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "UPI" | "cash">("card");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (cartIdParam) {
      initializeCart(parseInt(cartIdParam));
    } else {
      createNewCart();
    }
  }, [cartIdParam]);

  useEffect(() => {
    if (!cart) return;

    // Subscribe to real-time updates
    const cartChannel = supabase
      .channel('cart-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `cart_id=eq.${cart.id}`
        },
        () => {
          fetchCartItems();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'carts',
          filter: `id=eq.${cart.id}`
        },
        () => {
          fetchCart();
        }
      )
      .subscribe();

    fetchCartItems();
    fetchCart();

    return () => {
      supabase.removeChannel(cartChannel);
    };
  }, [cart?.id]);

  const createNewCart = async () => {
    const { data, error } = await supabase
      .from("carts")
      .insert([{ status: "active" }])
      .select()
      .single();

    if (error) {
      toast.error("Failed to create cart");
      return;
    }

    setCart(data);
    navigate(`/checkout?cart_id=${data.id}`, { replace: true });
  };

  const initializeCart = async (cartId: number) => {
    const { data, error } = await supabase
      .from("carts")
      .select("*")
      .eq("id", cartId)
      .single();

    if (error || !data) {
      toast.error("Cart not found, creating new cart");
      createNewCart();
      return;
    }

    // Activate cart if inactive
    if (data.status === "inactive") {
      await supabase
        .from("carts")
        .update({ status: "active" })
        .eq("id", cartId);
      data.status = "active";
    }

    setCart(data);
  };

  const fetchCart = async () => {
    if (!cart) return;
    
    const { data } = await supabase
      .from("carts")
      .select("*")
      .eq("id", cart.id)
      .single();

    if (data) {
      setCart(data);
    }
  };

  const fetchCartItems = async () => {
    if (!cart) return;

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        *,
        products (
          name,
          price,
          weight
        )
      `)
      .eq("cart_id", cart.id);

    if (error) {
      toast.error("Failed to fetch cart items");
      return;
    }

    setCartItems(data || []);
  };

  const removeItem = async (itemId: number) => {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast.error("Failed to remove item");
      return;
    }

    toast.success("Item removed from cart");
    fetchCartItems();
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.products.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (!cart || cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsProcessing(true);

    const totalAmount = calculateTotal();

    const { data, error } = await supabase
      .from("transactions")
      .insert([{
        cart_id: cart.id,
        email: email || null,
        total_amount: totalAmount,
        total_weight: cart.total_weight,
        payment_method: paymentMethod,
        status: "completed"
      }])
      .select()
      .single();

    if (error) {
      toast.error("Checkout failed");
      setIsProcessing(false);
      return;
    }

    // Deactivate cart
    await supabase
      .from("carts")
      .update({ status: "inactive" })
      .eq("id", cart.id);

    toast.success("Checkout successful! Thank you for shopping!");
    setIsCheckoutOpen(false);
    setIsProcessing(false);

    // Redirect to receipt or create new cart
    setTimeout(() => {
      createNewCart();
    }, 2000);
  };

  const totalAmount = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border shadow-md">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Smart Cart
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Cart ID: {cart?.id || "Loading..."}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <Weight className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Weight</p>
                    <p className="text-lg font-bold text-primary">{cart?.total_weight.toFixed(2) || "0.00"} kg</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-primary" />
                Your Cart
              </h2>
              <p className="text-muted-foreground">{cartItems.length} items</p>
            </div>

            {cartItems.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start scanning items to add them to your cart
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <Card key={item.id} className="p-5 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.products.name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Qty: {item.quantity}</span>
                          <span>•</span>
                          <span>₹{item.products.price.toFixed(2)} each</span>
                          <span>•</span>
                          <span>{item.item_weight.toFixed(2)} kg</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-xl font-bold text-primary">
                          ₹{(item.products.price * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8 shadow-lg bg-gradient-to-br from-card to-card/50">
              <h3 className="text-xl font-bold mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Items</span>
                  <span>{cartItems.length}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Weight</span>
                  <span>{cart?.total_weight.toFixed(2) || "0.00"} kg</span>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                size="lg"
                onClick={() => setIsCheckoutOpen(true)}
                disabled={cartItems.length === 0}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Proceed to Checkout
              </Button>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("card")}
                  className="w-full"
                >
                  Card
                </Button>
                <Button
                  variant={paymentMethod === "UPI" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("UPI")}
                  className="w-full"
                >
                  UPI
                </Button>
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("cash")}
                  className="w-full"
                >
                  Cash
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium uppercase">{paymentMethod}</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Complete Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerScreen;
