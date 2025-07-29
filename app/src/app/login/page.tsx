"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		// Master credentials
		const masterEmail = "admin@honeyrae.com";
		const masterPassword = "master123";

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));

			if (email === masterEmail && password === masterPassword) {
				// Store auth token in localStorage
				if (typeof window !== 'undefined') {
					localStorage.setItem("authToken", "master-token");
					localStorage.setItem("userEmail", email);
					localStorage.setItem("userRole", "admin");
				}
				
				// Redirect to dashboard
				window.location.href = "/";
			} else {
				setError("Invalid email or password");
			}
		} catch (error) {
			setError("Login failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
						<Sparkles className="h-8 w-8 text-pink-600" />
					</div>
					<CardTitle className="text-2xl font-bold text-gray-900">
						Welcome Back
					</CardTitle>
					<CardDescription className="text-gray-600">
						Sign in to your Honey Rae Aesthetics account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleLogin} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="admin@honeyrae.com"
								required
								className="bg-white/50 border-pink-200/50 focus:border-pink-300"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter your password"
									required
									className="bg-white/50 border-pink-200/50 focus:border-pink-300 pr-10"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4 text-gray-500" />
									) : (
										<Eye className="h-4 w-4 text-gray-500" />
									)}
								</Button>
							</div>
						</div>
						
						{error && (
							<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
								{error}
							</div>
						)}

						<Button 
							type="submit"
							disabled={isLoading}
							className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
						>
							{isLoading ? "Signing in..." : "Sign In"}
						</Button>
					</form>

					<div className="mt-6 p-4 bg-blue-50 rounded-md">
						<h4 className="text-sm font-medium text-blue-900 mb-2">Master Login Credentials:</h4>
						<p className="text-xs text-blue-700">
							Email: <strong>admin@honeyrae.com</strong><br />
							Password: <strong>master123</strong>
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 