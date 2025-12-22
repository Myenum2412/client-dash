import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { SignInPage } from "@/components/sign-in";


const page = () => {
  
  return (
    <MaxWidthWrapper>
      <div className="flex items-center justify-center h-screen max-w-screen-lg mx-auto">
        <SignInPage
          heroImageSrc="/team.png"
         
        />
      </div>
    </MaxWidthWrapper>
  );
};

export default page;
