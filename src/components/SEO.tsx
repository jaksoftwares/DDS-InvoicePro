import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  keywords?: string;
  image?: string;
  type?: string;
  children?: React.ReactNode;
  structuredData?: object;
}

const defaultTitle = 'InvoicePro | Seamless Business Invoicing & Management';
const defaultDescription =
  'InvoicePro helps businesses generate professional invoices, manage clients, and streamline billing with ease. Try our modern, responsive invoicing solution.';
const defaultImage = '/logo192.png'; // Update with your logo path
const defaultType = 'website';
const defaultKeywords = 'invoice, business, billing, PDF, client management, SaaS, finance, invoice generator';

const SEO: React.FC<SEOProps> = ({
  title = defaultTitle,
  description = defaultDescription,
  canonical,
  keywords = defaultKeywords,
  image = defaultImage,
  type = defaultType,
  children,
  structuredData,
}) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="keywords" content={keywords} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content={type} />
    <meta property="og:image" content={image} />
    <meta property="og:url" content={canonical || (typeof window !== 'undefined' ? window.location.href : '')} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />
    {canonical && <link rel="canonical" href={canonical} />}
    {structuredData && (
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    )}
    {children}
  </Helmet>
);

export default SEO;
