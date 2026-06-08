import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

import { useLogin } from "@/services";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  
  const loginMutation = useLogin();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (response) => {
          login(response.token, {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role as 'user' | 'admin',
          });
          toast({
            title: "Access Granted",
            description: "Welcome back, operator.",
          });
          // Redirect based on role
          if (response.user.role === "admin") {
            setLocation("/admin");
          } else {
            setLocation("/dashboard");
          }
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: error.data?.error || "Invalid credentials.",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-mono">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/">
          <div className="flex justify-center items-center gap-2 cursor-pointer mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl tracking-tight">PHISH_GUARD</span>
          </div>
        </Link>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-foreground tracking-tight">
          System Authentication
        </h2>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <Card className="border-border bg-card shadow-2xl">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access the console.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operator Email</FormLabel>
                      <FormControl>
                        <Input 
                          id="login-email"
                          placeholder="analyst@domain.com" 
                          type="email" 
                          autoComplete="email"
                          className="bg-secondary/50 border-border font-mono"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passkey</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            id="login-password"
                            placeholder="••••••••" 
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className="bg-secondary/50 border-border font-mono pr-10"
                            {...field} 
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Link href="/forgot-password">
                    <span className="text-sm text-primary hover:text-primary/80 cursor-pointer underline-offset-4 hover:underline">
                      Forgot passkey?
                    </span>
                  </Link>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Authenticate
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              No clearance?{" "}
              <Link href="/register">
                <span className="font-medium text-primary hover:text-primary/80 cursor-pointer underline-offset-4 hover:underline">
                  Request Access
                </span>
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
