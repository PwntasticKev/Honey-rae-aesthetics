import type { Metadata } from "next";
import "./globals.css";
import { ConvexProviderWrapper } from "@/components/ConvexProvider";

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
				<ConvexProviderWrapper>
					{children}
				</ConvexProviderWrapper>
			</body>
		</html>
	);
}
