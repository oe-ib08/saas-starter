import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to profile page
  redirect('/profile');
}
