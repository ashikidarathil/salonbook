'use client';

import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppSelector } from '@/app/hooks';
import { Header } from '@/components/user/Header';
import { Footer } from '@/components/user/Footer';

export default function ContactPage() {
  const { selectedBranch } = useAppSelector((state) => state.branch);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="w-full px-4 py-10 sm:px-6 md:py-16 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-semibold tracking-tight md:text-5xl font-heading">
            Get In Touch
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            Have a question or want to book an appointment? We'd love to hear from you. Send us a
            message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Send us a message</CardTitle>
              <p className="text-sm text-muted-foreground">
                Fill out the form below and we'll get back to you within 24 hours
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="inquiry">General Inquiry</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Tell us how we can help you..." rows={4} />
              </div>
              <Button className="w-full shadow-lg shadow-primary/20">
                <Icon icon="solar:letter-bold" className="mr-2 size-4" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Right Side - Contact Info + Become Stylist */}
          <div className="space-y-6">
            <div>
              <h2 className="mb-6 text-2xl font-semibold tracking-tight font-heading">
                Contact Information
              </h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
                  <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
                    <CardContent className="flex items-start gap-4 pt-6">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Icon icon="solar:map-point-bold" className="size-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1 text-lg font-semibold">Visit Us</h3>
                        {selectedBranch ? (
                          <div className="space-y-3">
                            <div>
                              <p className="font-medium text-foreground">{selectedBranch.name}</p>
                              <p className="text-sm text-muted-foreground">{selectedBranch.address}</p>
                            </div>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              className="w-full h-9 group"
                              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedBranch.latitude},${selectedBranch.longitude}`, '_blank')}
                            >
                              Get Directions
                              <Icon icon="solar:arrow-right-up-bold" className="ml-2 transition-transform size-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Please select a branch to see our location and get directions.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
                    <CardContent className="flex items-start gap-4 pt-6">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Icon icon="solar:phone-bold" className="size-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="mb-1 text-lg font-semibold">Call Us</h3>
                        {selectedBranch?.phone ? (
                          <>
                            <p className="font-medium text-foreground">{selectedBranch.phone}</p>
                            <p className="text-sm text-muted-foreground">Mon - Sun, 9am - 9pm</p>
                            <a 
                              href={`tel:${selectedBranch.phone}`}
                              className="inline-block mt-1 text-sm font-medium text-primary hover:underline"
                            >
                              Call now
                            </a>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-foreground">+91 98765 43210</p>
                            <p className="text-sm text-muted-foreground">General support line</p>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <Button
              asChild
              className="w-full shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-primary/90"
              size="lg"
            >
              <Link to="/contact/apply">
                <Icon icon="solar:scissors-bold" className="mr-2 size-5" />
                Become a Stylist
              </Link>
            </Button>
          </div>
        </div>

        {/* Map placeholder */}
        <Card className="mt-12">
          <CardContent className="p-0">
            <div className="flex items-center justify-center rounded-lg bg-muted h-96">
              <div className="text-center">
                <Icon
                  icon="solar:map-bold"
                  className="mx-auto mb-3 size-12 text-muted-foreground"
                />
                <h3 className="mb-2 text-lg font-semibold">Find Us On The Map</h3>
                <p className="text-sm text-muted-foreground">
                  Located in the heart of the city, easily accessible by public transportation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
