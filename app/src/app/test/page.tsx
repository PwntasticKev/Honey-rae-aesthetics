"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Heart, Camera, Zap, TrendingUp } from "lucide-react";

export default function TestPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 p-6">
			<div className="max-w-4xl mx-auto space-y-8">
				{/* Header */}
				<div className="text-center">
					<div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
						<Sparkles className="w-12 h-12 text-white" />
					</div>
					<h1 className="text-4xl font-bold gradient-text mb-4">Honey Rae Aesthetics</h1>
					<p className="text-xl text-muted-foreground">
						Complete aesthetics practice management platform
					</p>
				</div>

				{/* Feature Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300" data-testid="feature-card">
						<CardHeader>
							<div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center mb-4">
								<Heart className="w-6 h-6 text-white" />
							</div>
							<CardTitle>Client Management</CardTitle>
							<CardDescription>
								Complete patient profiles and history tracking
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Badge variant="secondary" className="bg-pink-100 text-pink-700">
								Active
							</Badge>
						</CardContent>
					</Card>

					<Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300" data-testid="feature-card">
						<CardHeader>
							<div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-orange-500 rounded-xl flex items-center justify-center mb-4">
								<Camera className="w-6 h-6 text-white" />
							</div>
							<CardTitle>Photo Gallery</CardTitle>
							<CardDescription>
								Before & after photos with advanced tagging
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Badge variant="secondary" className="bg-rose-100 text-rose-700">
								New
							</Badge>
						</CardContent>
					</Card>

					<Card className="glass border-pink-200/50 hover:shadow-lg transition-all duration-300" data-testid="feature-card">
						<CardHeader>
							<div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4">
								<Zap className="w-6 h-6 text-white" />
							</div>
							<CardTitle>Automated Workflows</CardTitle>
							<CardDescription>
								Smart client communication automation
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Badge variant="secondary" className="bg-purple-100 text-purple-700">
								Premium
							</Badge>
						</CardContent>
					</Card>
				</div>

				{/* Stats Section */}
				<Card className="glass border-pink-200/50">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-pink-500" />
							Practice Statistics
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="text-center">
								<div className="text-2xl font-bold gradient-text">247</div>
								<div className="text-sm text-muted-foreground">Total Clients</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold gradient-text">89</div>
								<div className="text-sm text-muted-foreground">This Month</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold gradient-text">1,234</div>
								<div className="text-sm text-muted-foreground">Photos</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold gradient-text">98%</div>
								<div className="text-sm text-muted-foreground">Satisfaction</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Form Section */}
				<Card className="glass border-pink-200/50">
					<CardHeader>
						<CardTitle>Contact Form</CardTitle>
						<CardDescription>
							Get in touch with our team
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									placeholder="Your name"
									className="bg-white/50 border-pink-200/50 focus:border-pink-300"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="your@email.com"
									className="bg-white/50 border-pink-200/50 focus:border-pink-300"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="message">Message</Label>
							<Input
								id="message"
								placeholder="Tell us about your practice needs..."
								className="bg-white/50 border-pink-200/50 focus:border-pink-300"
							/>
						</div>
						<Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg">
							<Sparkles className="w-4 h-4 mr-2" />
							Send Message
						</Button>
					</CardContent>
				</Card>

				{/* Team Section */}
				<Card className="glass border-pink-200/50">
					<CardHeader>
						<CardTitle>Our Team</CardTitle>
						<CardDescription>
							Meet the experts behind Honey Rae
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center space-x-4">
							<Avatar className="w-16 h-16">
								<AvatarImage src="/avatar.jpg" />
								<AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-lg">
									HR
								</AvatarFallback>
							</Avatar>
							<div>
								<h3 className="text-lg font-semibold">Dr. Kevin Rae</h3>
								<p className="text-muted-foreground">Founder & Lead Aesthetician</p>
								<Badge variant="secondary" className="bg-pink-100 text-pink-700 mt-1">
									Board Certified
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
} 