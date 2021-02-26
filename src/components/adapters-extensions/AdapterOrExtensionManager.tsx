import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {StoreState} from '../../store/types';
import {AsyncStatus} from '../../util/types';
import {
  AddAdapterArguments,
  AddExtensionArguments,
  AdaptersOrExtensions,
} from './types';

import {DaoConstants} from './enums';

import {
  defaultAdaptersAndExtensions,
  AdaptersAndExtensionsType,
} from './config';

import {
  getAdapterOrExtensionId,
  getAccessControlLayer,
  getConfigurationABIFunction,
} from './helpers';
import {getDaoState, DaoState} from '../web3/helpers';
import {truncateEthAddress} from '../../util/helpers';

import {useAdaptersOrExtensions} from './hooks/useAdaptersOrExtensions';
import {useDao, useMemberActionDisabled} from '../../hooks';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';

import AdapterConfiguratorModal from './ConfigurationModal';
import AdapterExtensionSelectTarget from './AdapterOrExtensionSelectTarget';
import Checkbox, {CheckboxSize} from '../common/Checkbox';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import Loader from '../feedback/Loader';

enum WhyDisableModalTitles {
  FINALIZED_REASON = 'Why is finalizing disabled?',
  CONFIGURATION_REASON = 'Why are configurations disabled?',
}
/**
 * AdapterOrExtensionManager()
 *
 * This components lists all the registered and unregistered adapters/extensions
 * from the list of available adapters in the `defaultAdaptersAndExtensions` in `./config.ts`
 *
 * It allows for adding unreigsterd adapters and extensions, configurating
 * registered adapters and extensions, and finalizing the DAO.
 *
 * @note it is not possible to manage the adapters/extensions if the DAO is finalized.
 */
