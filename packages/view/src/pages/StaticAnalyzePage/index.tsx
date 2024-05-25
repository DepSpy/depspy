import GridBackground from "@/components/GridBack";
import { GithubIcon, LanguageIcon, ThemeIcon } from "@/components/Icon";
import Skeleton from "@/components/Skeleton";
import StaticTree from "@/components/StaticTree";
import { useStaticStore } from "@/contexts";

export default function StaticAnalyzePage() {
  const { staticRootLoading, staticRoot } = useStaticStore();
  if (staticRootLoading && !staticRoot) {
    return <Skeleton></Skeleton>;
  }
  return (
    <main className="w-screen h-screen overflow-hidden">
      <div className="fixed">
        <StaticTree />
      </div>
      <div className="fixed -z-50 bg-bg-container">
        <GridBackground></GridBackground>
      </div>
      <div className="fixed flex p-5">
        <LanguageIcon />
        <ThemeIcon />
        <GithubIcon />
      </div>
    </main>
  );
}
