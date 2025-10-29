import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { BarChart3, Package, ShoppingCart, DollarSign, Plus, Pencil, Trash2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  rfid_tag: string;
  price: number;
  weight: number;
  stock_quantity: number;
  photo_url: string | null;
}

interface Transaction {
  id: number;
  cart_id: number;
  email: string | null;
  total_amount: number;
  total_weight: number;
  payment_method: string;
  status: string;
  transaction_time: string;
}

interface Stats {
  totalProducts: number;
  totalRevenue: number;
  totalTransactions: number;
  activeCarts: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    activeCarts: 0
  });
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    rfid_tag: "",
    price: "",
    weight: "",
    stock_quantity: "",
    photo_url: ""
  });

  useEffect(() => {
    checkAuth();
    fetchProducts();
    fetchTransactions();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin-login");
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch products");
      return;
    }
    setProducts(data || []);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("transaction_time", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Failed to fetch transactions");
      return;
    }
    setTransactions(data || []);
  };

  const fetchStats = async () => {
    const { data: products } = await supabase.from("products").select("id");
    const { data: transactions } = await supabase.from("transactions").select("total_amount").eq("status", "completed");
    const { data: carts } = await supabase.from("carts").select("id").eq("status", "active");
    
    const revenue = transactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;

    setStats({
      totalProducts: products?.length || 0,
      totalRevenue: revenue,
      totalTransactions: transactions?.length || 0,
      activeCarts: carts?.length || 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      rfid_tag: formData.rfid_tag,
      price: parseFloat(formData.price),
      weight: parseFloat(formData.weight),
      stock_quantity: parseInt(formData.stock_quantity),
      photo_url: formData.photo_url || null
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);

      if (error) {
        toast.error("Failed to update product");
        return;
      }
      toast.success("Product updated successfully");
    } else {
      const { error } = await supabase
        .from("products")
        .insert([productData]);

      if (error) {
        toast.error("Failed to add product");
        return;
      }
      toast.success("Product added successfully");
    }

    setIsProductDialogOpen(false);
    setEditingProduct(null);
    setFormData({ name: "", rfid_tag: "", price: "", weight: "", stock_quantity: "", photo_url: "" });
    fetchProducts();
    fetchStats();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      rfid_tag: product.rfid_tag,
      price: product.price.toString(),
      weight: product.weight.toString(),
      stock_quantity: product.stock_quantity.toString(),
      photo_url: product.photo_url || ""
    });
    setIsProductDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete product");
      return;
    }
    toast.success("Product deleted successfully");
    fetchProducts();
    fetchStats();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Smart Cart Admin</h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Products</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.totalProducts}</p>
              </div>
              <Package className="w-10 h-10 text-primary opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-accent mt-1">₹{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-accent opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Transactions</p>
                <p className="text-3xl font-bold text-success mt-1">{stats.totalTransactions}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-success opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Active Carts</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.activeCarts}</p>
              </div>
              <ShoppingCart className="w-10 h-10 text-primary opacity-80" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Product Inventory</h2>
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingProduct(null);
                    setFormData({ name: "", rfid_tag: "", price: "", weight: "", stock_quantity: "", photo_url: "" });
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="rfid_tag">RFID Tag</Label>
                      <Input
                        id="rfid_tag"
                        value={formData.rfid_tag}
                        onChange={(e) => setFormData({ ...formData, rfid_tag: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.01"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="stock_quantity">Stock Quantity</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="photo_url">Photo URL (optional)</Label>
                      <Input
                        id="photo_url"
                        type="url"
                        value={formData.photo_url}
                        onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingProduct ? "Update Product" : "Add Product"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>RFID Tag</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.rfid_tag}</TableCell>
                      <TableCell>₹{product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.weight} kg</TableCell>
                      <TableCell>
                        <span className={product.stock_quantity < 10 ? "text-destructive font-semibold" : ""}>
                          {product.stock_quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cart ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.id}</TableCell>
                      <TableCell>{transaction.cart_id}</TableCell>
                      <TableCell>{transaction.email || "N/A"}</TableCell>
                      <TableCell>₹{transaction.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{transaction.total_weight} kg</TableCell>
                      <TableCell className="uppercase">{transaction.payment_method}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === "completed" ? "bg-success/20 text-success" :
                          transaction.status === "failed" ? "bg-destructive/20 text-destructive" :
                          "bg-accent/20 text-accent"
                        }`}>
                          {transaction.status}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(transaction.transaction_time).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
