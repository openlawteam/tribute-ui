import React from 'react';

import {Adapters} from './types';
import AdapterConfigurationForm from './AdapterConfigurationForm';
import Modal from '../common/Modal';

import TimesSVG from '../../assets/svg/TimesSVG';

type AdapterConfiguratorModalProps = {
  abiMethodName: string;
  adapter: Adapters | undefined;
  configurationInputs: Record<string, any> | undefined;
  isOpen: boolean;
  closeHandler: () => void;
};

export default function AdapterConfiguratorModal({
  abiMethodName,
  adapter,
  configurationInputs,
  isOpen,
  closeHandler,
}: AdapterConfiguratorModalProps) {
  return (
    <Modal
      keyProp="adapter-configurator"
      modalClassNames="adapter-configurator-modal"
      isOpen={isOpen}
      isOpenHandler={() => {
        closeHandler();
      }}>
      {/* MODEL CLOSE BUTTON */}
      <>
        <span
          className="modal__close-button"
          onClick={() => {
            closeHandler();
          }}>
          <TimesSVG />
        </span>

        <h1>{adapter?.adapterName.toUpperCase()}</h1>
        <p>{adapter?.adapterDescription}</p>

        <AdapterConfigurationForm
          abiConfigurationInputs={configurationInputs}
          abiMethodName={abiMethodName}
          adapter={adapter}
          closeHandler={closeHandler}
        />
      </>
    </Modal>
  );
}
