import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Honey Rae Aesthetics",
	description: "Complete aesthetics practice management platform",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>
				{children}
			</body>
		</html>
	);
}
