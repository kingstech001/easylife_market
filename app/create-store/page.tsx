'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Store } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { slugify } from '@/lib/utils';

const shopSchema = z.object({
  name: z.string().min(3, 'Shop name must be at least 3 characters'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'Slug can only contain lowercase letters, numbers, and hyphens',
    }),
  description: z.string().optional(),
});

type ShopFormValues = z.infer<typeof shopSchema>;

export default function CreateShopPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name' && value.name && !form.getValues('slug')) {
        form.setValue('slug', slugify(value.name));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    // Get the currently logged in user from custom backend
    async function fetchUser() {
      try {
        const res = await fetch('/api/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setUserId(data.user.id);
        } else {
          router.push('/auth/login');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        router.push('/auth/login');
      }
    }

    fetchUser();
  }, [router]);

  async function onSubmit(data: ShopFormValues) {
    setIsLoading(true);

    if (!userId) {
      toast(
        <div>
          <div className="font-bold text-red-600">Authentication error</div>
          <div>You must be logged in to create a shop.</div>
        </div>
      );
      setIsLoading(false);
      return;
    }

    const res = await fetch('/api/shops/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        ...data,
        ownerId: userId,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      toast(
        <div>
          <div className="font-bold text-red-600">Shop creation failed</div>
          <div>{result.message || 'Something went wrong.'}</div>
        </div>
      );
    } else {
      toast(
        <div>
          <div className="font-bold">Shop created!</div>
          <div>Your shop has been created successfully.</div>
        </div>
      );
      router.push('/dashboard');
    }

    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col px-4 py-10">
      <div className="max-w-3xl w-full mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="flex flex-col items-center justify-center text-center mb-10">
          <Store className="h-12 w-12 text-indigo-500" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Create Your Shop
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Let's start by setting up your shop profile.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/5 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/10 shadow-xl"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Aiben Styles"
                        className="bg-black/70 border border-gray-700 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Slug (URL)</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          /shops/
                        </span>
                        <Input
                          {...field}
                          className="bg-black/70 border border-gray-700 text-white"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell people what your shop is about..."
                        className="resize-none bg-black/70 border border-gray-700 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
