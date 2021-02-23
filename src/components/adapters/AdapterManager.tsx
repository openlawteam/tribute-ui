import {useCallback, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {StoreState} from '../../store/types';
import {
  getAdapterAccessControlLayer,
  getConfigurationABIFunction,
} from './helpers';
import {Adapters} from './types';
import {DaoConstants} from './enums';
import {useAdapters} from './hooks/useAdapters';
import {useDao, useMemberActionDisabled} from '../../hooks';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';
import {getDaoState, DaoState} from '../web3/helpers';

import AdapterConfiguratorModal from './AdapterConfiguratorModal';
import Checkbox, {CheckboxSize} from '../../components/common/Checkbox';
import ErrorMessageWithDetails from '../../components/common/ErrorMessageWithDetails';
import Loader from '../../components/feedback/Loader';

import {AsyncStatus} from '../../util/types';
import {truncateEthAddress} from '../../util/helpers';
import {AddAdapterArguments} from './types';

enum WhyDisableModalTitles {
  FINALIZED_REASON = 'Why is finalizing disabled?',
  ADAPTERS_REASON = 'Why are adapter configurations disabled?',
}

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
  const [inputParameters, setInputParameters] = useState<Record<string, any>>();
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<Record<string, boolean> | undefined>();
  const [submitError, setSubmitError] = useState<Error>();
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
  const [daoState, setDaoState] = useState<DaoState>();
  const [whyDisabledReason, setWhyDisabledReason] = useState<
    WhyDisableModalTitles | undefined
  >();

  /**
   * Hooks
   */
  const {account} = useWeb3Modal();
  const {
    availableAdapters,
    adapterStatus,
    getAdapter,
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
    if (!unRegisteredAdapters) return;
    unRegisteredAdapters &&
      unRegisteredAdapters?.forEach((adapter: Record<string, any>) => {
        setSelections((prevState: Record<string, boolean> | undefined) => ({
          ...prevState,
          [adapter.adapterName]: false,
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
  async function handleAddAdapter(adapter: Record<string, any>) {
    setSubmitError(undefined);

    if (!DaoRegistryContract) return;

    try {
      setIsInProcess((prevState) => ({
        ...prevState,
        [adapter.adapterName]: true,
      }));

      // Get adapters contract address
      const {contractAddress} = getAdapter(adapter.adapterName as DaoConstants);

      if (!contractAddress) {
        throw new Error('adapterAddress must not be empty');
      }

      // Get adapters access control layer (acl)
      // these are the functions the adapter will have access to
      const {acl} = getAdapterAccessControlLayer(adapter.adapterName);

      const addAdapterArguments: AddAdapterArguments = [
        adapter.adapterId,
        contractAddress,
        acl,
      ];

      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `addAdapter`
      await txSend(
        'addAdapter',
        DaoRegistryContract.instance.methods,
        addAdapterArguments,
        txArguments
      );

      setIsInProcess((prevState) => ({
        ...prevState,
        [adapter.adapterName]: false,
      }));
      setIsDone((prevState) => ({
        ...prevState,
        [adapter.adapterName]: true,
      }));
    } catch (error) {
      setIsInProcess((prevState) => ({
        ...prevState,
        [adapter.adapterName]: false,
      }));

      const errorMessage = new Error('Unable to add selected adapter' || error);
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
          // Get adapterId from `availableAdapters`
          const {adapterId} = availableAdapters.filter(
            (a: Adapters) => a.adapterName === adapterName
          )[0];

          // Get adapter contract address
          const {contractAddress} = getAdapter(adapterName as DaoConstants);

          // Get adapters access control layer (acl)
          // these are the functions the adapter will have access to
          const {acl} = getAdapterAccessControlLayer(adapterName);

          adaptersArguments.push([
            adapterId, // [0]bytes32 adapterId
            contractAddress, // [1]address adapterAddress
            acl, // [2]uint256 acl
          ]);

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

      // Execute contract call for `addAdapter`
      await txSend(
        'addAdapters',
        DaoFactoryContract.instance.methods,
        addAdaptersArguments,
        txArguments
      );

      // enable buttons @todo
    } catch (error) {
      const errorMessage = new Error('Unable to add adapters' || error);
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
        adapter.adapterName
      ];
      // Get adapters ABI
      const {abi} = getAdapter(adapter.adapterName);
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
        `${adapter.adapterName} contract not found` || error
      );

      setSubmitError(errorMessage);
    }
  }

  /**
   * finalizeDao
   */
  function handleFinalizeDao() {
    // window.confirm before proceeding
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
            id={'select-all'}
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
            name={'select-all'}
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

      {/** UNUSED ADAPTERS TO ADD */}
      {isDAOExisting &&
        unRegisteredAdapters &&
        unRegisteredAdapters?.length &&
        unRegisteredAdapters.map((adapter: Record<string, any>) => (
          <div
            className="adaptermanager__grid unregistered-adapters"
            key={adapter.adapterId}>
            <div className="adaptermanager__checkbox">
              <Checkbox
                id={adapter.adapterName}
                label={''}
                checked={
                  (selections && selections[adapter.adapterName] === true) ||
                  false
                }
                disabled={isDisabled}
                name={adapter.adapterName}
                size={CheckboxSize.LARGE}
                onChange={(event) => {
                  setSelections((s) => ({
                    ...s,
                    [adapter.adapterName]: event.target.checked,
                  }));
                }}
              />
            </div>

            <div className="adaptermanager__info">
              <span className="adaptermanager__name">
                {adapter.adapterName}
              </span>
              <span className="adaptermanager__desc">
                {adapter.adapterDescription}
              </span>
            </div>

            <div className="adaptermanager__add">
              <button
                className="button--secondary"
                disabled={
                  (isInProcess && isInProcess[adapter.adapterName]) ||
                  isDisabled
                }
                onClick={() => handleAddAdapter(adapter)}>
                {isInProcess && isInProcess[adapter.adapterName] ? (
                  <Loader />
                ) : isDone && isDone[adapter.adapterName] ? (
                  'Done'
                ) : (
                  'Add'
                )}
              </button>
            </div>
          </div>
        ))}
      {/** CURRENTLY USED ADAPTERS TO CONFIGURE OR REMOVE */}
      {isDAOExisting &&
        registeredAdapters &&
        registeredAdapters?.length &&
        registeredAdapters.map((adapter: Record<string, any>) => (
          <div
            className="adaptermanager__grid registered-adapters"
            key={adapter.adapterId}>
            <div className="adaptermanager__info">
              <span className="adaptermanager__name">
                {adapter.adapterName}
              </span>
              <span className="adaptermanager__desc">
                {adapter.adapterDescription}
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
