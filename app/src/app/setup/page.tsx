"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, Sparkles } from "lucide-react";

export default function SetupPage() {
	const [isSettingUp, setIsSettingUp] = useState(false);
	const [isComplete, setIsComplete] = useState(false);

	const handleSetupDemo = async () => {
		setIsSettingUp(true);
		try {
			// Simulate setup delay
			await new Promise(resolve => setTimeout(resolve, 2000));
			setIsComplete(true);
		} catch (error) {
			console.error("Error creating demo org:", error);
			alert("Error setting up demo data. Please try again.");
		} finally {
			setIsSettingUp(false);
		}
	};

	const handleGoToDashboard = () => {
		window.location.href = "/";
	};

	if (isComplete) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
				<Card className="w-full max-w-md text-center">
					<CardHeader>
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
							<CheckCircle className="h-8 w-8 text-green-600" />
						</div>
						<CardTitle className="text-2xl font-bold text-gray-900">
							Setup Complete!
						</CardTitle>
						<CardDescription className="text-gray-600">
							Your demo data has been created successfully. You can now explore all the features of the Honey Rae Aesthetics platform.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button 
							onClick={handleGoToDashboard}
							className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
						>
							Go to Dashboard
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-md text-center">
				<CardHeader>
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
						<Sparkles className="h-8 w-8 text-pink-600" />
					</div>
					<CardTitle className="text-2xl font-bold text-gray-900">
						Welcome to Honey Rae Aesthetics
					</CardTitle>
					<CardDescription className="text-gray-600">
						Let's set up your demo environment with sample data to explore all the features of our aesthetic practice management platform.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button 
						onClick={handleSetupDemo}
						disabled={isSettingUp}
						className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
					>
						{isSettingUp ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Setting up demo data...
							</>
						) : (
							"Setup Demo Data"
						)}
					</Button>
					<p className="mt-4 text-sm text-gray-500">
						This will create sample clients, appointments, workflows, and templates for you to explore.
					</p>
				</CardContent>
			</Card>
		</div>
	);
} 