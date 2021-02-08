import {useEffect} from 'react';
import {useSelector} from 'react-redux';

import {StoreState} from '../../store/types';
import {AsyncStatus} from '../../util/types';
import {useAdapters} from './hooks/useAdapters';
import {
  useContractSend,
  useETHGasPrice,
  useIsDefaultChain,
  useWeb3Modal,
} from '../web3/hooks';

type AddAdapterArguments = [
  string, // `adapterId`
  string, // `adapterAddress`
  number // `acl`
];

type RemoveAdapterArguments = [
  string // `adapterId`
];

export default function AdapterManager() {
  /**
   * Selectors
   */
  const DaoRegistryContract = useSelector(
    (state: StoreState) => state.contracts?.DaoRegistryContract
  );

  /**
   * Hooks
   */
  const {account} = useWeb3Modal();
  const {
    adapterStatus,
    usedAdapters,
    unusedAdapters,
    getDaoAdapters,
  } = useAdapters();
  const {isDefaultChain} = useIsDefaultChain();

  useEffect(() => {
    if (
      isDefaultChain &&
      adapterStatus !== (AsyncStatus.FULFILLED || AsyncStatus.REJECTED)
    ) {
      getDaoAdapters();
    }
  }, [adapterStatus, isDefaultChain, getDaoAdapters]);

  const {
    // txError,
    // txEtherscanURL,
    // txIsPromptOpen,
    txSend,
    // txStatus,
  } = useContractSend();
  const gasPrices = useETHGasPrice();

  // console.log('txStatus', txStatus);
  // console.log('txIsPromptOpen', txIsPromptOpen);
  // console.log('txEtherscanURL', txEtherscanURL);
  // console.log('txError', txError);

  async function addAdapter(adapter: Record<string, any>) {
    if (!DaoRegistryContract) return;

    console.log('add ', adapter);
    // addAdapter(3)
    // [0]bytes32 adapterId
    // [1]address adapterAddress
    // [2]uint256 acl

    try {
      const addAdapterArguments: AddAdapterArguments = [
        adapter.adapterId,
        adapter.adapterAddress,
        adapter.acl,
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
    } catch (error) {}
  }

  async function removeAdapter(adapter: Record<string, any>) {
    console.log('remove', adapter);
    if (!DaoRegistryContract) return;
    // removeAdapter(1)
    // [0]bytes32 adapterId
    try {
      const removeAdapterArguments: RemoveAdapterArguments = [
        adapter.adapterId,
      ];
      const txArguments = {
        from: account || '',
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      // Execute contract call for `removeAdapter`
      await txSend(
        'removeAdapter',
        DaoRegistryContract.instance.methods,
        removeAdapterArguments,
        txArguments
      );
    } catch (error) {}
  }

  function finalizeDao() {
    // window.confirm before proceeding
    console.log('finalizeDao');
  }

  return (
    <div className="adaptermanager">
      <h1>Adapter Manager</h1>
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
                onClick={() => addAdapter(adapter)}>
                Update
              </button>
              {/** @todo maybe modal popup to configure and add */}
            </div>

            <div className="adaptermanager__remove">
              <button
                className="button--secondary"
                onClick={() => removeAdapter(adapter)}>
                Remove
              </button>
              {/** @todo maybe modal popup to configure and remove */}
            </div>
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
    </div>
  );
}
