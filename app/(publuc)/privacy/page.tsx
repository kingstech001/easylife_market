import type { Metadata } from "next";
import Link from "next/link";
import {
  Database,
  FileLock,
  Globe,
  Mail,
  Shield,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy | EasyLife Market",
  description:
    "Read how EasyLife Market collects, uses, stores, and protects your personal information.",
};

type PrivacySection = {
  id: string;
  title: string;
  body?: string[];
  items?: string[];
};

const sections: PrivacySection[] = [
  {
    id: "1",
    title: "1. Updates to this Privacy Policy",
    body: [
      "1.1. We may update this Privacy Policy from time to time to reflect changes in our services, technologies, legal obligations, or business practices.",
      "1.2. Any updated version will be published on this page and becomes effective immediately upon publication.",
      "1.3. We encourage users to review this Privacy Policy periodically.",
    ],
  },
  {
    id: "2",
    title: "2. Information We Collect",
    body: [
      "We collect information necessary to provide and improve our Services.",
      "2.1. Information You Provide",
      "We may collect personal information including:",
      "2.2. Automatically Collected Information",
      "When you use our Platform, we may automatically collect:",
      "2.3. Information from Third Parties",
      "We may receive information from:",
    ],
    items: [
      "Full name",
      "Email address",
      "Phone number",
      "Delivery address",
      "Billing information",
      "Account login details",
      "Order and transaction history",
      "Customer support communications",
      "Device information",
      "Browser type and version",
      "IP address",
      "Operating system",
      "App usage data",
      "Cookies and tracking information",
      "Location data where permitted",
      "Payment providers",
      "Logistics and delivery partners",
      "Fraud prevention services",
      "Marketing and analytics partners",
      "Social media platforms where you interact with us",
    ],
  },
  {
    id: "3",
    title: "3. How We Use Your Information",
    body: ["We may use your information to:"],
    items: [
      "Create and manage your account",
      "Process orders and payments",
      "Coordinate deliveries",
      "Provide customer support",
      "Improve our products and services",
      "Personalize user experience",
      "Send service updates and notifications",
      "Detect and prevent fraud or abuse",
      "Comply with legal obligations",
      "Conduct analytics and research",
      "Send marketing communications where permitted",
    ],
  },
  {
    id: "4",
    title: "4. Cookies and Tracking Technologies",
    body: [
      "4.1. We use cookies and similar technologies to improve your experience on the Platform.",
      "4.2. Cookies help us:",
      "4.3. You may disable cookies through your browser settings, although some parts of the Platform may not function properly.",
    ],
    items: [
      "Remember your preferences",
      "Keep you logged in",
      "Analyze website traffic and usage",
      "Improve functionality and performance",
      "Deliver relevant content and promotions",
    ],
  },
  {
    id: "5",
    title: "5. Legal Basis for Processing",
    body: ["We process your personal information based on:"],
    items: [
      "Your consent",
      "Performance of a contract",
      "Compliance with legal obligations",
      "Legitimate business interests",
      "Fraud prevention and security purposes",
    ],
  },
  {
    id: "6",
    title: "6. Sharing of Information",
    body: [
      "6.1. We do not sell your personal information.",
      "6.2. We may share your information with:",
      "6.3. We may also disclose information where necessary to:",
    ],
    items: [
      "Vendors and sellers to fulfil orders",
      "Payment service providers",
      "Delivery and logistics partners",
      "Customer support providers",
      "Analytics and marketing partners",
      "Legal and regulatory authorities where required by law",
      "Protect our rights and security",
      "Prevent fraud or illegal activity",
      "Enforce our Terms of Use",
      "Respond to legal requests",
    ],
  },
  {
    id: "7",
    title: "7. Location Services",
    body: [
      "7.1. With your permission, we may access your device location to:",
      "7.2. You can disable location access through your device settings, but some services may not function properly.",
    ],
    items: [
      "Provide accurate delivery services",
      "Show nearby vendors or products",
      "Improve delivery estimates",
      "Enhance user experience",
    ],
  },
  {
    id: "8",
    title: "8. Marketing Communications",
    body: [
      "8.1. We may send promotional emails, SMS messages, and notifications about products, discounts, updates, and offers.",
      "8.2. You may opt out of marketing communications at any time through the unsubscribe link or by contacting us.",
      "8.3. Even after opting out, we may still send important service-related communications.",
    ],
  },
  {
    id: "9",
    title: "9. Data Retention",
    body: [
      "9.1. We retain personal information only for as long as necessary to:",
      "9.2. Where retention is no longer necessary, we securely delete or anonymize your information.",
    ],
    items: [
      "Provide our Services",
      "Comply with legal obligations",
      "Resolve disputes",
      "Enforce agreements",
      "Prevent fraud and abuse",
    ],
  },
  {
    id: "10",
    title: "10. Data Security",
    body: [
      "10.1. We implement technical, administrative, and organizational security measures to protect your personal information.",
      "10.2. These measures may include:",
      "10.3. While we take reasonable precautions, no system can guarantee complete security.",
    ],
    items: [
      "Secure servers",
      "Data encryption",
      "SSL security protocols",
      "Access controls",
      "Monitoring systems",
    ],
  },
  {
    id: "11",
    title: "11. Third-Party Services and Links",
    body: [
      "11.1. Our Platform may contain links to third-party websites or services.",
      "11.2. We are not responsible for the privacy practices or content of third-party platforms.",
      "11.3. We encourage users to review the privacy policies of any third-party websites they visit.",
    ],
  },
  {
    id: "12",
    title: "12. Your Rights",
    body: [
      "Subject to applicable laws, you may have the right to:",
      "To exercise any of these rights, please contact us using the details below.",
    ],
    items: [
      "Access your personal information",
      "Correct inaccurate information",
      "Request deletion of your data",
      "Withdraw consent",
      "Object to certain processing activities",
      "Request data portability",
      "Restrict processing in certain circumstances",
    ],
  },
  {
    id: "13",
    title: "13. Children's Privacy",
    body: [
      "13.1. Our Services are not intended for individuals under the age of 18.",
      "13.2. We do not knowingly collect personal information from minors.",
    ],
  },
  {
    id: "14",
    title: "14. International Data Transfers",
    body: [
      "14.1. Your information may be stored or processed in locations outside your country of residence where our service providers operate.",
      "14.2. Where required, we implement appropriate safeguards for international data transfers.",
    ],
  },
  {
    id: "15",
    title: "15. Account Deletion",
    body: [
      "15.1. You may request deletion of your account by contacting customer support.",
      "15.2. Certain information may still be retained where legally required or necessary for fraud prevention, dispute resolution, or compliance purposes.",
    ],
  },
  {
    id: "16",
    title: "16. Governing Law",
    body: [
      "16.1. This Privacy Policy shall be governed by and interpreted in accordance with the laws of the Federal Republic of Nigeria.",
    ],
  },
  {
    id: "17",
    title: "17. Contact Information",
    body: [
      "If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us at:",
    ],
  },
  {
    id: "18",
    title: "18. Version Control",
    body: [
      "This Privacy Policy was last updated on 12th May 2026 by EasyLife Market.",
    ],
  },
];

