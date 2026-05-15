import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Gavel,
  Mail,
  Shield,
  ShoppingBag,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms and Conditions | EasyLife Market",
  description:
    "Read the EasyLife Market Terms and Conditions governing access to and use of the platform.",
};

type TermsSection = {
  id: string;
  title: string;
  body?: string[];
  items?: string[];
};

const sections: TermsSection[] = [
  {
    id: "1",
    title: "1. General Terms",
    body: [
      "1.1. These Terms govern your access to and use of the EasyLife Market website, mobile application, and related services (collectively referred to as the \"Platform\").",
      "1.2. By using our Platform in any manner, you confirm that you accept these Terms and agree to comply with them.",
      "1.3. We reserve the right to modify or update these Terms at any time. Any changes will become effective immediately upon publication on this page.",
      "1.4. Continued use of the Platform after updates constitutes your acceptance of the revised Terms.",
    ],
  },
  {
    id: "2",
    title: "2. Our Services",
    body: [
      "2.1. EasyLife Market provides an online marketplace where users can browse, purchase, and receive products from independent vendors and sellers listed on the Platform.",
      "2.2. Products available on the Platform may include electronics, gadgets, accessories, fashion items, home appliances, beauty products, digital products, and other consumer goods.",
      "2.3. EasyLife Market is not the manufacturer of products sold by third-party vendors unless expressly stated.",
      "2.4. We facilitate product listings, payments, order management, and delivery coordination between buyers and vendors.",
      "2.5. We do not guarantee the availability, accuracy, quality, legality, or safety of products listed by third-party vendors.",
    ],
  },
  {
    id: "3",
    title: "3. Access to the Platform",
    body: [
      "3.1. We do not guarantee that the Platform will always be available, uninterrupted, secure, or error-free.",
      "3.2. You are responsible for ensuring that your internet connection, device, and software are suitable for accessing the Platform.",
      "3.3. We reserve the right to suspend, withdraw, or restrict access to all or part of the Platform without notice where necessary.",
    ],
  },
  {
    id: "4",
    title: "4. User Accounts",
    body: [
      "4.1. To access certain features of the Platform, you may be required to create an account.",
      "4.2. When creating an account, you agree to provide accurate, complete, and up-to-date information.",
      "4.3. You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted through your account.",
      "4.4. You must immediately notify us if you suspect unauthorized access to your account.",
      "4.5. We reserve the right to suspend or terminate accounts involved in fraudulent, abusive, or unlawful activities.",
    ],
  },
  {
    id: "5",
    title: "5. Orders and Payments",
    body: [
      "5.1. All prices displayed on the Platform are listed in Nigerian Naira (NGN) unless otherwise stated.",
      "5.2. Payments may be made through supported payment channels available on the Platform, including:",
      "5.3. Payments are processed securely through third-party payment providers.",
      "5.4. By placing an order, you authorize us to process your payment through the selected payment method.",
      "5.5. We reserve the right to cancel or reject orders suspected to involve fraud, pricing errors, or unauthorized transactions.",
    ],
    items: [
      "Debit or credit cards",
      "Bank transfers",
      "Wallet payments",
      "QR code payments",
      "Other payment methods supported by our payment partners",
    ],
  },
  {
    id: "6",
    title: "6. Product Listings and Descriptions",
    body: [
      "6.1. Product images displayed on the Platform are for illustrative purposes only.",
      "6.2. We strive to ensure product descriptions, prices, and specifications are accurate, but we do not guarantee that all information is complete, reliable, or error-free.",
      "6.3. Where inaccuracies occur, we reserve the right to correct them without prior notice.",
    ],
  },
  {
    id: "7",
    title: "7. Shipping and Delivery",
    body: [
      "7.1. Delivery timelines are estimates only and may vary depending on location, vendor availability, logistics conditions, or unforeseen circumstances.",
      "7.2. Users are responsible for providing accurate delivery information.",
      "7.3. EasyLife Market shall not be liable for failed deliveries resulting from incorrect addresses or inability to contact the recipient.",
      "7.4. Risk in products passes to the User upon successful delivery.",
    ],
  },
  {
    id: "8",
    title: "8. Returns and Refunds",
    body: [
      "8.1. Refunds and returns are subject to our Return Policy.",
      "8.2. Products may only be eligible for return where:",
      "8.3. Refund requests must be submitted within the timeframe stated in our Return Policy.",
      "8.4. Refunds will be processed through the original payment method or wallet balance where applicable.",
    ],
    items: [
      "The item delivered is damaged",
      "The wrong item was delivered",
      "The item is defective upon arrival",
      "The product significantly differs from its description",
    ],
  },
  {
    id: "9",
    title: "9. Intellectual Property",
    body: [
      "9.1. All content on the Platform including logos, graphics, text, software, designs, images, and trademarks are owned by or licensed to EasyLife Market.",
      "9.2. You may not copy, reproduce, distribute, modify, reverse engineer, or commercially exploit any part of the Platform without prior written consent.",
    ],
  },
  {
    id: "10",
    title: "10. Prohibited Activities",
    body: ["You agree not to:"],
    items: [
      "Use the Platform for unlawful purposes",
      "Engage in fraudulent activities",
      "Upload harmful software or malicious code",
      "Attempt unauthorized access to the Platform",
      "Misrepresent your identity",
      "Interfere with the operation or security of the Platform",
    ],
  },
  {
    id: "11",
    title: "11. Limitation of Liability",
    body: [
      "11.1. To the maximum extent permitted by law, EasyLife Market shall not be liable for indirect, incidental, special, or consequential damages arising from the use of the Platform.",
      "11.2. We do not guarantee uninterrupted or error-free operation of the Platform.",
      "11.3. EasyLife Market is not responsible for losses caused by third-party vendors, payment providers, logistics partners, or external service providers.",
    ],
  },
  {
    id: "12",
    title: "12. Indemnification",
    body: [
      "You agree to indemnify and hold EasyLife Market harmless from claims, liabilities, damages, losses, and expenses arising from:",
    ],
    items: [
      "Your misuse of the Platform",
      "Your violation of these Terms",
      "Your violation of any law or third-party rights",
    ],
  },
  {
    id: "13",
    title: "13. Privacy",
    body: [
      "13.1. Your personal information is collected and processed in accordance with our Privacy Policy.",
      "13.2. By using the Platform, you consent to the collection and processing of your information as described in the Privacy Policy.",
    ],
  },
  {
    id: "14",
    title: "14. Suspension and Termination",
    body: [
      "14.1. We may suspend or terminate your account without prior notice if we believe you have violated these Terms or engaged in fraudulent or unlawful conduct.",
      "14.2. You may terminate your account at any time by contacting customer support.",
    ],
  },
  {
    id: "15",
    title: "15. Third-Party Services",
    body: [
      "15.1. The Platform may contain links to third-party websites or services.",
      "15.2. We are not responsible for the content, policies, or practices of third-party platforms.",
    ],
  },
  {
    id: "16",
    title: "16. Electronic Communication",
    body: [
      "16.1. By using the Platform, you consent to receiving electronic communications from us, including emails, notifications, and messages relating to your account or orders.",
    ],
  },
  {
    id: "17",
    title: "17. Governing Law",
    body: [
      "17.1. These Terms shall be governed and interpreted in accordance with the laws of the Federal Republic of Nigeria.",
      "17.2. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of Nigerian courts.",
    ],
  },
  {
    id: "18",
    title: "18. Contact Information",
    body: ["If you have questions regarding these Terms, you may contact us at:"],
  },
  {
    id: "19",
    title: "19. Version Control",
    body: [
      "This Terms of Use was last updated on 12th May 2026 by EasyLife Market.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(225,162,0,0.08),transparent_25%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.12))] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[10%] h-56 w-56 rounded-full bg-[#e1a200]/10 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute bottom-[12%] right-[-8%] h-64 w-64 rounded-full bg-foreground/5 blur-3xl sm:h-80 sm:w-80" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <div className="rounded-[32px] border border-border/70 bg-[linear-gradient(180deg,rgba(225,162,0,0.14),rgba(225,162,0,0.02)_45%,rgba(255,255,255,0.72)_100%)] p-6 shadow-xl sm:p-8 lg:sticky lg:top-8 lg:h-fit">
            <div className="inline-flex items-center rounded-full border border-[#e1a200]/20 bg-[#e1a200]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6500]">
              Terms of Use
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              EasyLife Market Terms and Conditions
            </h1>

            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              Welcome to EasyLife Market, a proprietary website and application
              operated by EasyLife Market. By accessing or using our platform,
              you agree to comply with and be legally bound by these Terms of
              Use.
            </p>

            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              Please read these Terms carefully before using the platform. If
              you do not agree with any part of these Terms, you should not use
              our services.
            </p>

            <div className="mt-6 rounded-3xl border border-border/70 bg-background/85 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Last Updated
              </p>
              <p className="mt-2 text-base font-medium text-foreground">
                12th May 2026
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <InfoCard
                icon={ShoppingBag}
                title="Marketplace Use"
                text="These terms apply to how buyers, sellers, and visitors use the EasyLife Market platform."
              />
              <InfoCard
                icon={Shield}
                title="Your Responsibilities"
                text="You are expected to provide accurate information, use the platform lawfully, and protect your account."
              />
              <InfoCard
                icon={Gavel}
                title="Legal Framework"
                text="These terms are governed by Nigerian law and apply immediately when updated on this page."
              />
            </div>
          </div>

          <Card className="rounded-[32px] border border-border/70 bg-background/92 shadow-xl backdrop-blur-sm">
            <CardContent className="p-5 sm:p-7 lg:p-8">
              <div className="mb-8 flex items-start gap-4 rounded-3xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#e1a200]/12 text-[#8c6500]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                    Terms Summary
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    These terms explain how EasyLife Market operates, what users
                    can expect from the platform, and the rules that apply to
                    purchases, listings, returns, accounts, and legal use.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {sections.map((section) => (
                  <section
                    key={section.id}
                    className="border-b border-border/60 pb-8 last:border-b-0 last:pb-0"
                  >
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                      {section.title}
                    </h3>

                    {section.body ? (
                      <div className="mt-3 space-y-3">
                        {section.body.map((paragraph) => (
                          <p
                            key={paragraph}
                            className="text-sm leading-7 text-muted-foreground sm:text-[15px]"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    ) : null}

                    {section.items ? (
                      <ul className="mt-4 space-y-3">
                        {section.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-3 text-sm leading-7 text-muted-foreground sm:text-[15px]"
                          >
                            <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#e1a200]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {section.id === "18" ? (
                      <div className="mt-4 rounded-3xl border border-border/70 bg-background p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e1a200]/12 text-[#8c6500]">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Email
                            </p>
                            <a
                              href="mailto:support@easylifemarket.com"
                              className="mt-1 inline-block text-sm font-medium text-[#8c6500] underline underline-offset-4"
                            >
                              easylifemarket01@gmail.com
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {section.id === "13" ? (
                      <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        You can also review our{" "}
                        <Link
                          href="/privacy"
                          className="font-medium text-[#8c6500] underline underline-offset-4"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </p>
                    ) : null}
                  </section>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShoppingBag;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/85 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e1a200]/12 text-[#8c6500]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
