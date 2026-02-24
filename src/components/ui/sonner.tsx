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
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:relative",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "group-[.toast]:!absolute group-[.toast]:!top-1 group-[.toast]:!right-1 group-[.toast]:!left-auto group-[.toast]:!transform-none group-[.toast]:!border-border group-[.toast]:!bg-muted group-[.toast]:!text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
