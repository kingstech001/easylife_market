'use client'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useEffect, useState } from "react"
import { FaWhatsapp } from "react-icons/fa"

export default function HelpPage() {
  const [email, setEmail] = useState<string>("")
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setEmail(data.user.email || "Buyer");
        }
      } catch (error) {
        console.error("Failed to fetch user info", error);
        setEmail("Buyer");
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="space-y-8 py-5">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Help & Support</h2>
      </div>

      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
        </TabsList>

        {/* FAQ Tab for Buyers */}
        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Find answers to common questions about using your buyer account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I place an order?</AccordionTrigger>
                  <AccordionContent>
                    Browse products from any store, add them to your cart, and proceed to checkout.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Where can I view my past orders?</AccordionTrigger>
                  <AccordionContent>
                    Go to your dashboard and click on "Order History" to view all completed and ongoing orders.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Can I contact a seller directly?</AccordionTrigger>
                  <AccordionContent>
                    Yes, you can message sellers directly from the product or order page if they have enabled chat.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>How do I update my account details?</AccordionTrigger>
                  <AccordionContent>
                    Navigate to the Settings tab in your dashboard to update your name, email, or preferences.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>Do I need to pay to use this platform?</AccordionTrigger>
                  <AccordionContent>
                    No, buyers can use the platform for free. Only sellers are required to subscribe.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guides Tab for Buyers */}
        <TabsContent value="guides">
          <Card>
            <CardHeader>
              <CardTitle>Guides for Buyers</CardTitle>
              <CardDescription>Learn how to use your buyer account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Getting Started</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 list-disc pl-5">
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          How to search and browse products
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          How to place an order
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Managing your account
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Tracking your orders
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Support & Safety</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 list-disc pl-5">
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Reporting an issue
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Buyer protection policy
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Contacting sellers
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Cancelling an order
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Support */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Get help from our support team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  If you need help with your buyer account or an order, please contact our support team.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mx-auto overflow-hidden">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Email Support</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Send us an email at{" "}
                        <a href={`mailto:${email}`} className="text-primary hover:underline">
                          {email}
                        </a>
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        We respond within 24 hours on business days.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">WhatsApp Support</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Need quick help? Chat with our support team directly on WhatsApp.
                        We're available Monday-Friday, 9 AM-5 PM.
                      </p>
                      <div className="mt-4">
                        <a
                          href="https://wa.me/2348071427831" // 👈 Replace with your actual WhatsApp number
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors duration-200"
                        >
                          <FaWhatsapp size={24} className="text-white" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                </div>

              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
