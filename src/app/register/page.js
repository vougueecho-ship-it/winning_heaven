import Home from '../page';

export const metadata = {
  title: 'Sign Up & Get $3 Freeplay Bonus | Winning Heaven',
  description:
    'Create your free Winning Heaven player account today. Claim instant $3 freeplay signup bonus on GameVault, Juwa, and Vegas Sweeps!',
  robots: {
    index: false,
    follow: true
  },
  alternates: {
    canonical: 'https://winningheaven.com'
  }
};

export default function RegisterPage(props) {
  return <Home initialAuthTab="register" {...props} />;
}
