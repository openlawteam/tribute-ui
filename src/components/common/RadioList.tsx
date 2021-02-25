import React, {useEffect, useState} from 'react';
import {useFormContext} from 'react-hook-form';

type RadioListProps = {
  items: string[];
  itemsText?: string[];
};

/**
 * RadioList
 *
 * @param {RadioListProps} props
 */
export default function RadioList(
  props: RadioListProps & React.InputHTMLAttributes<HTMLInputElement>
) {
  const {defaultValue, items, itemsText, ...restProps} = props;

  const formContext = useFormContext();
  const {register, unregister} = formContext || {};
  const [value, setValue] = useState(defaultValue);

  // react-hook-form possible registration of field
  useEffect(() => {
    formContext && props.name && register(props.name);

    return () => {
      formContext && props.name && unregister(props.name);
    };
    /**
     * Disable hooks checks for now as I think adding more causes issues.
     * Copying the react-hook-form examples as per GH support issues.
     */
    /* eslint-disable-next-line */
  }, [register]);

  function handleOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
    props.onChange && props.onChange(event);
  }

  return (
    <>
      {(itemsText || items).map((item, i) => (
        <label className="radiolist-label org-radiolist-label" key={item}>
          <input
            {...restProps}
            aria-checked={value === items[i]}
            checked={value === items[i]}
            className="radiolist-input org-radiolist-input"
            name={props.name}
            onChange={handleOnChange}
            type="radio"
            value={items[i]}
          />
          {item}
        </label>
      ))}
    </>
  );
}
