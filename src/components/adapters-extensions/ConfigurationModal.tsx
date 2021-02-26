import React from 'react';

import {AdaptersOrExtensions} from './types';
import ConfigurationForm from './ConfigurationForm';
import Modal from '../common/Modal';

import TimesSVG from '../../assets/svg/TimesSVG';

type ConfiguratorModalProps = {
  abiMethodName: string;
  adapterOrExtension: AdaptersOrExtensions | undefined;
  configurationInputs: Record<string, any> | undefined;
  isOpen: boolean;
  closeHandler: () => void;
};

export default function ConfiguratorModal({
  abiMethodName,
  adapterOrExtension,
  configurationInputs,
  isOpen,
  closeHandler,
}: ConfiguratorModalProps) {
  return (
    <Modal
      keyProp="adapter-extension-configuration"
      modalClassNames="adapter-extension-configure-modal"
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

        <h1>{adapterOrExtension?.name.toUpperCase()}</h1>
        <p>{adapterOrExtension?.description}</p>

        <ConfigurationForm
          abiConfigurationInputs={configurationInputs}
          abiMethodName={abiMethodName}
          adapterOrExtension={adapterOrExtension as AdaptersOrExtensions}
          closeHandler={closeHandler}
        />
      </>
    </Modal>
  );
}
