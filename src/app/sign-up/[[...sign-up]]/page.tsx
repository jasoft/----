import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary hover:bg-primary/80",
            card: "shadow-none",
          },
        }}
      />
    </div>
  );
}
