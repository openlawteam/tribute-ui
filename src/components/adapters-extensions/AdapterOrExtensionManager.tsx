import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {
  defaultAdaptersAndExtensions,
  AdaptersAndExtensionsType,
} from './config';
import {
  useAdaptersOrExtensions,
  useInitAdapterExtensionContracts,
} from './hooks';
import {
  AddAdapterArguments,
  AddAdaptersArguments,
  AddExtensionArguments,
  AdaptersOrExtensions,
} from './types';
import {
  useContractSend,
  useWeb3Modal,
  useIsDefaultChain,
  useETHGasPrice,
} from '../web3/hooks';
import {AsyncStatus} from '../../util/types';
import {DaoAdapterConstants, DaoExtensionConstants} from './enums';
import {getAdapterOrExtensionId, getAccessControlLayer} from './helpers';
import {getDaoState, DaoState} from '../web3/helpers';
import {StoreState} from '../../store/types';
import {truncateEthAddress} from '../../util/helpers';
import {useDao, useMemberActionDisabled} from '../../hooks';
import AdapterExtensionSelectTarget from './AdapterOrExtensionSelectTarget';
import Checkbox, {CheckboxSize} from '../common/Checkbox';
import ConfigurationModal from './ConfigurationModal';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import FadeIn from '../common/FadeIn';
import FinalizeModal from './FinalizeModal';
import Loader from '../feedback/Loader';
import Wrap from '../common/Wrap';

enum WhyDisableModalTitles {
  FINALIZED_REASON = 'Why is finalizing disabled?',
  CONFIGURATION_REASON = 'Why are configurations disabled?',
}

