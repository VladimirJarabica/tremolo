"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function BarsPerLineSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (isAutomatic: boolean, manualValue: number) => void;
}): React.JSX.Element {
  const [isAutomatic, setIsAutomatic] = useState(true);

  const handleAutomaticChange = (automatic: boolean) => {
    setIsAutomatic(automatic);
    onChange(automatic, value);
  };

  const handleManualChange = (val: number) => {
    onChange(isAutomatic, val);
  };

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <Switch
          id="automatic"
          checked={isAutomatic}
          onCheckedChange={handleAutomaticChange}
        />
        <Label htmlFor="automatic" className="text-sm text-zinc-600">
          Automatic
        </Label>
      </div>

      <div className="flex flex-1 items-center gap-3">
        <span className="text-sm text-zinc-600">Bars per line:</span>
        <Slider
          value={[value]}
          onValueChange={([val]) => handleManualChange(val)}
          min={1}
          max={25}
          step={1}
          disabled={isAutomatic}
          className="w-32"
        />
        <span className="min-w-6 text-center text-sm font-medium text-zinc-900">
          {value}
        </span>
      </div>
    </div>
  );
}