export default function AdapterOrExtensionManager() {
  /**
   * Selectors
   */
  const {DaoRegistryContract, DaoFactoryContract} = useSelector(
    (state: StoreState) => state.contracts
  );

  /**
   * States
   */
  const [abiMethodName, setABIMethodName] = useState<string>('');
  const [daoState, setDaoState] = useState<DaoState>();
  const [isDone, setIsDone] = useState<Record<string, boolean> | undefined>();
  const [inputParameters, setInputParameters] = useState<Record<string, any>>();
  const [submitError, setSubmitError] = useState<Error>();
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [selectionCount, setSelectionCount] = useState<number>(0);
  const [selections, setSelections] = useState<
    Record<string, boolean> | undefined
  >();
  const [configureAdapter, setConfigureAdapter] = useState<
    AdaptersOrExtensions | undefined
  >();
  const [isInProcess, setIsInProcess] = useState<
    Record<string, boolean> | undefined
  >();
  const [whyDisabledReason, setWhyDisabledReason] = useState<
    WhyDisableModalTitles | undefined
  >();

  /**
   * Hooks
   */
  const {account} = useWeb3Modal();
  const {
    adapterExtensionStatus,
    getAdapterOrExtensionFromRedux,
    registeredAdaptersOrExtensions,
    unRegisteredAdaptersOrExtensions,
  } = useAdaptersOrExtensions();
  const {dao, gqlError} = useDao();

  const {
    // txError,
    // txEtherscanURL,
    // txIsPromptOpen,
    txSend,
    // txStatus,
  } = useContractSend();
  const gasPrices = useETHGasPrice();
  const {
    isDisabled,
    openWhyDisabledModal,
    setOtherDisabledReasons,
    WhyDisabledModal,
  } = useMemberActionDisabled();

  /**
   * Variables
   */
  const isDAOExisting = dao;
  // grammatically naming is incorrect :)
  const isAdaptersUnavailable =
    adapterExtensionStatus === AsyncStatus.REJECTED &&
    registeredAdaptersOrExtensions === undefined &&
    unRegisteredAdaptersOrExtensions === undefined;
  const isLoadingAdapters = adapterExtensionStatus === AsyncStatus.PENDING;
  // @todo track the prior selection of a dropdown target
  // let priorSelectedTargetOption: DaoConstants | null = null;

  const checkDaoStateCached = useCallback(checkDaoState, [
    DaoRegistryContract,
    dao?.name,
    setOtherDisabledReasons,
  ]);

  // Check the Dao state
  useEffect(() => {
    checkDaoStateCached();
  }, [checkDaoStateCached, DaoRegistryContract]);

  // Sets the initial checkbox selections for non-registered adapters to `false`
  // and sets the `Select All` checkbox to disabled if no adapters are available
  useEffect(() => {
    // Set the select all check to false by default
    setSelectAll(false);

    if (!unRegisteredAdaptersOrExtensions) return;

    unRegisteredAdaptersOrExtensions &&
      unRegisteredAdaptersOrExtensions?.forEach(
        (adapter: Record<string, any>) => {
          // only add a selection if it doesn't have nested `options`
          !adapter?.options &&
            setSelections((prevState: Record<string, boolean> | undefined) => ({
              ...prevState,
              [adapter.name]: false,
            }));
        }
      );
  }, [isDisabled, unRegisteredAdaptersOrExtensions]);

  // Updates checkbox selection counter when user selects a checkbox
  useEffect(() => {
    selections &&
      setSelectionCount(
        Object.values(selections).filter((adapter: boolean) => adapter === true)
          .length
      );
  }, [selections]);

  async function checkDaoState() {
    if (!DaoRegistryContract) {
      return;
    }

    try {
      const finalizedMessage = `${dao?.name} is already finalized`;

      const daoRegistryState = await getDaoState(DaoRegistryContract.instance);
      setDaoState(daoRegistryState);

      daoRegistryState === DaoState.READY &&
        setOtherDisabledReasons([finalizedMessage]);
    } catch (error) {
      setDaoState(undefined);
    }
  }

  /**
   * handleAddAdapter
   *
   * @param adapter
   */
  function handleAddAdapter(adapter: Record<string, any>): void {
    const adapterOrExtensionAddress = new Promise<any>((resolve, reject) => {
      try {
        // Get contract address
        const {contractAddress} = getAdapterOrExtensionFromRedux(
          adapter.name as DaoConstants
        );

        resolve(contractAddress);
      } catch (error) {
        // try and get the default contract address from the arg `adapter`
        const contractAddress = adapter.contractAddress;

        if (contractAddress) {
          resolve(contractAddress);
        } else {
          reject(error);
        }
      }
    });

    adapterOrExtensionAddress
      .then((contractAddress: string) => {
        addAdapterOrExtension(contractAddress, adapter.name, 'ADAPTER');
      })
      .catch((error) => {
        console.warn(
          `Dao adapter contract not found, try adding the default "${adapter.name}" contract`
        );
      });
  }

  function handleAddExtension(extension: any): void {
    const adapterOrExtensionAddress = new Promise<any>((resolve, reject) => {
      try {
        // Get contract address
        const {contractAddress} = getAdapterOrExtensionFromRedux(
          extension.name as DaoConstants
        );

        resolve(contractAddress);
      } catch (error) {
        // try and get the default contract address
        // from the arg `adapter` or  `extension`
        const contractAddress = extension.contractAddress;

        if (contractAddress) {
          resolve(contractAddress);
        } else {
          reject(error);
        }
      }
    });

    adapterOrExtensionAddress
      .then((contractAddress: string) => {
        addAdapterOrExtension(contractAddress, extension.name, 'EXTENSION');
      })
      .catch((error) => {
        console.warn(
          `Dao extension contract not found, try adding the default "${extension.name}" contract`,
          error
        );
      });
  }

  async function addAdapterOrExtension(
    adapterOrExtensionAddress: string,
    adapterOrExtensionName: DaoConstants,
    adapterOrExtensionType: 'ADAPTER' | 'EXTENSION'
  ): Promise<void> {
    setSubmitError(undefined);

    if (!DaoRegistryContract) return;

    try {
      setIsInProcess((prevState) => ({
        ...prevState,
        [adapterOrExtensionName]: true,
      }));

      if (!adapterOrExtensionAddress) {
        throw new Error(`${adapterOrExtensionType} address must not be empty`);
      }

      // 1. Get the bytes32 hash of the adapter name
      const adapterOrExtensionId = getAdapterOrExtensionId(
        adapterOrExtensionName
      );

      // 2. Get adapters access control layer (acl)
      // these are the functions the adapter will have access to
      const {acl} = getAccessControlLayer(adapterOrExtensionName);

      // 3. Contract the function arguments base of its type
      const addAdapterOrExtensionArguments:
        | AddAdapterArguments
        | AddExtensionArguments =
        adapterOrExtensionType === 'ADAPTER'
          ? [adapterOrExtensionId, adapterOrExtensionAddress, acl]
          : [adapterOrExtensionId, adapterOrExtensionAddress, account];

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      const txSendMethod =
        adapterOrExtensionType === 'ADAPTER' ? 'addAdapter' : 'addExtension';

      // Execute contract call for `addAdapter` or `addExtension`
      await txSend(
        txSendMethod,
        DaoRegistryContract.instance.methods,
        addAdapterOrExtensionArguments,
        txArguments
      );

      setIsInProcess((prevState) => ({
        ...prevState,
        [adapterOrExtensionName]: false,
      }));
      setIsDone((prevState) => ({
        ...prevState,
        [adapterOrExtensionName]: true,
      }));

      // @todo re-initContracts
    } catch (error) {
      setIsInProcess((prevState) => ({
        ...prevState,
        [adapterOrExtensionName]: false,
      }));

      const errorMessage = new Error(
        error && error?.code === 4001
          ? error.message
          : `Unable to add ${adapterOrExtensionName} ${adapterOrExtensionType}; ${error}`
      );
      setSubmitError(errorMessage);
    }
  }

  /**
   * handleAddSelectedAdapters()
   *
   * This function only adds adapters, not extensions
   */
  async function handleAddSelectedAdapters(): Promise<void> {
    setSubmitError(undefined);

    if (!DaoFactoryContract) {
      throw new Error('DaoFactoryContract not found');
    }

    try {
      let adaptersArguments: AddAdapterArguments[] = [];

      // Set the `Add` button states to true for all selected adapters
      for (const adapterName in selections) {
        if (selections[adapterName]) {
          // @todo check for extension
          // Get adapterOrExtensionId from `defaultAdaptersAndExtensions`
          const {
            adapterId,
          }: AdaptersAndExtensionsType = defaultAdaptersAndExtensions.filter(
            (a: AdaptersAndExtensionsType) => a.name === adapterName
          )[0];

          // Get adapter contract address
          const {contractAddress} = getAdapterOrExtensionFromRedux(
            adapterName as DaoConstants
          );

          // Get adapters access control layer (acl)
          // these are the functions the adapter will have access to
          const {acl} = getAccessControlLayer(adapterName);

          // skip if adapterId undefined
          adapterId &&
            adaptersArguments.push([adapterId, contractAddress, acl]);

          setIsInProcess((prevState) => ({
            ...prevState,
            [adapterName]: true,
          }));
        }
      }

      const addAdaptersArguments: [string, AddAdapterArguments[]] = [
        dao?.daoAddress,
        adaptersArguments,
      ];

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `addAdapters`
      await txSend(
        'addAdapters',
        DaoFactoryContract.instance.methods,
        addAdaptersArguments,
        txArguments
      );

      // enable buttons @todo
      // re-init contracts @todo
    } catch (error) {
      const errorMessage = new Error(
        error && error?.code === 4001
          ? error.message
          : `Unable to add adapters; ${error}`
      );
      setSubmitError(errorMessage);

      // reset all the checkboxes for the selected adapters
      checkboxesSelection(false);
      // reset all the buttons for the selected adapters
      for (const adapterName in selections) {
        setIsInProcess((prevState) => ({
          ...prevState,
          [adapterName]: false,
        }));
      }
    }
  }

  /**
   * configureAdapter
   *
   * @param adapter
   */
  async function handleConfigure(
    adapterOrExtension: AdaptersOrExtensions
  ): Promise<void> {
    setSubmitError(undefined);

    try {
      // Get ABI function name
      const abiFunctionName: string = getConfigurationABIFunction()[
        adapterOrExtension.name
      ];
      // Get adapters/extension ABI
      const {abi} = getAdapterOrExtensionFromRedux(adapterOrExtension.name);
      // Get adapters/extension configure function input parameters
      const {inputs} = abi.filter(
        (p: Record<string, any>) => p.name === abiFunctionName
      )[0];

      setABIMethodName(abiFunctionName);
      setConfigureAdapter(adapterOrExtension);
      setInputParameters(inputs);
      setOpenModal(true);
    } catch (error) {
      const errorMessage = new Error(
        error && error?.code === 4001
          ? error.message
          : `${adapterOrExtension.name} contract not found`
      );
      setSubmitError(errorMessage);
    }
  }

  /**
   * confirmFinalizePrompt
   */
  function confirmFinalizePrompt(): void {
    if (window.confirm('Do you really want to finalize this DAO?')) {
      handleFinalizeDao();
    }
  }

  async function handleFinalizeDao(): Promise<void> {
    window.alert(`Sorry, finalizing isn't ready yet!`);

    try {
      // get getDaoState when done
    } catch (error) {}
  }

  // Handles the select all checkbox event
  function handleOnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    checkboxesSelection(event.target.checked);
  }

  function checkboxesSelection(checked: boolean): void {
    // Update the select all checkbox
    setSelectAll(checked);

    // Update all un-registered adapter/extension
    for (const key in selections) {
      setSelections((s) => ({
        ...s,
        [key]: checked,
      }));
    }
  }

  function handleSelectTargetChange({event, selectedTargetOption}: any): void {
    // update the prior selected target to track the change
    // so we can remove the old target from checkbox `selections`

    // @todo Remove previously selected target if its from an `options` list

    setSelections((s) => ({
      ...s,
      [selectedTargetOption]: event.target.checked,
    }));
  }

  function renderDaoName() {
    if (!dao && gqlError) {
      window.scrollTo({
        top: 0,
        left: 200,
        behavior: 'smooth',
      });

      return (
        <ErrorMessageWithDetails
          error={gqlError}
          renderText="Something went wrong"
        />
      );
    }

    if (dao) {
      return (
        <h2>
          {dao.name} <small>{truncateEthAddress(dao.daoAddress, 7)}</small>
        </h2>
      );
    }
  }

  function renderErrorMessage() {
    if (submitError) {
      window.scrollTo({
        top: 0,
        left: 200,
        behavior: 'smooth',
      });

      return (
        <ErrorMessageWithDetails
          error={submitError}
          renderText="Something went wrong"
        />
      );
    } else {
      return <></>;
    }
  }

  return (
    <div className="adaptermanager">
      <h1>Adapter/Extension Manager</h1>
      {renderDaoName()}
      {renderErrorMessage()}
      <p>
        Nulla aliquet porttitor venenatis. Donec a dui et dui fringilla
        consectetur id nec massa. Aliquam erat volutpat. Sed ut dui ut lacus
        dictum fermentum vel tincidunt neque. Sed sed lacinia...
      </p>
      <div className="adapter-extension__selection">
        <div>
          <Checkbox
            id="selectAll"
            label={`${selectionCount} selected`}
            checked={selectAll === true}
            disabled={
              isAdaptersUnavailable ||
              isDisabled || // connected user is not an active member
              unRegisteredAdaptersOrExtensions?.length === 0 || // nothing left to register
              !isDAOExisting
              /* @todo 
              - disable when selection is processing 
              - disable when there are no more unused adapters to select
              */
            }
            name="selectAll"
            size={CheckboxSize.LARGE}
            onChange={handleOnChange}
          />
        </div>
        <div>
          <button
            className="button--secondary"
            disabled={selectionCount === 0 || isDisabled}
            onClick={handleAddSelectedAdapters}>
            Add selected
          </button>
        </div>
      </div>

      {isLoadingAdapters && <Loader text="Loading data from subgraph..." />}
      {isAdaptersUnavailable && <p>No adapters available</p>}

      {/** UNUSED ADAPTERS AND EXTENSIONS TO ADD */}
      {isDAOExisting &&
        unRegisteredAdaptersOrExtensions &&
        unRegisteredAdaptersOrExtensions?.length > 0 &&
        unRegisteredAdaptersOrExtensions.map(
          (adapter: Record<string, any>, idx: number) => (
            <div className="adapter-extension__grid unregistered" key={idx}>
              {/** RENDER ADAPTER/EXTENSION DROPDOWN */}
              {adapter?.options ? (
                <AdapterExtensionSelectTarget
                  adapterOrExtension={adapter}
                  renderCheckboxAction={({selectedTargetOption}) => {
                    return (
                      <>
                        <div className="adapter-extension__checkbox">
                          <Checkbox
                            id={selectedTargetOption || 'empty'}
                            label={''}
                            checked={
                              (selectedTargetOption &&
                                selections &&
                                selections[selectedTargetOption] === true) ||
                              false
                            }
                            disabled={
                              isDisabled ||
                              selectedTargetOption === null ||
                              adapter?.isExtension
                            }
                            name={selectedTargetOption || ''}
                            size={CheckboxSize.LARGE}
                            onChange={(event) => {
                              selectedTargetOption &&
                                handleSelectTargetChange({
                                  event,
                                  selectedTargetOption,
                                });
                            }}
                          />
                        </div>
                      </>
                    );
                  }}
                  renderActions={({
                    selectedTargetOption,
                    selectedTargetOptionProps,
                  }) => {
                    return (
                      <>
                        <div className="adapter-extension__add">
                          <button
                            className="button--secondary"
                            disabled={
                              selectedTargetOption === null ||
                              (isInProcess &&
                                isInProcess[selectedTargetOptionProps.name]) ||
                              isDisabled
                            }
                            onClick={() =>
                              selectedTargetOptionProps?.isExtension
                                ? handleAddExtension(selectedTargetOptionProps)
                                : handleAddAdapter(selectedTargetOptionProps)
                            }>
                            {isInProcess &&
                            isInProcess[selectedTargetOptionProps.name] ? (
                              <Loader />
                            ) : isDone &&
                              isDone[selectedTargetOptionProps.name] ? (
                              'Done'
                            ) : (
                              'Add'
                            )}
                          </button>
                        </div>
                      </>
                    );
                  }}
                />
              ) : (
                <>
                  {/** RENDER ADAPTER/EXTENSION */}
                  <div className="adapter-extension__checkbox">
                    <Checkbox
                      id={adapter.name}
                      label={''}
                      checked={
                        (selections && selections[adapter.name] === true) ||
                        false
                      }
                      disabled={isDisabled}
                      name={adapter.name}
                      size={CheckboxSize.LARGE}
                      onChange={(event) => {
                        setSelections((s) => ({
                          ...s,
                          [adapter.name]: event.target.checked,
                        }));
                      }}
                    />
                  </div>

                  <div className="adapter-extension__info">
                    <span className="adapter-extension__name">
                      {adapter.name} {adapter?.isExtension && '(EXTENSION)'}
                    </span>
                    <span className="adapter-extension__desc">
                      {adapter.description}
                    </span>
                  </div>

                  <div className="adapter-extension__add">
                    <button
                      className="button--secondary"
                      disabled={
                        (isInProcess && isInProcess[adapter.name]) || isDisabled
                      }
                      onClick={() =>
                        adapter?.isExtension
                          ? handleAddExtension(adapter)
                          : handleAddAdapter(adapter)
                      }>
                      {isInProcess && isInProcess[adapter.name] ? (
                        <Loader />
                      ) : isDone && isDone[adapter.name] ? (
                        'Done'
                      ) : (
                        'Add'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        )}

      {/** CURRENTLY USED ADAPTERS/EXTENSIONS TO CONFIGURE OR REMOVE */}
      {isDAOExisting &&
        registeredAdaptersOrExtensions &&
        registeredAdaptersOrExtensions?.length > 0 &&
        registeredAdaptersOrExtensions.map(
          (adapterOrExtension: Record<string, any>, idx: number) => (
            <div
              className="adapter-extension__grid registered"
              key={`${adapterOrExtension.id}-${idx}`}>
              <div className="adapter-extension__info">
                <span className="adapter-extension__name">
                  {adapterOrExtension.name}{' '}
                  {adapterOrExtension?.isExtension && '(EXTENSION)'}
                </span>
                <span className="adapter-extension__desc">
                  {adapterOrExtension.description}
                </span>
              </div>

              <div className="adapter-extension__configure">
                <button
                  className="button--secondary"
                  disabled={isDisabled || adapterOrExtension?.isExtension}
                  onClick={() =>
                    handleConfigure(adapterOrExtension as AdaptersOrExtensions)
                  }>
                  Configure
                </button>
              </div>
            </div>
          )
        )}

      {isDisabled && (
        <div>
          <button
            className="button--help"
            onClick={() => {
              openWhyDisabledModal();
              setWhyDisabledReason(WhyDisableModalTitles.CONFIGURATION_REASON);
            }}>
            {WhyDisableModalTitles.CONFIGURATION_REASON}
          </button>
        </div>
      )}

      <div className="adapter-adapter-extension__finalize">
        <p>
          If you're happy with your setup, you can finalize your DAO. After your
          DAO is finalized you will need to submit a proposal to make changes.
        </p>
        <div>
          <button
            className="button--secondary finalize"
            disabled={
              isAdaptersUnavailable ||
              !isDAOExisting ||
              daoState === DaoState.READY
              /* @todo 
              - also disable when selection is processing 
              - when there are no more unused adapters to select
              */
            }
            onClick={confirmFinalizePrompt}>
            Finalize Dao
          </button>
        </div>

        {isDisabled && (
          <div>
            <button
              className="button--help"
              onClick={() => {
                openWhyDisabledModal();

                setWhyDisabledReason(WhyDisableModalTitles.FINALIZED_REASON);
              }}>
              {WhyDisableModalTitles.FINALIZED_REASON}
            </button>
          </div>
        )}

        <WhyDisabledModal title={whyDisabledReason} />
      </div>

      {openModal && (
        <AdapterConfiguratorModal
          abiMethodName={abiMethodName}
          adapter={configureAdapter}
          configurationInputs={inputParameters}
          isOpen={openModal}
          closeHandler={() => {
            setOpenModal(false);
          }}
        />
      )}
    </div>
  );
}
