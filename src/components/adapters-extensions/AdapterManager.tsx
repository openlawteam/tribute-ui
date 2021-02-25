import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {StoreState} from '../../store/types';
import {AsyncStatus} from '../../util/types';
import {AddAdapterArguments, Adapters} from './types';

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

import {useAdapters} from './hooks/useAdapters';
import {useDao, useMemberActionDisabled} from '../../hooks';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';

import AdapterConfiguratorModal from './AdapterConfiguratorModal';
import AdapterExtensionSelectTarget from './AdapterExtensionSelectTarget';
import Checkbox, {CheckboxSize} from '../common/Checkbox';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import Loader from '../feedback/Loader';

enum WhyDisableModalTitles {
  FINALIZED_REASON = 'Why is finalizing disabled?',
  ADAPTERS_REASON = 'Why are configurations disabled?',
}
/**
 * AdapterManager()
 *
 * This components lists all the registered and unregistered adapters
 * from the list of available adapters in the `daoConstants` in `./config.ts`
 *
 * It allows for adding unregisted adapters, configurating registered adapters
 * and finalizing the DAO.
 *
 * @note it is not possible to manage the adapters if the DAO is finalized.
 */
export default function AdapterManager() {
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
    Adapters | undefined
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
    adapterStatus,
    getAdapterFromRedux,
    registeredAdapters,
    unRegisteredAdapters,
  } = useAdapters();
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
    adapterStatus === AsyncStatus.REJECTED &&
    registeredAdapters === undefined &&
    unRegisteredAdapters === undefined;
  const isLoadingAdapters = adapterStatus === AsyncStatus.PENDING;
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

    if (!unRegisteredAdapters) return;

    unRegisteredAdapters &&
      unRegisteredAdapters?.forEach((adapter: Record<string, any>) => {
        // only add a selection if it doesn't have nested `options`
        !adapter?.options &&
          setSelections((prevState: Record<string, boolean> | undefined) => ({
            ...prevState,
            [adapter.name]: false,
          }));
      });
  }, [isDisabled, unRegisteredAdapters]);

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
  function handleAddAdapter(adapter: Record<string, any>) {
    console.log('handleAddAdapter: adapter', adapter);
    const adapterOrExtensionAddress = new Promise<any>((resolve, reject) => {
      try {
        // Get contract address
        const {contractAddress} = getAdapterFromRedux(
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
      .then((addr: string) => {
        addAdapterOrExtension(addr, adapter.name);
      })
      .catch((error) => {
        console.warn(
          `Dao adapter contract not found, try adding the default "${adapter.name}" contract`
        );
      });
  }

  async function handleAddExtension(extension: any) {
    console.log('add extension', extension);

    // can bank extension be configured?
    // to remove use `removeExtension`
    // pass type

    //  Inputs:
    // [0]bytes32 extensionId
    // [1]address extension - contractAddr
    // [2]address creator - connectedUser
  }

  async function addAdapterOrExtension(
    contractAddress: string,
    adapterName: DaoConstants
  ) {
    setSubmitError(undefined);

    if (!DaoRegistryContract) return;

    try {
      setIsInProcess((prevState) => ({
        ...prevState,
        [adapterName]: true,
      }));

      if (!contractAddress) {
        throw new Error('adapterAddress must not be empty');
      }

      // 1. Get the bytes32 hash of the adapter name
      const adapterId = getAdapterOrExtensionId(adapterName);

      // 2. Get adapters access control layer (acl)
      // these are the functions the adapter will have access to
      const {acl} = getAccessControlLayer(adapterName);

      const addAdapterArguments: AddAdapterArguments = [
        adapterId,
        contractAddress,
        acl,
      ];

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `addAdapter` or `addExtension` @todo
      await txSend(
        'addAdapter',
        DaoRegistryContract.instance.methods,
        addAdapterArguments,
        txArguments
      );

      setIsInProcess((prevState) => ({
        ...prevState,
        [adapterName]: false,
      }));
      setIsDone((prevState) => ({
        ...prevState,
        [adapterName]: true,
      }));

      // @todo re-initContracts
    } catch (error) {
      setIsInProcess((prevState) => ({
        ...prevState,
        [adapterName]: false,
      }));

      const errorMessage = new Error(
        error && error?.code === 4001
          ? error.message
          : `Unable to add ${adapterName} adapter`
      );
      setSubmitError(errorMessage);
    }
  }

  async function handleAddSelectedAdapters() {
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
          const {contractAddress} = getAdapterFromRedux(
            adapterName as DaoConstants
          );

          // Get adapters access control layer (acl)
          // these are the functions the adapter will have access to
          const {acl} = getAccessControlLayer(adapterName);

          // @todo skip if adapterId undefined
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
        error && error?.code === 4001 ? error.message : `Unable to add adapters`
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
  async function handleConfigureAdapter(adapter: Adapters) {
    setSubmitError(undefined);

    try {
      // Get ABI function name
      const adapterABIFunctionName: string = getConfigurationABIFunction()[
        adapter.name
      ];
      // Get adapters ABI
      const {abi} = getAdapterFromRedux(adapter.name);
      // Get adapters configure function input parameters
      const {inputs} = abi.filter(
        (p: Record<string, any>) => p.name === adapterABIFunctionName
      )[0];

      setABIMethodName(adapterABIFunctionName);
      setConfigureAdapter(adapter);
      setInputParameters(inputs);
      setOpenModal(true);
    } catch (error) {
      const errorMessage = new Error(
        error && error?.code === 4001
          ? error.message
          : `${adapter.name} contract not found`
      );
      setSubmitError(errorMessage);
    }
  }

  /**
   * finalizeDao
   */
  async function handleFinalizeDao() {
    console.log('handleFinalizeDao');
    // window.confirm before proceeding

    try {
      // get getDaoState when done
    } catch (error) {}
  }

  // Handles the select all checkbox event
  function handleOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    checkboxesSelection(event.target.checked);
  }

  function checkboxesSelection(checked: boolean) {
    // Update the select all checkbox
    setSelectAll(checked);

    // Update all unused adapter options
    for (const key in selections) {
      setSelections((s) => ({
        ...s,
        [key]: checked,
      }));
    }
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

  function handleSelectTargetChange({event, selectedTargetOption}: any) {
    // update the prior selected target to track the change
    // so we can remove the old target from checkbox `selections`

    // @todo Remove previously selected target

    setSelections((s) => ({
      ...s,
      [selectedTargetOption]: event.target.checked,
    }));
  }

  return (
    <div className="adaptermanager">
      <h1>Adapter Manager</h1>
      {renderDaoName()}
      {renderErrorMessage()}
      <p>
        Nulla aliquet porttitor venenatis. Donec a dui et dui fringilla
        consectetur id nec massa. Aliquam erat volutpat. Sed ut dui ut lacus
        dictum fermentum vel tincidunt neque. Sed sed lacinia...
      </p>
      <div className="adaptermanager__selection">
        <div>
          <Checkbox
            id="selectAll"
            label={`${selectionCount} selected`}
            checked={selectAll === true}
            disabled={
              isAdaptersUnavailable ||
              isDisabled || // connected user is not an active member
              !isDAOExisting /* 
              @todo 
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

      {isLoadingAdapters && <Loader />}
      {isAdaptersUnavailable && <p>No adapters available</p>}

      {/** UNUSED ADAPTERS AND EXTENSIONS TO ADD */}
      {isDAOExisting &&
        unRegisteredAdapters &&
        unRegisteredAdapters?.length &&
        unRegisteredAdapters.map(
          (adapter: Record<string, any>, idx: number) => (
            <div
              className="adaptermanager__grid unregistered-adapters"
              key={idx}>
              {/** RENDER ADAPTER/EXTENSION DROPDOWN */}
              {adapter?.options ? (
                <AdapterExtensionSelectTarget
                  adapterOrExtension={adapter}
                  renderCheckboxAction={({selectedTargetOption}) => {
                    return (
                      <>
                        <div className="adaptermanager__checkbox">
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
                              isDisabled || selectedTargetOption === null
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
                        <div className="adaptermanager__add">
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
                  <div className="adaptermanager__checkbox">
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

                  <div className="adaptermanager__info">
                    <span className="adaptermanager__name">
                      {adapter.name} {adapter?.isExtension && '(EXTENSION)'}
                    </span>
                    <span className="adaptermanager__desc">
                      {adapter.description}
                    </span>
                  </div>

                  <div className="adaptermanager__add">
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

      {/** CURRENTLY USED ADAPTERS AND EXTENSIONS TO CONFIGURE OR REMOVE */}
      {isDAOExisting &&
        registeredAdapters &&
        registeredAdapters?.length &&
        registeredAdapters.map((adapter: Record<string, any>) => (
          <div
            className="adaptermanager__grid registered-adapters"
            key={adapter.id}>
            <div className="adaptermanager__info">
              <span className="adaptermanager__name">
                {adapter.name} {adapter?.isExtension && '(EXTENSION)'}
              </span>
              <span className="adaptermanager__desc">
                {adapter.description}
              </span>
            </div>

            <div className="adaptermanager__configure">
              <button
                className="button--secondary"
                disabled={isDisabled}
                onClick={() => handleConfigureAdapter(adapter as Adapters)}>
                Configure
              </button>
            </div>
          </div>
        ))}

      {isDisabled && (
        <div>
          <button
            className="button--help"
            onClick={() => {
              openWhyDisabledModal();
              setWhyDisabledReason(WhyDisableModalTitles.ADAPTERS_REASON);
            }}>
            {WhyDisableModalTitles.ADAPTERS_REASON}
          </button>
        </div>
      )}

      <div className="adaptermanager_finalize">
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
              daoState ===
                DaoState.READY /* 
              @todo 
              - also disable when selection is processing 
              - when there are no more unused adapters to select
              */
            }
            onClick={handleFinalizeDao}>
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
