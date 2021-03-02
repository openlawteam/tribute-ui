import React, {Fragment} from 'react';

interface IProps {
  checked: boolean;
  id: string;
  label: string;
  name: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

type OtherProps = {[key: string]: any; size?: CheckboxSize};

export enum CheckboxSize {
  LARGE = 'large',
  SMALL = 'small',
}

export default function Checkbox({size, ...props}: IProps & OtherProps) {
  return (
    <Fragment>
      <input
        {...props}
        aria-checked={props.checked}
        checked={props.checked}
        className={`checkbox-input ${props.className || ''} `}
        id={props.id}
        name={props.name}
        onChange={props.onChange}
        type="checkbox"
      />

      <label className={`checkbox-label`} htmlFor={props.id}>
        <span className={`checkbox-box ${size || CheckboxSize.SMALL}`}></span>
        <span className={`checkbox-text`}>{props.label}</span>
      </label>
    </Fragment>
  );
}
