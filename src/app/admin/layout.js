export const metadata = {
  title: 'Secure Workspace | Winning Heaven Admin',
  description: 'Winning Heaven Administrator Management Workspace',
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

export default function AdminLayout({ children }) {
  return children;
}
