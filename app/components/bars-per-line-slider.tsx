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
    // Switch to manual mode when user touches the slider
    if (isAutomatic) {
      setIsAutomatic(false);
    }
    onChange(false, val);
  };

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <Switch
          id="automatic"
          checked={isAutomatic}
          onCheckedChange={handleAutomaticChange}
        />
        <Label htmlFor="automatic" className="text-sm text-[oklch(0.5_0.04_160)]">
          Automatic
        </Label>
      </div>

      <div className="flex flex-1 items-center gap-3">
        <span className="text-sm text-[oklch(0.5_0.04_160)]">Bars per line:</span>
        <Slider
          value={[value]}
          onValueChange={([val]) => handleManualChange(val)}
          min={1}
          max={25}
          step={1}
          className="w-32"
        />
        <span className="min-w-6 text-center text-sm font-medium text-[oklch(0.35_0.04_160)]">
          {value}
        </span>
      </div>
    </div>
  );
}
