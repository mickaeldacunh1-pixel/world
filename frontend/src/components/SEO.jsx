import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'World Auto France';
const SITE_URL = 'https://worldautofrance.com';
const DEFAULT_IMAGE = 'https://worldautofrance.com/og-image.jpg';

export default function SEO({
  title,
  description,
  keywords,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
  structuredData = null,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Marketplace Automobile`;
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

// Schema.org structured data helpers
export const createOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'World Auto Pro',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'Marketplace de pièces détachées automobiles et véhicules d\'occasion en France',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'FR',
  },
  sameAs: [],
});

export const createWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/annonces?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

export const createProductSchema = (listing) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: listing.title,
  description: listing.description,
  image: listing.images?.[0],
  offers: {
    '@type': 'Offer',
    price: listing.price,
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    itemCondition: listing.condition === 'neuf' 
      ? 'https://schema.org/NewCondition' 
      : 'https://schema.org/UsedCondition',
    seller: {
      '@type': listing.seller_is_pro ? 'Organization' : 'Person',
      name: listing.seller_name,
    },
  },
  category: listing.category,
  brand: listing.brand ? { '@type': 'Brand', name: listing.brand } : undefined,
});

export const createBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.url}`,
  })),
});

export const createFAQSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});
