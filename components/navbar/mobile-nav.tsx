"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-white">
        <SheetHeader>
         
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-8">
          {/* Product Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="product" className="border-b border-gray-200">
             <AccordionTrigger className="text-base font-medium hover:no-underline py-4">
                Product
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col space-y-3 pl-4">
                  <div>
                     
                    <div className="space-y-2">
                      <Link
                        href="/product/how-it-works"
                        className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setOpen(false)}
                      >
                        How it Works
                      </Link>
                      <Link
                        href="/product/demo"
                        className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setOpen(false)}
                      >
                        See It In Action
                      </Link>
                      <Link
                        href="/product/security"
                        className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setOpen(false)}
                      >
                        Security & Control
                      </Link>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                      Features
                    </p>
                    <div className="space-y-2">
                      <Link
                        href="/features/analytics"
                        className="block py-2 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setOpen(false)}
                      >
                        Document Analytics
                      </Link>
                      
                      
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Solutions Accordion */}
            <AccordionItem value="solutions" className="border-b border-gray-200">
              <AccordionTrigger className="text-base font-medium hover:no-underline py-4">
                Solutions
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col space-y-2 pl-4">
                  <Link
                    href="/solutions/sales"
                    className="py-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                     Sales Teams
                  </Link>
                  
                   
                   
                  <Link
                    href="/solutions/fundraising"
                    className="py-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                     Fundraising
                  </Link>
                  <Link
                    href="/solutions/enterprise"
                    className="py-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                     Client Portal
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

             

            {/* Resources Accordion */}
            <AccordionItem value="resources" className="border-b border-gray-200">
              <AccordionTrigger className="text-base font-medium hover:no-underline py-4">
                Resources
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col space-y-2 pl-4">
                  <Link
                    href="/https://docmetrics-documentation.gitbook.io/docs"
                    className="py-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                     Documentation
                  </Link>
                 
                  <Link
                    href="/help"
                    className="py-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                     Help Center
                  </Link>
                  <Link
                    href="/contact"
                    className="py-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                     Contact Us
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Direct Links */}
         <Link
            href="/pricing"
            className="text-base font-medium hover:text-primary py-4 block border-b border-gray-200"
            onClick={() => setOpen(false)}
          >
            Pricing
          </Link>

          <Separator />

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full bg-black text-white hover:bg-gray-800 border-black">
                Login
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setOpen(false)}>
             <Button className="w-full bg-transparent text-black border border-black hover:bg-gray-100">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}