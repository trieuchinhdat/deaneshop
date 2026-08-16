import { urlFor } from '@/sanity/lib/image'

export default function OrganizationJsonLd({ site }: { site: any }) {
	if (!site) return null

	const logoUrl = site?.logo?.image?.default
		? urlFor(site.logo.image.default).url()
		: undefined

	const sameAs = (site?.socialLinks || [])
		.map((item: any) => item?.url)
		.filter(Boolean)

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: site.companyName || site.title || 'Ecocros',
		alternateName: site.siteName || site.title,
		url: process.env.NEXT_PUBLIC_BASE_URL || 'https://ecocros.com',
		logo: logoUrl,
		contactPoint: site.hotline
			? [
					{
						'@type': 'ContactPoint',
						telephone: site.hotline,
						contactType: 'customer service',
						email: site.email,
						availableLanguage: ['Vietnamese', 'English'],
					},
			  ]
			: undefined,
		address: site.address
			? {
					'@type': 'PostalAddress',
					streetAddress: site.address,
					addressCountry: 'VN',
			  }
			: undefined,
		sameAs: sameAs.length > 0 ? sameAs : undefined,
	}

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	)
}
