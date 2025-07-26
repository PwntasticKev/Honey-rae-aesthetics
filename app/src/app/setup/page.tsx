"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

export default function SetupPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [isComplete, setIsComplete] = useState(false);
	const [result, setResult] = useState<any>(null);

	const setupDemo = useMutation(api.demo.setupDemo);

	const handleSetup = async () => {
		setIsLoading(true);
		try {
			const result = await setupDemo({});
			setResult(result);
			setIsComplete(true);
		} catch (error) {
			console.error("Setup failed:", error);
			alert("Setup failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="max-w-md w-full mx-4">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<div className="text-center">
						{isComplete ? (
							<CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
						) : (
							<div className="h-12 w-12 mx-auto mb-4 flex items-center justify-center">
								<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
							</div>
						)}
						
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							{isComplete ? "Setup Complete!" : "Setup Demo Data"}
						</h1>
						
						<p className="text-gray-600 mb-6">
							{isComplete 
								? "Your demo data has been created successfully. You can now test the platform."
								: "This will create sample data including clients, appointments, and workflows for testing."
							}
						</p>

						{result && (
							<div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
								<h3 className="font-medium text-gray-900 mb-2">Created:</h3>
								<ul className="text-sm text-gray-600 space-y-1">
									<li>• Organization: {result.orgId}</li>
									<li>• User: {result.userId}</li>
									<li>• 3 Demo Clients</li>
									<li>• 2 Demo Appointments</li>
									<li>• 2 Message Templates</li>
									<li>• 1 Workflow</li>
								</ul>
							</div>
						)}

						<div className="space-y-3">
							{!isComplete && (
								<Button 
									onClick={handleSetup} 
									disabled={isLoading}
									className="w-full"
								>
									{isLoading ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Setting up...
										</>
									) : (
										"Setup Demo Data"
									)}
								</Button>
							)}
							
							<Button 
								variant="outline" 
								onClick={() => window.location.href = "/"}
								className="w-full"
							>
								{isComplete ? "Go to Dashboard" : "Back to Dashboard"}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
} 