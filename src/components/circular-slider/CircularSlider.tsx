import { useRef, useState, useCallback, useEffect, type FC } from "react";

interface CircularSliderProps {
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  trailColor?: string;
  value?: number;
  max?: number;
  onChange?: (value: number) => void;
}

const CircularSlider: FC<CircularSliderProps> = ({
  size = 56,
  strokeWidth = 6,
  strokeColor = "#1677ff",
  trailColor = "#e5e7eb",
  value = 0,
  max = 100,
  onChange,
}) => {
  const [rawValue, setRawValue] = useState(value);
  const dragging = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const rawRef = useRef(rawValue);
  const prevAngleRef = useRef(0);

  const sync = (v: number) => {
    rawRef.current = v;
    setRawValue(v);
    onChange?.(v);
  };

  useEffect(() => {
    rawRef.current = value;
    setRawValue(value);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = rawValue / max;
  const dashOffset = circumference - percent * circumference;

  const getAngle = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return 0;
      const rect = svgRef.current.getBoundingClientRect();
      const x = clientX - rect.left - center;
      const y = clientY - rect.top - center;
      let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      return angle;
    },
    [center]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    const angle = getAngle(e.clientX, e.clientY);
    prevAngleRef.current = angle;
    const val = Math.round((angle / 360) * max);
    sync(val);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current) return;
      const angle = getAngle(e.clientX, e.clientY);
      let delta = angle - prevAngleRef.current;

      // 处理跨越 0°/360° 边界：角度跳变 > 180° 说明是回绕，修正方向
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      prevAngleRef.current = angle;

      const valueDelta = (delta / 360) * max;
      const newVal = Math.round(
        Math.max(0, Math.min(max, rawRef.current + valueDelta))
      );
      sync(newVal);
    },
    [getAngle, max]
  );

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleAngle = percent * 360 - 90;
  const handleRad = (handleAngle * Math.PI) / 180;
  const handleX = center + radius * Math.cos(handleRad);
  const handleY = center + radius * Math.sin(handleRad);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      className="cursor-pointer select-none"
      onMouseDown={handleMouseDown}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trailColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: dragging.current ? "none" : "stroke-dashoffset 0.15s ease" }}
      />
      {rawValue > 0 && (
        <circle
          cx={handleX}
          cy={handleY}
          r={strokeWidth / 2 + 1}
          fill="white"
          stroke={strokeColor}
          strokeWidth={2}
        />
      )}
    </svg>
  );
};

export default CircularSlider;
