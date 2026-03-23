import { XCircle } from "lucide-react";
import { ClayCard } from "./ClayCard";

type Props = {
  error: string | null;
  onClose: () => void;
};

export default function ErrorAlert({ error, onClose }: Props) {
  if (!error) return null;

  return (
    <ClayCard className="mb-6 border-l-4 border-red-500 bg-red-50/60">
      <div className="flex items-center gap-3">
        <XCircle className="text-red-500" size={20} />
        <p className="text-red-700 text-sm md:text-base">{error}</p>
        <button
          onClick={onClose}
          className="ml-auto text-red-500 hover:text-red-700"
          type="button"
        >
          ✕
        </button>
      </div>
    </ClayCard>
  );
}