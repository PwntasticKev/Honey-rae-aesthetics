import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

console.log('=== CONVEX CLIENT SETUP ===');
console.log('NEXT_PUBLIC_CONVEX_URL:', process.env.NEXT_PUBLIC_CONVEX_URL);
console.log('convexUrl:', convexUrl);
console.log('==========================');

if (!convexUrl) {
	throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

export const convex = new ConvexReactClient(convexUrl); 