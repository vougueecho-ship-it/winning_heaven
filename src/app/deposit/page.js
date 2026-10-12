import Home from '../page';

export const metadata = {
  title: 'Deposit Coins | Winning Heaven',
  description: 'Deposit and load coins instantly into your Winning Heaven game accounts 24/7.'
};

export default function DepositPage(props) {
  return <Home initialTab="deposit" {...props} />;
}
