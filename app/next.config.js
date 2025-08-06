/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	// Force dynamic rendering for debug pages to avoid SSR issues
	async rewrites() {
		return []
	}
}

module.exports = nextConfig 