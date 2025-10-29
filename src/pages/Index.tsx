import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, User, Zap, Shield, Smartphone } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Smart Cart
            </h1>
          </div>
          <Button onClick={() => navigate("/admin-login")} variant="outline">
            <User className="w-4 h-4 mr-2" />
            Admin Login
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <section className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Self-Checkout Made Simple
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the future of shopping with our RFID-powered automated checkout system. 
            Scan, shop, and go in seconds.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8"
            onClick={() => navigate("/checkout")}
          >
            Start Shopping
            <ShoppingCart className="w-5 h-5 ml-2" />
          </Button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <Card className="p-8 text-center hover:shadow-lg transition-all border-primary/20">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
            <p className="text-muted-foreground">
              RFID technology instantly recognizes items as you place them in your cart. No scanning required.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-all border-accent/20">
            <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-3">Secure & Accurate</h3>
            <p className="text-muted-foreground">
              Real-time weight verification ensures accurate billing and prevents errors.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-all border-success/20">
            <div className="w-16 h-16 bg-gradient-to-br from-success/20 to-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-3">Multiple Payments</h3>
            <p className="text-muted-foreground">
              Pay with Card, UPI, or Cash. Choose what works best for you at checkout.
            </p>
          </Card>
        </section>

        <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-3xl p-12 text-center border border-primary/20">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
            <div>
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                1
              </div>
              <h4 className="font-semibold mb-2">Enter Store</h4>
              <p className="text-sm text-muted-foreground">Get your smart cart with unique ID</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                2
              </div>
              <h4 className="font-semibold mb-2">Shop Freely</h4>
              <p className="text-sm text-muted-foreground">Items automatically added via RFID</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                3
              </div>
              <h4 className="font-semibold mb-2">Review Cart</h4>
              <p className="text-sm text-muted-foreground">Check items and total in real-time</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                4
              </div>
              <h4 className="font-semibold mb-2">Quick Checkout</h4>
              <p className="text-sm text-muted-foreground">Pay and go in seconds</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 mt-20">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>© 2025 Smart Cart. Revolutionizing retail checkout.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
