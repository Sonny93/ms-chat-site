/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	images: {
		domains: ['cdn.discordapp.com']
	},
	experimental: { images: { layoutRaw: true } }
}

module.exports = nextConfig;