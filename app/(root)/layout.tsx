import { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { getCurrentUser, signOut } from "@/lib/actions/auth.action";
import { Button } from "@/components/ui/button";

async function handleSignOut() {
  "use server";
  await signOut();
  redirect("/sign-in");
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="root-layout">
      <nav className="flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="logo" width={38} height={32} />
          <h2 className="text-primary-100">Prepwise</h2>
        </Link>

        <div className="flex items-center gap-4">
          <p className="text-light-100 max-sm:hidden">{user.name}</p>
          <form action={handleSignOut}>
            <Button type="submit" variant="outline" size="sm" className="btn-secondary">
              Sign Out
            </Button>
          </form>
        </div>
      </nav>
      {children}
    </div>
  );
}

