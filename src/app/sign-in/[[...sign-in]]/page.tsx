import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#0b0f19]">
      <SignIn />
    </div>
  );
}
