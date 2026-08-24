export const metadata = {
  title: 'Blog CMS Portal | Winning Heaven',
  description: 'Winning Heaven Dedicated Blog Content Management System',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export default function BlogAdminLayout({ children }) {
  return children;
}
