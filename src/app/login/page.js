import Home from '../page';

export const metadata = {
  title: 'Player Login | Winning Heaven - Online Sweepstakes Casino',
  description:
    'Sign in to your Winning Heaven player account. Play GameVault 777, Juwa, Vegas Sweeps, and claim instant 24/7 cashouts.',
  robots: {
    index: false,
    follow: true
  },
  alternates: {
    canonical: 'https://winningheaven.com'
  }
};

export default function LoginPage(props) {
  return <Home initialAuthTab="login" {...props} />;
}
