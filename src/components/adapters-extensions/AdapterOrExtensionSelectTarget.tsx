import React, {useState} from 'react';

import {DaoAdapterConstants, DaoExtensionConstants} from './enums';

type AdapterExtensionTarget =
  | DaoAdapterConstants
  | DaoExtensionConstants
  | null;

type AdapterExtensionSelectTargetRenderActionsArgs = {
  selectedTargetOption: AdapterExtensionTarget;
  selectedTargetOptionProps: any;
};

type AdapterExtensionSelectTargetProps = {
  defaultTarget?: AdapterExtensionTarget;
  adapterOrExtension: Record<string, any>;
  renderActions: (
    a: AdapterExtensionSelectTargetRenderActionsArgs
  ) => JSX.Element | null;
  renderCheckboxAction: (a: {
    selectedTargetOption: AdapterExtensionTarget;
  }) => JSX.Element | null;
};

/**
 * AdapterExtensionSelectTarget
 *
 * Displays a drop-down confirm list with options to
 * choose to from the defined list of options in `./config.ts`

 *
 * @param {AdapterExtensionSelectTargetProps} props
 * @returns {JSX.Element}
 */
export default function AdapterExtensionSelectTarget(
  props: AdapterExtensionSelectTargetProps
) {
  const {
    adapterOrExtension,
    defaultTarget,
    renderActions,
    renderCheckboxAction,
  } = props;

  /**
   * State
   */

  const [selectedTargetOption, setSelectedTargetOption] =
    useState<AdapterExtensionTarget>(defaultTarget || null);

  const [selectedTargetOptionProps, setSelectedTargetOptionProps] =
    useState<any>({});

  /**
   * Functions
   */

  function handleSelectTargetChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const {value} = event.target;

    setSelectedTargetOption(value as AdapterExtensionTarget);

    const selectedTargetProps: string = adapterOrExtension?.options.find(
      (selectedOption: any) => selectedOption.displayName === value
    );

    setSelectedTargetOptionProps(selectedTargetProps);
  }

  function renderDescription(
    selectedTargetOption: DaoAdapterConstants | DaoExtensionConstants | null
  ) {
    if (!selectedTargetOption) return null;

    try {
      const description: string =
        adapterOrExtension?.options.find(
          (selectedOption: any) =>
            selectedOption.displayName === selectedTargetOption
        ).description || '';

      return <span className="adapter-extension__desc">{description}</span>;
    } catch (error) {
      console.warn(error);
    }
  }

  return (
    <>
      <div className="adapter-extension__inner-wrapper ">
        {/* CHECKBOX ACTIONS */}
        {renderCheckboxAction({selectedTargetOption})}

        <div className="adapter-extension__info">
          {/* ADAPTER/EXTENSION TARGET DEFAULT NAME */}
          <span className="adapter-extension__name">
            {adapterOrExtension?.optionDefaultTarget}
            {adapterOrExtension?.isExtension && '(EXTENSION)'}
          </span>

          {/* CHOOSE ADAPTER/EXTENSION TARGET */}
          <select className="select" onChange={handleSelectTargetChange}>
            <option
              key={'adapterOrExtensionSelect'}
              value=""
              disabled={selectedTargetOption !== null}>
              Select a {adapterOrExtension?.optionDefaultTarget} type&hellip;
            </option>

            {adapterOrExtension?.options.map((option: any) => (
              <option key={option.displayName} value={option.displayName}>
                {option.displayName.toUpperCase()}
              </option>
            ))}
          </select>

          {renderDescription(selectedTargetOption)}
        </div>
      </div>

      {/* BUTTON ACTIONS */}
      {renderActions({selectedTargetOption, selectedTargetOptionProps})}
    </>
  );
}
