"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Shield, 
  Zap, 
  DollarSign, 
  ArrowRight,
  Star,
} from "lucide-react";

const LandingPage = () => {
  const router = useRouter();
  
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Negotiations",
      description: "Smart agents negotiate payment terms automatically, saving you time and improving cash flow."
    },
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Smart contracts ensure secure escrow and transparent payment processing."
    },
    {
      icon: Zap,
      title: "Instant Settlements",
      description: "Get paid in minutes, not weeks. Automatic fund release upon completion."
    },
    {
      icon: DollarSign,
      title: "Multiple Currencies",
      description: "Accept payments in USDC, USDT, SEI, or traditional currencies."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Freelance Developer",
      content: "Cut my payment delays from 45 days to 2 days. The AI agent is amazing!",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Agency Owner",
      content: "Automated 90% of our invoice negotiations. Incredible time savings.",
      rating: 5
    },
    {
      name: "Lisa Thompson",
      role: "Procurement Manager",
      content: "Transparent process and instant payments. Our vendors love it.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">InvaAI</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm hover:text-primary transition-colors">Pricing</a>
            <a href="#about" className="text-sm hover:text-primary transition-colors">About</a>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>Sign In</Button>
            <Button size="sm" onClick={() => router.push('/dashboard')}>Get Started</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4" variant="secondary">
          <Star className="w-4 h-4 mr-1" />
          Trusted by 10,000+ businesses
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Smart Invoices.<br />Smarter Payments.
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Let AI negotiate your invoice terms while blockchain ensures instant, secure payments. 
          Get paid faster with zero manual work.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" variant="gradient" className="text-lg px-8" onClick={() => router.push('/dashboard')}>
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8">
            Watch Demo
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">85%</div>
            <div className="text-sm text-muted-foreground">Faster Payments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">2 mins</div>
            <div className="text-sm text-muted-foreground">Avg Settlement</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success">99.9%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Revolutionize Your Invoice Process
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Combine the power of AI automation with blockchain security for the ultimate invoicing experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="relative group hover:shadow-lg transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to automated invoice success
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">1</div>
              <h3 className="text-xl font-semibold mb-4">Create & Deploy</h3>
              <p className="text-muted-foreground">Create invoices with AI assistance and deploy smart contracts automatically.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">2</div>
              <h3 className="text-xl font-semibold mb-4">AI Negotiates</h3>
              <p className="text-muted-foreground">Our AI agent handles all negotiations and approvals based on your preferences.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">3</div>
              <h3 className="text-xl font-semibold mb-4">Get Paid</h3>
              <p className="text-muted-foreground">Receive instant payments through secure blockchain transactions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Loved by Thousands
          </h2>
          <p className="text-xl text-muted-foreground">
            See what our users say about their experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base italic">
                  "{testimonial.content}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-sm">{testimonial.name}</CardTitle>
                <CardDescription className="text-sm">{testimonial.role}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-accent py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Invoicing?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses already using InvoiceAI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-white text-blue-500 hover:bg-white hover:text-primary">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">InvoiceAI</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 InvoiceAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;