import type { Visibility } from "@/lib/visibility";

type VisibilityPickerProps = {
  value: Visibility;
  onChange: (value: Visibility) => void;
  name: string;
  disabled?: boolean;
};

export function VisibilityPicker({ value, onChange, name, disabled }: VisibilityPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="text-sm font-medium text-zinc-800">Who can see this?</legend>
      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-900">
          <input
            type="radio"
            name={name}
            checked={value === "PRIVATE"}
            onChange={() => onChange("PRIVATE")}
          />
          Private (only you)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-900">
          <input
            type="radio"
            name={name}
            checked={value === "PUBLIC"}
            onChange={() => onChange("PUBLIC")}
          />
          Public (signed-in users)
        </label>
      </div>
    </fieldset>
  );
}
