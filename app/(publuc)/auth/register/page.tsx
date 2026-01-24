"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters." }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .refine((val) => /[a-z]/.test(val), {
        message: "Password must contain at least one lowercase letter.",
      })
      .refine((val) => /[A-Z]/.test(val), {
        message: "Password must contain at least one uppercase letter.",
      })
      .refine((val) => /\d/.test(val), {
        message: "Password must contain at least one number.",
      })
      .refine((val) => /[^\w\s]/.test(val), {
        message: "Password must contain at least one special character.",
      }),
    confirmPassword: z.string(),
    role: z.enum(["buyer", "seller"], {
      message: "Please select a role.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "seller",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.message || "Something went wrong.");
        return;
      }

      toast.success("Registration successful", {
        description: "Please check your email for verification code.",
      });

      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toast.error("An error occurred while registering.", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-muted/10 to-background p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-[#e1a200]/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <Card className="w-full max-w-md border-none shadow-none p-0 relative z-10 bg-transparent space-y-4">
        <CardHeader className="space-y-4 text-center p-0">
          {/* Logo */}
          <div className="mx-auto drop-shadow-md">
            <Image src={"/logo.png"} alt="logo" width={100} height={100}/>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription className="text-base">
              Join EasyLife and start your journey
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* First and Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                          <Input
                            placeholder=" "
                            {...field}
                            disabled={isLoading}
                            className="peer pl-10 pr-4 h-14 pt-4 outline-none ring-0 focus:border-1 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-border/50 focus:border-[#e1a200]/50"
                          />
                          <FormLabel className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#e1a200] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-muted-foreground">
                            First Name
                          </FormLabel>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                          <Input
                            placeholder=" "
                            {...field}
                            disabled={isLoading}
                            className="peer pl-10 pr-4 h-14 pt-4 outline-none ring-0 focus:border-1 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-border/50 focus:border-[#e1a200]/50"
                          />
                          <FormLabel className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#e1a200] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-muted-foreground">
                            Last Name
                          </FormLabel>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          type="email"
                          placeholder=" "
                          {...field}
                          disabled={isLoading}
                          className="peer pl-10 pr-4 h-14 pt-4 outline-none ring-0 focus:border-1 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-border/50 focus:border-[#e1a200]/50"
                        />
                        <FormLabel className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#e1a200] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-muted-foreground">
                          Email Address
                        </FormLabel>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder=" "
                          {...field}
                          disabled={isLoading}
                          className="peer pl-10 pr-12 h-14 pt-4 outline-none ring-0 focus:border-1 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-border/50 focus:border-[#e1a200]/50"
                        />
                        <FormLabel className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#e1a200] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-muted-foreground">
                          Password
                        </FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-transparent z-10"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Min 8 characters with uppercase, lowercase, number &
                      special character
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder=" "
                          {...field}
                          disabled={isLoading}
                          className="peer pl-10 pr-12 h-14 pt-4 outline-none ring-0 focus:border-1 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 border-border/50 focus:border-[#e1a200]/50"
                        />
                        <FormLabel className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#e1a200] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-muted-foreground">
                          Confirm Password
                        </FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-transparent z-10"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role Selection */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-6">
                    <FormLabel>I want to register as:</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-6 items-center !m-0"
                        disabled={isLoading}
                      >
                        {/* Seller */}
                        <div className="flex items-center space-x-2 gap-1">
                          <RadioGroupItem
                            value="seller"
                            id="seller"
                            className="border-2 data-[state=checked]:border-[#e1a200] data-[state=checked]:bg-[#e1a200] data-[state=unchecked]:bg-white data-[state=unchecked]:border-border"
                          />
                          <FormLabel
                            htmlFor="seller"
                            className="font-normal cursor-pointer !m-0"
                          >
                            Seller
                          </FormLabel>
                        </div>
                        {/* Buyer
                        <div className="flex items-center space-x-2 gap-1">
                          <RadioGroupItem
                            value="buyer"
                            id="buyer"
                            className="border-2 data-[state=checked]:border-[#e1a200] data-[state=checked]:bg-[#e1a200] data-[state=unchecked]:bg-white data-[state=unchecked]:border-border"
                          />
                          <FormLabel
                            htmlFor="buyer"
                            className="font-normal cursor-pointer !m-0"
                          >
                            Buyer
                          </FormLabel>
                        </div> */}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 p-0">
          {/* Divider */}
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link href="/auth/login" className="w-full">
            <Button
              variant="outline"
              className="w-full h-11 border-border/50 hover:bg-[#e1a200]/10 hover:border-[#e1a200]/50 hover:text-[#e1a200] transition-all duration-300"
              disabled={isLoading}
            >
              Sign In Instead
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}