export default function PrivacyPage() {
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
              Privacy Policy
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              EasyLife Market Privacy Policy
            </h1>

            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              EasyLife Market ("EasyLife", "we", "us", "our") operates an
              online marketplace platform that allows users to browse, purchase,
              and receive products from vendors and sellers through our website
              and mobile applications ("Services").
            </p>

            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              We value your privacy and are committed to protecting your
              personal information. This Privacy Policy explains how we collect,
              use, process, store, and protect your information when you use
              our Platform.
            </p>

            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              By using EasyLife Market, you consent to the practices described
              in this Privacy Policy.
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
                icon={Shield}
                title="Privacy Commitment"
                text="We are committed to collecting and using personal information responsibly and transparently."
              />
              <InfoCard
                icon={Database}
                title="Data Use"
                text="Your information helps us run accounts, process orders, coordinate deliveries, and improve services."
              />
              <InfoCard
                icon={Globe}
                title="Platform Operations"
                text="This policy explains data practices across our website, apps, support, logistics, and payment-related interactions."
              />
            </div>
          </div>

          <Card className="rounded-[32px] border border-border/70 bg-background/92 shadow-xl backdrop-blur-sm">
            <CardContent className="p-5 sm:p-7 lg:p-8">
              <div className="mb-8 flex items-start gap-4 rounded-3xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#e1a200]/12 text-[#8c6500]">
                  <FileLock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                    Privacy Summary
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This policy explains what information we collect, why we
                    collect it, how long we keep it, who we may share it with,
                    and the rights you may have over your data.
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

                    {section.id === "17" ? (
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

                    {section.id === "6" ? (
                      <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        Related platform rules are also available in our{" "}
                        <Link
                          href="/terms"
                          className="font-medium text-[#8c6500] underline underline-offset-4"
                        >
                          Terms and Conditions
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
  icon: typeof Shield;
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
