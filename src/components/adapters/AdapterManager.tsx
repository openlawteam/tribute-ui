import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {StoreState} from '../../store/types';
import {AsyncStatus} from '../../util/types';
import {
  DaoConstants,
  adapterAccessControlLayer,
  configurationABIFunction,
} from './config';
import {useAdapters} from './hooks/useAdapters';
import {useDao} from '../../hooks';
import {
  useContractSend,
  useETHGasPrice,
  useIsDefaultChain,
  useWeb3Modal,
} from '../web3/hooks';

import AdapterConfiguratorModal from './AdapterConfiguratorModal';

type AddAdapterArguments = [
  string, // `adapterId`
  string, // `adapterAddress`
  number // `acl`
];

export default function AdapterManager() {
  /**
   * Selectors
   */
  const {DaoRegistryContract, ...adapterContracts} = useSelector(
    (state: StoreState) => state.contracts
  );

  /**
   * States
   */
  const [abiMethodName, setABIMethodName] = useState<string>('');
  const [adapterConfigId, setAdapterConfigId] = useState<string>('');
  const [adapterConfigName, setAdapterConfigName] = useState<string>('');
  const [inputParameters, setInputParameters] = useState<Record<string, any>>();
  const [openModal, setOpenModal] = useState<boolean>(false);

  /**
   * Hooks
   */
  const {account} = useWeb3Modal();
  const {
    adapterStatus,
    usedAdapters,
    unusedAdapters,
    // getDaoAdapters,
  } = useAdapters();
  // const {isDefaultChain} = useIsDefaultChain();
  const {dao} = useDao();

  /**
   * Effects
   */
  // useEffect(() => {
  //   if (
  //     isDefaultChain &&
  //     adapterStatus !== (AsyncStatus.FULFILLED || AsyncStatus.REJECTED)
  //   ) {
  //     getDaoAdapters();
  //   }
  // }, [adapterStatus, isDefaultChain, getDaoAdapters]);

  const {
    txError,
    txEtherscanURL,
    txIsPromptOpen,
    txSend,
    txStatus,
  } = useContractSend();
  const gasPrices = useETHGasPrice();

  function getAdapter(adapterName: DaoConstants): Record<string, any> {
    return Object.keys(adapterContracts)
      .map((a) => adapterContracts[a])
      .filter((a) => a.adapterName === adapterName)[0];
  }

  // console.log('txStatus', txStatus);
  // console.log('txIsPromptOpen', txIsPromptOpen);
  // console.log('txEtherscanURL', txEtherscanURL);
  // console.log('txError', txError);

  /**
   * addAdapter()
   * @param adapter
   */
  async function addAdapter(adapter: Record<string, any>) {
    if (!DaoRegistryContract) return;

    try {
      console.log('add ', adapter);

      // Get adapters contract address
      const {contractAddress} = getAdapter(adapter.adapterName);
      // Get adapters access control layer (acl)
      // these are the functions the adapter will have access to
      const {acl} = adapterAccessControlLayer(adapter.adapterName);

      const addAdapterArguments: AddAdapterArguments = [
        adapter.adapterId, // [0]bytes32 adapterId
        contractAddress, // [1]address adapterAddress
        acl, // [2]uint256 acl
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
    } catch (error) {
      console.log('error', adapter.adapterName, error);
    }
  }

  async function configureAdapter(adapter: Record<string, any>) {
    console.log('configure', adapter);
    try {
      // Get ABI function name
      const adapterABIFunctionName: string = configurationABIFunction()[
        adapter.adapterName
      ];
      // Get adapters ABI
      const {abi} = getAdapter(adapter.adapterName);
      // Get adapters configure function input parameters
      const {inputs} = abi.filter(
        (p: Record<string, any>) => p.name === adapterABIFunctionName
      )[0];

      setABIMethodName(adapterABIFunctionName);
      setAdapterConfigId(adapter.adapterId);
      setAdapterConfigName(adapter.adapterName);
      setInputParameters(inputs);
      setOpenModal(true);
    } catch (error) {
      console.log('error', error);
    }
  }

  function finalizeDao() {
    // window.confirm before proceeding
    console.log('finalizeDao');
  }

  return (
    <div className="adaptermanager">
      <h1>Adapter Manager</h1>
      {dao && <h2>{dao?.name}</h2>}
      <p>
        Nulla aliquet porttitor venenatis. Donec a dui et dui fringilla
        consectetur id nec massa. Aliquam erat volutpat. Sed ut dui ut lacus
        dictum fermentum vel tincidunt neque. Sed sed lacinia...
      </p>

      {/** USED ADAPTERS TO CONFIGURE OR REMOVE */}
      {usedAdapters &&
        usedAdapters?.length &&
        usedAdapters.map((adapter: Record<string, any>) => (
          <div className="adaptermanager__grid" key={adapter.adapterId}>
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
                onClick={() => configureAdapter(adapter)}>
                Configure
              </button>
            </div>

            {/* <div className="adaptermanager__remove">
              <button
                className="button--secondary"
                onClick={() => removeAdapter(adapter)}>
                Remove
              </button>
            </div> */}
          </div>
        ))}

      {/** UNUSED ADAPTERS TO ADD */}
      {unusedAdapters &&
        unusedAdapters?.length &&
        unusedAdapters.map((adapter: Record<string, any>) => (
          <div className="adaptermanager__grid" key={adapter.adapterId}>
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
                onClick={() => addAdapter(adapter)}>
                Add
              </button>
            </div>
          </div>
        ))}

      <button onClick={finalizeDao}>Finalize Dao</button>

      {openModal && (
        <AdapterConfiguratorModal
          abiMethodName={abiMethodName}
          adapterId={adapterConfigId}
          adapterName={adapterConfigName}
          isOpen={openModal}
          configurationInputs={inputParameters}
          closeHandler={() => {
            setOpenModal(false);
          }}
        />
      )}
    </div>
  );
}
