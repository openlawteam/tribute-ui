// import {waitFor} from '@testing-library/react';
import {act, renderHook} from '@testing-library/react-hooks';

import {
  DEFAULT_ADAPTER_OR_EXTENSION_ID,
  DEFAULT_ETH_ADDRESS,
} from '../../../test/helpers';

import {useValidation, ParamType} from './useValidation';

describe('useValidation unit tests', () => {
  test('should get validations functions', async () => {
    const {result} = await renderHook(() => useValidation());

    expect(result.current.isParamInputValid).toBeInstanceOf(Function);
    expect(result.current.getFormFieldError).toBeInstanceOf(Function);
    expect(result.current.formatInputByType).toBeInstanceOf(Function);

    // test all paramInputs are valid
    expect(result.current.isParamInputValid(123, ParamType.UINT256)).toBe(true);
    expect(
      result.current.isParamInputValid([1, 22, 354], ParamType.UINT256_ARRAY)
    ).toBe(true);
    expect(
      result.current.isParamInputValid(
        DEFAULT_ADAPTER_OR_EXTENSION_ID,
        ParamType.BYTES32
      )
    ).toBe(true);
    expect(
      result.current.isParamInputValid(
        [DEFAULT_ADAPTER_OR_EXTENSION_ID, DEFAULT_ADAPTER_OR_EXTENSION_ID],
        ParamType.BYTES32_ARRAY
      )
    ).toBe(true);
    expect(
      result.current.isParamInputValid(DEFAULT_ETH_ADDRESS, ParamType.ADDRESS)
    ).toBe(true);

    // test all paramInputs are invalid
    expect(result.current.isParamInputValid('0x0', ParamType.ADDRESS)).toBe(
      false
    );
    expect(result.current.isParamInputValid('0x0', ParamType.ADDRESS)).toBe(
      false
    );
  });
});
