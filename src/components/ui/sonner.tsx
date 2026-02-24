import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      position="top-center"
      closeButton
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={{ ["--normal-bg" as string]: "var(--background)" }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg !relative !pr-8",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground !mr-6",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "!absolute !-top-0 !-right-0 !left-auto !bottom-auto !transform-none !border-border !bg-muted !text-foreground hover:!bg-accent",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
