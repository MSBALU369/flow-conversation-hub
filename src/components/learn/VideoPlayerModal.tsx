import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedUrl: string;
  title: string;
}

export function VideoPlayerModal({ open, onOpenChange, embedUrl, title }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-3 pt-10">
        <DialogHeader>
          <DialogTitle className="text-sm line-clamp-1">{title}</DialogTitle>
        </DialogHeader>
        <iframe
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full aspect-video rounded-xl border-none"
        />
      </DialogContent>
    </Dialog>
  );
}
