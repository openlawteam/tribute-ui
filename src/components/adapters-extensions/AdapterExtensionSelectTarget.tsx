import React, {useState} from 'react';

import {DaoConstants} from './enums';

type AdapterExtensionTarget = DaoConstants | null;

type AdapterExtensionSelectTargetRenderActionsArgs = {
  selectedTargetOption: AdapterExtensionTarget;
  selectedTargetOptionProps: any;
};

type AdapterExtensionSelectTargetProps = {
  defaultTarget?: AdapterExtensionTarget;
  // showPropsalTargetSelector: boolean;
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
    // showPropsalTargetSelector,
    renderActions,
    renderCheckboxAction,
  } = props;

  /**
   * State
   */

  const [
    selectedTargetOption,
    setSelectedTargetOption,
  ] = useState<AdapterExtensionTarget>(defaultTarget || null);

  const [
    selectedTargetOptionProps,
    setSelectedTargetOptionProps,
  ] = useState<any>({});

  /**
   * Functions
   */

  function handleSelectTargetChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const {value} = event.target;

    setSelectedTargetOption(value as AdapterExtensionTarget);

    const selectedTarget: string = adapterOrExtension?.options.find(
      (selectedOption: any) => selectedOption.name === value
    );

    setSelectedTargetOptionProps(selectedTarget);
  }

  function renderDescription(selectedTargetOption: DaoConstants | null) {
    if (!selectedTargetOption) return null;

    const description: string = adapterOrExtension?.options.find(
      (selectedOption: any) => selectedOption.name === selectedTargetOption
    ).description;

    return <span className="adaptermanager__desc">{description}</span>;
  }

  return (
    <>
      {/* CHECKBOX ACTIONS */}
      {renderCheckboxAction({selectedTargetOption})}

      <div className="adaptermanager__info">
        {/* ADAPTER/EXTENSION TARGET DEFAULT NAME */}
        <span className="adaptermanager__name">
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
            <option key={option.name} value={option.name}>
              {option.name.toUpperCase()}
            </option>
          ))}
        </select>

        {renderDescription(selectedTargetOption)}
      </div>

      {/* BUTTON ACTIONS */}
      {renderActions({selectedTargetOption, selectedTargetOptionProps})}
    </>
  );
}
