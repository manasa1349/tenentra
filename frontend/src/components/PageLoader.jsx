import { ClipLoader } from 'react-spinners';

export default function PageLoader({ text = 'Loading...' }) {
  return (
    <div className='page loader-page'>
      <div className='loader-card'>
        <ClipLoader size={34} color='#4f8ea0' speedMultiplier={0.9} />
        <p>{text}</p>
      </div>
    </div>
  );
}
