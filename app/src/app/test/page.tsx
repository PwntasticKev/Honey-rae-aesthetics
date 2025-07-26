"use client";

export default function TestPage() {
	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="bg-white rounded-lg shadow-lg p-8 text-center">
				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					Honey Rae Aesthetics - Test Page
				</h1>
				<p className="text-gray-600 mb-6">
					This is a simple test page to verify the application is working.
				</p>
				<div className="space-y-4">
					<div className="p-4 bg-green-100 rounded-lg">
						<h2 className="font-semibold text-green-800">✅ Application Status</h2>
						<p className="text-green-700">Next.js is running successfully</p>
					</div>
					<div className="p-4 bg-blue-100 rounded-lg">
						<h2 className="font-semibold text-blue-800">🔧 Next Steps</h2>
						<p className="text-blue-700">
							Visit <a href="/setup" className="underline">/setup</a> to initialize demo data
						</p>
					</div>
				</div>
			</div>
		</div>
	);
} 