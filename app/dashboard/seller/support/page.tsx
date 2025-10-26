import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FaWhatsapp } from "react-icons/fa"

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Help & Support</h2>
      </div>

      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
        </TabsList>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Find answers to common questions about ShopBuilder</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I add products to my store?</AccordionTrigger>
                  <AccordionContent>
                    You can add products to your store by going to the "Products" page and clicking on the "Add Product"
                    button. Fill in the product details, add images, and set the price and inventory.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How do I customize my store's appearance?</AccordionTrigger>
                  <AccordionContent>
                    You can customize your store's appearance by going to the "My Stores" page, selecting your store,
                    and clicking on the "Edit" button. Then, navigate to the "Appearance" tab to customize your store's
                    theme, colors, and layout.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>How do I view my store's analytics?</AccordionTrigger>
                  <AccordionContent>
                    You can view your store's analytics by going to the "Analytics" page. Here, you'll find information
                    about your store's visitors, sales, and popular products.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>How do I upgrade my plan?</AccordionTrigger>
                  <AccordionContent>
                    You can upgrade your plan by going to the "Billing" page and selecting a new plan. Follow the
                    instructions to complete the upgrade process.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides">
          <Card>
            <CardHeader>
              <CardTitle>Guides & Tutorials</CardTitle>
              <CardDescription>Learn how to use ShopBuilder effectively</CardDescription>
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
                          Creating your first store
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Adding products
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Customizing your store
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Publishing your store
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Advanced Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 list-disc pl-5">
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Setting up payment methods
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Configuring shipping options
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Managing inventory
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="text-primary hover:underline">
                          Analyzing store performance
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Get help from our support team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  If you need assistance with your ShopBuilder account or have questions that aren't answered in our FAQ
                  or guides, please contact our support team.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Email Support</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Send us an email at{" "}
                        <a href="mailto:easylifemarket01@gmail.com" className="text-primary hover:underline">
                          easylifemarket01@gmail.com
                        </a>
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        We typically respond within 24 hours on business days.
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
