import {useState} from 'react';

type SliderProps = {
  max: number;
  min: number;
  step: number;
};

/**
 * Slider
 *
 * @param {SliderProps} props
 */
export default function Slider(
  props: SliderProps & React.InputHTMLAttributes<HTMLInputElement>
) {
  const {defaultValue, max, min, name, onChange, step, ...restProps} = props;

  const [value, setValue] = useState<string>();

  function handleOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);

    onChange && onChange(event);
  }

  return (
    <input
      {...restProps}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Number(value)}
      max={max}
      min={min}
      name={name}
      onChange={handleOnChange}
      step={step}
      type="range"
      value={value || defaultValue}
    />
  );
}
