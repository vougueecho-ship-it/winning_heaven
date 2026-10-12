import Home from '../page';

export const metadata = {
  title: 'Cashout Redemptions | Winning Heaven',
  description: 'Fast 24/7 cashouts and prize redemptions direct to Cash App, Venmo, Chime, Zelle, and Crypto.'
};

export default function WithdrawPage(props) {
  return <Home initialTab="withdraw" {...props} />;
}
