"use client"

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Brain,
  Plus,
  Trash2,
  ArrowLeft,
  FileText,
  Wallet,
  Bot,
  DollarSign,
  Calendar,
  Users,
  Zap
} from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

const CreateInvoice = () => {
  const [useAI, setUseAI] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, rate: 0, amount: 0 }
  ]);

  const [invoiceData, setInvoiceData] = useState({
    clientName: "",
    clientEmail: "",
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    dueDate: "",
    currency: "USDC",
    paymentTerms: "Net 30",
    notes: ""
  });

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  };

  const generateFromAI = async () => {
    if (!aiDescription.trim()) return;
    
    setGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const generatedItems = [
        { id: "ai-1", description: "Website Development - Frontend", quantity: 40, rate: 85, amount: 3400 },
        { id: "ai-2", description: "Backend API Development", quantity: 25, rate: 95, amount: 2375 },
        { id: "ai-3", description: "Database Design & Implementation", quantity: 15, rate: 90, amount: 1350 }
      ];
      
      setLineItems(generatedItems);
      setInvoiceData(prev => ({
        ...prev,
        paymentTerms: "Net 30",
        notes: "Generated from AI based on project description. Payment terms negotiable."
      }));
      setGenerating(false);
    }, 2000);
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <Link href={`/dashboard`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                </Link>
              <div>
                <h1 className="text-2xl font-bold">Create New Invoice</h1>
                <p className="text-sm text-muted-foreground">Generate smart contracts with AI assistance</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="ai">
                <Brain className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Generation Card */}
            <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-accent/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-accent" />
                    <CardTitle>AI Invoice Generation</CardTitle>
                  </div>
                  <Switch checked={useAI} onCheckedChange={setUseAI} />
                </div>
                <CardDescription>
                  Describe your work and let AI generate detailed line items
                </CardDescription>
              </CardHeader>
              {useAI && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ai-description">Project Description</Label>
                    <Textarea
                      id="ai-description"
                      placeholder="e.g., Built a complete e-commerce website with user authentication, payment processing, and admin dashboard for a startup client..."
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={generateFromAI} 
                    disabled={!aiDescription.trim() || generating}
                    variant="ai"
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating Invoice...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              )}
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client-name">Client Name</Label>
                    <Input
                      id="client-name"
                      value={invoiceData.clientName}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="Enter client or company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-email">Client Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      value={invoiceData.clientEmail}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, clientEmail: e.target.value }))}
                      placeholder="client@company.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="invoice-number">Invoice Number</Label>
                    <Input
                      id="invoice-number"
                      value={invoiceData.invoiceNumber}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={invoiceData.currency} onValueChange={(value) => setInvoiceData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="SEI">SEI</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment-terms">Payment Terms</Label>
                    <Select value={invoiceData.paymentTerms} onValueChange={(value) => setInvoiceData(prev => ({ ...prev, paymentTerms: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 45">Net 45</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Line Items</CardTitle>
                  <Button onClick={addLineItem} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      {lineItems.length > 1 && (
                        <Button
                          onClick={() => removeLineItem(item.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor={`description-${item.id}`}>Description</Label>
                        <Input
                          id={`description-${item.id}`}
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          placeholder="Work description"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`rate-${item.id}`}>Rate</Label>
                        <Input
                          id={`rate-${item.id}`}
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">Amount: </span>
                      <span className="font-medium">${item.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional information for the client..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Preview Sidebar */}
          <div className="space-y-6">
            {/* Invoice Summary */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>${totalAmount.toFixed(2)} {invoiceData.currency}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <div className="text-sm text-muted-foreground">Payment Terms:</div>
                  <Badge variant="outline">{invoiceData.paymentTerms}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Smart Contract:</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span className="text-sm">Ready to Deploy</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Agent Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-accent" />
                  AI Agent Settings
                </CardTitle>
                <CardDescription>Configure negotiation parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Negotiation Aggressiveness</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Conservative</span>
                    <div className="flex-1 h-2 bg-muted rounded">
                      <div className="w-3/5 h-2 bg-accent rounded"></div>
                    </div>
                    <span className="text-sm">Aggressive</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Auto-approve changes under:</Label>
                  <Select defaultValue="5">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Manual approval only</SelectItem>
                      <SelectItem value="5">5% of total</SelectItem>
                      <SelectItem value="10">10% of total</SelectItem>
                      <SelectItem value="15">15% of total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Follow-up frequency:</Label>
                  <Select defaultValue="3">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Daily</SelectItem>
                      <SelectItem value="3">Every 3 days</SelectItem>
                      <SelectItem value="7">Weekly</SelectItem>
                      <SelectItem value="14">Bi-weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full" size="lg" variant="gradient">
                <Wallet className="w-4 h-4 mr-2" />
                Deploy Smart Contract
              </Button>
              <Button className="w-full" variant="outline">
                Save as Draft
              </Button>
              <Button className="w-full" variant="ghost">
                Preview Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;