const getDelegatedAddressMessage = (a: string) =>
  `Your member address is delegated to ${truncateEthAddress(
    a,
    7
  )}. You must use that address.`;

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
    (s: StoreState) => s.contracts
  );

  const delegateAddress = useSelector(
    (s: StoreState) => s.connectedMember?.delegateKey
  );

  const isAddressDelegated = useSelector(
    (s: StoreState) => s.connectedMember?.isAddressDelegated
  );

  const isActiveMember = useSelector(
    (s: StoreState) => s.connectedMember?.isActiveMember
  );

  /**
   * States
   */
  const [abiMethodName, setABIMethodName] = useState<string>('');
  const [daoState, setDaoState] = useState<DaoState>();
  const [isDone, setIsDone] = useState<Record<string, boolean> | undefined>();
  const [inputParameters, setInputParameters] = useState<Record<string, any>>();
  const [submitError, setSubmitError] = useState<Error>();
  const [openConfigureModal, setOpenConfigureModal] = useState<boolean>(false);
  const [openFinalizeModal, setOpenFinalizeModal] = useState<boolean>(false);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [selectionCount, setSelectionCount] = useState<number>(0);
  const [selections, setSelections] = useState<
    Record<string, boolean> | undefined
  >();
  const [configureAdapterOrExtension, setConfigureAdapterOrExtension] =
    useState<AdaptersOrExtensions | undefined>();
  const [isInProcess, setIsInProcess] = useState<
    Record<string, boolean> | undefined
  >();
  const [whyDisabledReason, setWhyDisabledReason] = useState<
    WhyDisableModalTitles | undefined
  >();

  /**
   * Our hooks
   */

  const {defaultChainError} = useIsDefaultChain();
  const {connected, account, web3Instance} = useWeb3Modal();
  const {dao, daoError} = useDao();
  const {average: gasPrice} = useETHGasPrice();

  const {
    adapterExtensionStatus,
    getAdapterOrExtensionFromRedux,
    registeredAdaptersOrExtensions,
    unRegisteredAdaptersOrExtensions,
  } = useAdaptersOrExtensions();

  const {initAdapterExtensionContract} = useInitAdapterExtensionContracts();

  const {txSend} = useContractSend();

  const {
    isDisabled,
    openWhyDisabledModal,
    setOtherDisabledReasons,
    WhyDisabledModal,
  } = useMemberActionDisabled();

  /**
   * Variables
   */

  const isConnected = connected && account;
  const isDAOExisting: Record<string, any> | undefined = dao;
  const isDAOReady: boolean = daoState === DaoState.READY;

  const isUnavailable: boolean =
    adapterExtensionStatus === AsyncStatus.REJECTED &&
    registeredAdaptersOrExtensions === undefined &&
    unRegisteredAdaptersOrExtensions === undefined;

  const isLoading: boolean = adapterExtensionStatus === AsyncStatus.PENDING;
  const nothingToAdd = unRegisteredAdaptersOrExtensions?.length === 0;
  // @todo track the prior selection of a dropdown target
  // let priorSelectedTargetOption: DaoAdapterConstants | null = null;

  /**
   * Cached callbacks
   */
  const checkDaoStateCached = useCallback(checkDaoState, [
    DaoRegistryContract,
    dao?.name,
    setOtherDisabledReasons,
  ]);

  /**
   * Effects
   */
  // Check the Dao state
  useEffect(() => {
    checkDaoStateCached();
  }, [checkDaoStateCached, DaoRegistryContract]);

  useEffect(() => {
    // Set the select all check to false by default
    setSelectAll(false);

    if (!unRegisteredAdaptersOrExtensions) return;

    /**
     * @note Select all functionality is for adding adapters only.
     * Extensions must be added separately.
     *
     * Sets the initial checkbox selections for non-registered adapters to `false`
     * and sets the `Select All` checkbox to disabled if no adapters are available
     */
    unRegisteredAdaptersOrExtensions &&
      unRegisteredAdaptersOrExtensions?.forEach(
        (adapterOrExtension: Record<string, any>) => {
          // only add a selection if it doesn't have nested `options`
          // and if it's not an extension
          !adapterOrExtension?.options &&
            !adapterOrExtension.isExtension &&
            setSelections((prevState: Record<string, boolean> | undefined) => ({
              ...prevState,
              [adapterOrExtension.name]: false,
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

  /**
   * Functions
   */
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
   * Handles adding an `adapter`
   *
   * @param adapter
   */
  function handleAddAdapter(adapter: Record<string, any>): void {
    const adapterOrExtensionAddress = new Promise<any>((resolve, reject) => {
      try {
        // Get contract address
        const {contractAddress} = getAdapterOrExtensionFromRedux(
          adapter.name as DaoAdapterConstants
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

  /**
   * handleAddExtension
   *
   * Handle adding an `extension`
   * @param extension
   */
  function handleAddExtension(extension: any): void {
    const adapterOrExtensionAddress = new Promise<any>((resolve, reject) => {
      try {
        // Get contract address
        const {contractAddress} = getAdapterOrExtensionFromRedux(
          extension.name as DaoExtensionConstants
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
    adapterOrExtensionName: DaoAdapterConstants | DaoExtensionConstants,
    adapterOrExtensionType: 'ADAPTER' | 'EXTENSION'
  ): Promise<void> {
    setSubmitError(undefined);

    if (!DaoRegistryContract) {
      throw new Error('No DAO Registry contract was found.');
    }

    if (!web3Instance) {
      throw new Error('No Web3 instance was found.');
    }

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
          ? ([
              adapterOrExtensionId,
              adapterOrExtensionAddress,
              acl,
              [],
              [],
            ] as AddAdapterArguments)
          : ([
              adapterOrExtensionId,
              adapterOrExtensionAddress,
              account,
            ] as AddExtensionArguments);

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
      };

      const txSendMethod =
        adapterOrExtensionType === 'ADAPTER'
          ? 'replaceAdapter'
          : 'addExtension';

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

      // init adapter/extension contracts
      initAdapterExtensionContract(adapterOrExtensionName, web3Instance);
    } catch (error) {
      const e = error as Error & {code: number};

      setIsInProcess((prevState) => ({
        ...prevState,
        [adapterOrExtensionName]: false,
      }));

      const errorMessage = new Error(
        e && e?.code === 4001
          ? e.message
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

    if (!web3Instance) {
      throw new Error('No Web3 instance was found.');
    }

    try {
      let adaptersArguments: AddAdaptersArguments[] = [];

      // Set the `Add` button states to true for all selected adapters
      for (const adapterName in selections) {
        if (selections[adapterName]) {
          // Get adapterOrExtensionId from `defaultAdaptersAndExtensions`
          const {adapterId, contractAddress}: AdaptersAndExtensionsType =
            defaultAdaptersAndExtensions.filter(
              (a: AdaptersAndExtensionsType) => a.name === adapterName
            )[0];

          let adapterContractAddress = contractAddress;

          if (!adapterContractAddress) {
            // Get adapter contract address from redux
            let contractAddressFromRedux = getAdapterOrExtensionFromRedux(
              adapterName as DaoAdapterConstants
            );

            adapterContractAddress = contractAddressFromRedux?.contractAddress;
          }

          // Get adapters access control layer (acl)
          // these are the functions the adapter will have access to
          const {acl} = getAccessControlLayer(adapterName);

          // skip if `adapterId` or `adapterContractAddress` are undefined
          if (adapterId && adapterContractAddress) {
            adaptersArguments.push([
              adapterId,
              adapterContractAddress,
              acl,
            ] as AddAdaptersArguments);

            setIsInProcess((prevState) => ({
              ...prevState,
              [adapterName]: true,
            }));
          }
        }
      }

      const addAdaptersArguments: [string, AddAdaptersArguments[]] = [
        dao?.daoAddress,
        adaptersArguments,
      ];

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
      };

      // Execute contract call for `addAdapters`
      await txSend(
        'addAdapters',
        DaoFactoryContract.instance.methods,
        addAdaptersArguments,
        txArguments
      );

      // init adapter contracts to the store for all added adapters
      for (const adapterName in selections) {
        if (selections[adapterName]) {
          adapterName &&
            initAdapterExtensionContract(
              adapterName as DaoAdapterConstants,
              web3Instance
            );
        }
      }
    } catch (error) {
      const e = error as Error & {code: number};

      const errorMessage = new Error(
        e && e?.code === 4001 ? e.message : `Unable to add adapters; ${error}`
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
      const {abiFunctionName, name} = adapterOrExtension;

      if (!abiFunctionName) {
        throw new Error(`ABI function not found for ${name}`);
      }

      // Get adapters/extension ABI
      const {abi} = getAdapterOrExtensionFromRedux(name);
      // Get adapters/extension configure function input parameters
      const {inputs} = abi.filter(
        (p: Record<string, any>) => p.name === abiFunctionName
      )[0];

      setABIMethodName(abiFunctionName);
      setConfigureAdapterOrExtension(adapterOrExtension);
      setInputParameters(inputs);
      setOpenConfigureModal(true);
    } catch (error) {
      const e = error as Error & {code: number};

      const errorMessage = new Error(
        e && e?.code === 4001
          ? e.message
          : `${adapterOrExtension.name} contract not found`
      );
      setSubmitError(errorMessage);
    }
  }

  // Handles the select all checkbox event
  function handleOnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    checkboxesSelection(event.target.checked);
  }

  function checkboxesSelection(checked: boolean): void {
    // Update the select all checkbox
    setSelectAll(checked);

    // Update all un-registered adapters only
    for (const key in selections) {
      setSelections((s) => ({
        ...s,
        [key]: checked,
      }));
    }
  }

  function handleSelectTargetChange({event, selectedTargetOption}: any): void {
    // @todo Remove previously selected target if its from an `options` list
    // update the prior selected target to track the change
    // so we can remove the old target from checkbox `selections`

    setSelections((s) => ({
      ...s,
      [selectedTargetOption]: event.target.checked,
    }));
  }

  function renderDaoName() {
    if (!dao && daoError) {
      window.scrollTo({
        top: 0,
        left: 200,
        behavior: 'smooth',
      });

      return (
        <ErrorMessageWithDetails
          error={daoError}
          renderText="Something went wrong"
        />
      );
    }

    if (dao) {
      return (
        <h3>
          {dao.name} <small>{truncateEthAddress(dao.daoAddress, 7)}</small>
        </h3>
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

  function getUnauthorizedMessage() {
    // user is not connected
    if (!isConnected) {
      return 'Connect your wallet to manage the DAO adapters and extensions.';
    }

    // user is on wrong network
    if (defaultChainError) {
      return defaultChainError.message;
    }

    // user is not an active member
    if (!isActiveMember && !isAddressDelegated) {
      return 'Either you are not a member, or your membership is not active.';
    }

    // member has delegated to another address
    if (!isActiveMember && delegateAddress && isAddressDelegated) {
      return getDelegatedAddressMessage(delegateAddress);
    }
  }

  /**
   * Render
   */

  // Render unauthorized message
  if (!isConnected || !isActiveMember || defaultChainError) {
    return (
      <RenderWrapper>
        <div className="adapter-extension__unauthorized-message">
          <p>{getUnauthorizedMessage()}</p>
        </div>
      </RenderWrapper>
    );
  }

  /* @todo
   * disable when selection is processing
   * disable when there are no more unused adapters to select
   */
  return (
    <RenderWrapper>
      <div className="adaptermanager">
        {renderDaoName()}
        {renderErrorMessage()}
        <p>
          Select the adapters you want to add to the DAO. You can add multiple
          adapters at once.
        </p>
        <div className="adapter-extension__selection">
          <div>
            <Checkbox
              data-testid="selectall"
              role="checkbox"
              id="selectall"
              label={`${selectionCount} selected`}
              checked={selectAll === true}
              disabled={
                isDisabled || // connected user is not an active member
                isUnavailable ||
                nothingToAdd || // nothing left to register
                !isDAOExisting
              }
              name="selectall"
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

        {isLoading && (
          <div className="adapter-extension__loader">
            <Loader text="Loading data from subgraph..." />
          </div>
        )}
        {isUnavailable && <p>No adapters/extensions available</p>}

        {/** UNUSED ADAPTERS AND EXTENSIONS TO ADD */}
        {isDAOExisting &&
          unRegisteredAdaptersOrExtensions &&
          unRegisteredAdaptersOrExtensions?.length > 0 &&
          unRegisteredAdaptersOrExtensions.map(
            (adapterOrExtension: Record<string, any>, idx: number) => (
              <div className="adapter-extension__grid unregistered" key={idx}>
                {/** RENDER ADAPTER/EXTENSION DROPDOWN */}
                {adapterOrExtension?.options ? (
                  <AdapterExtensionSelectTarget
                    adapterOrExtension={adapterOrExtension}
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
                                adapterOrExtension?.isExtension
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
                                  isInProcess[
                                    selectedTargetOptionProps.name
                                  ]) ||
                                isDisabled
                              }
                              onClick={() =>
                                selectedTargetOptionProps?.isExtension
                                  ? handleAddExtension(
                                      selectedTargetOptionProps
                                    )
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
                    <div className="adapter-extension__inner-wrapper ">
                      <div className="adapter-extension__checkbox">
                        {!adapterOrExtension?.isExtension && (
                          <Checkbox
                            id={adapterOrExtension.name}
                            label={''}
                            checked={
                              (selections &&
                                selections[adapterOrExtension.name] === true) ||
                              false
                            }
                            disabled={isDisabled}
                            name={adapterOrExtension.name}
                            size={CheckboxSize.LARGE}
                            onChange={(event) => {
                              setSelections((s) => ({
                                ...s,
                                [adapterOrExtension.name]: event.target.checked,
                              }));
                            }}
                          />
                        )}
                      </div>

                      <div className="adapter-extension__info">
                        <span className="adapter-extension__name">
                          {adapterOrExtension.name}{' '}
                          {adapterOrExtension?.isExtension && '(EXTENSION)'}
                        </span>
                        <span className="adapter-extension__desc">
                          {adapterOrExtension.description}
                        </span>
                      </div>
                    </div>

                    <div className="adapter-extension__add">
                      <button
                        className="button--secondary"
                        disabled={
                          (isInProcess &&
                            isInProcess[adapterOrExtension.name]) ||
                          (isDone && isDone[adapterOrExtension.name]) ||
                          isDisabled
                        }
                        onClick={() =>
                          adapterOrExtension?.isExtension
                            ? handleAddExtension(adapterOrExtension)
                            : handleAddAdapter(adapterOrExtension)
                        }>
                        {isInProcess && isInProcess[adapterOrExtension.name] ? (
                          <Loader />
                        ) : isDone && isDone[adapterOrExtension.name] ? (
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

        {/** USED ADAPTERS/EXTENSIONS TO CONFIGURE OR REMOVE */}
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
                      handleConfigure(
                        adapterOrExtension as AdaptersOrExtensions
                      )
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
                setWhyDisabledReason(
                  WhyDisableModalTitles.CONFIGURATION_REASON
                );
              }}>
              {WhyDisableModalTitles.CONFIGURATION_REASON}
            </button>
          </div>
        )}

        <div className="adapter-adapter-extension__finalize">
          <p>
            If you're happy with your setup, you can finalize your DAO. After
            your DAO is finalized you will need to submit a proposal to make
            changes.
          </p>
          <div>
            <button
              data-testid="finalizedao"
              className="button--secondary finalize"
              disabled={
                isUnavailable || !isDAOExisting || isDAOReady
                /* @todo 
              - also disable when selection is processing 
              - when there are no more unused adapters to select
              */
              }
              onClick={() => setOpenFinalizeModal(true)}>
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

        {openConfigureModal && (
          <ConfigurationModal
            abiMethodName={abiMethodName}
            adapterOrExtension={configureAdapterOrExtension}
            configurationInputs={inputParameters}
            isOpen={openConfigureModal}
            closeHandler={() => {
              setOpenConfigureModal(false);
            }}
          />
        )}

        {openFinalizeModal && (
          <FinalizeModal
            isOpen={openFinalizeModal}
            closeHandler={() => {
              setOpenFinalizeModal(false);

              // check the state of the dao
              checkDaoStateCached();
            }}
          />
        )}
      </div>
    </RenderWrapper>
  );
}

function RenderWrapper(props: React.PropsWithChildren<any>): JSX.Element {
  /**
   * Render
   */

  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div className="titlebar">
          <h2 className="titlebar__title">Adapter/Extension Manager</h2>
        </div>

        {/* RENDER CHILDREN */}
        {props.children}
      </FadeIn>
    </Wrap>
  );
}
