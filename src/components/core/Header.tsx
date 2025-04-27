import Link from 'next/link';
// import { Input } from '@/components/shared/Input'; // Assuming we might add search later

export function Header() {
  return (
    <div className="container flex h-14 items-center justify-between">
      <Link href="/" className="font-bold text-lg">
        Happyplace
      </Link>
      {/* Placeholder for future navigation or actions */}
      <nav>
        {/* <Input placeholder="Search..." className="w-64" /> */}
        {/* Add other header elements here later */}
      </nav>
    </div>
  );
} 