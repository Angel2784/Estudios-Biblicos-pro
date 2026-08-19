import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#0b0f19]">
      <SignUp />
    </div>
  );
}
