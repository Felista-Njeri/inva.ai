"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Plus,
  TrendingUp,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Wallet,
  BarChart3,
  Settings,
  Zap
} from "lucide-react";

const Dashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for dashboard
  const stats = {
    totalInvoices: 156,
    pendingPayments: 12,
    monthlyRevenue: 45680,
    averagePaymentTime: 2.3,
    aiNegotiationsWon: 89,
    totalNegotiations: 102
  };

  const recentInvoices = [
    {
      id: "INV-2024-001",
      client: "TechCorp Solutions",
      amount: 5250,
      status: "pending",
      dueDate: "2024-01-15",
      aiActive: true
    },
    {
      id: "INV-2024-002", 
      client: "Marketing Plus",
      amount: 3200,
      status: "negotiating",
      dueDate: "2024-01-20",
      aiActive: true
    },
    {
      id: "INV-2024-003",
      client: "StartupXYZ",
      amount: 7500,
      status: "paid",
      dueDate: "2024-01-10",
      aiActive: false
    },
    {
      id: "INV-2024-004",
      client: "Enterprise Co",
      amount: 12000,
      status: "approved",
      dueDate: "2024-01-25",
      aiActive: true
    }
  ];

  const negotiations = [
    {
      id: "NEG-001",
      invoice: "INV-2024-002",
      client: "Marketing Plus",
      status: "active",
      lastMessage: "AI counter-offered Net 30 with 2% early payment discount",
      timestamp: "2 hours ago"
    },
    {
      id: "NEG-002", 
      invoice: "INV-2024-005",
      client: "Design Studio",
      status: "completed",
      lastMessage: "Terms agreed - payment scheduled for tomorrow",
      timestamp: "1 day ago"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "success";
      case "approved": return "default";
      case "negotiating": return "warning";
      case "pending": return "secondary";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return CheckCircle;
      case "approved": return Clock;
      case "negotiating": return MessageSquare;
      case "pending": return AlertCircle;
      default: return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">InvaAI Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, Sarah Chen</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
              <Button variant="gradient" className="hover:scale-95" size="sm" onClick={() => router.push('/create-invoice')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Invoices</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingPayments} pending payments
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Payment Time</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averagePaymentTime} days</div>
              <p className="text-xs text-muted-foreground">
                85% faster than industry avg
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Success Rate</CardTitle>
              <Brain className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((stats.aiNegotiationsWon / stats.totalNegotiations) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.aiNegotiationsWon} of {stats.totalNegotiations} negotiations won
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="negotiations">AI Negotiations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Recent Invoices
                  </CardTitle>
                  <CardDescription>Latest invoice activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentInvoices.slice(0, 4).map((invoice) => {
                    const StatusIcon = getStatusIcon(invoice.status);
                    return (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <StatusIcon className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{invoice.id}</p>
                            <p className="text-xs text-muted-foreground">{invoice.client}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">${invoice.amount.toLocaleString()}</p>
                          <Badge variant={getStatusColor(invoice.status) as any} className="text-xs">
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* AI Agent Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-accent" />
                    AI Agent Status
                  </CardTitle>
                  <CardDescription>Current AI negotiation activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium text-sm">Agent Active</p>
                        <p className="text-xs text-muted-foreground">Processing 3 negotiations</p>
                      </div>
                    </div>
                    <Button variant="ai" size="sm">
                      <Zap className="w-4 h-4 mr-1" />
                      View Activity
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span className="font-medium">{Math.round((stats.aiNegotiationsWon / stats.totalNegotiations) * 100)}%</span>
                    </div>
                    <Progress value={(stats.aiNegotiationsWon / stats.totalNegotiations) * 100} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success">{stats.aiNegotiationsWon}</p>
                      <p className="text-xs text-muted-foreground">Won</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-muted-foreground">{stats.totalNegotiations - stats.aiNegotiationsWon}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Invoices</CardTitle>
                <CardDescription>Manage your invoice portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => {
                    const StatusIcon = getStatusIcon(invoice.status);
                    return (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <StatusIcon className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{invoice.id}</p>
                            <p className="text-sm text-muted-foreground">{invoice.client}</p>
                            <p className="text-xs text-muted-foreground">Due: {invoice.dueDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {invoice.aiActive && (
                            <Badge variant="ai" className="text-xs">
                              <Brain className="w-3 h-3 mr-1" />
                              AI Active
                            </Badge>
                          )}
                          <div className="text-right">
                            <p className="font-medium">${invoice.amount.toLocaleString()}</p>
                            <Badge variant={getStatusColor(invoice.status) as any}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm">View</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Negotiations Tab */}
          <TabsContent value="negotiations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Active Negotiations
                </CardTitle>
                <CardDescription>AI agent negotiation activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {negotiations.map((negotiation) => (
                    <div key={negotiation.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${negotiation.status === 'active' ? 'bg-warning animate-pulse' : 'bg-success'}`}></div>
                          <div>
                            <p className="font-medium">{negotiation.invoice}</p>
                            <p className="text-sm text-muted-foreground">{negotiation.client}</p>
                          </div>
                        </div>
                        <Badge variant={negotiation.status === 'active' ? 'warning' : 'success'}>
                          {negotiation.status}
                        </Badge>
                      </div>
                      <p className="text-sm bg-muted/50 p-3 rounded border-l-4 border-accent">
                        {negotiation.lastMessage}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">{negotiation.timestamp}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Revenue Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Revenue chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Payment Time</span>
                    <span className="font-medium">{stats.averagePaymentTime} days</span>
                  </div>
                  <Progress value={15} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Success Rate</span>
                    <span className="font-medium">{Math.round((stats.aiNegotiationsWon / stats.totalNegotiations) * 100)}%</span>
                  </div>
                  <Progress value={(stats.aiNegotiationsWon / stats.totalNegotiations) * 100} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Client Satisfaction</span>
                    <span className="font-medium">4.8/5</span>
                  </div>
                  <Progress value={96} className="h-2" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;