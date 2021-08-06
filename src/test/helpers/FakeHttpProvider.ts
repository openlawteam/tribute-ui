type ResponseStub = {
  jsonrpc: '2.0';
  id: number;
  result: any;
  debugName?: string;
};

type ErrorStub = {
  jsonrpc: '2.0';
  id: number;
  error: ResponseError;
  debugName?: string;
};

type ResponseError = {
  code: number;
  message: string;
};

export type InjectResultOptions = {
  /**
   * Optional method name to be output for when debugging is used.
   */
  debugName?: string;
};

export type InjectErrorOptions = {
  /**
   * Optional method name to be output for when debugging is used.
   */
  debugName?: string;
};

/**
 * FakeHttpProvider
 *
 * Copied, and altered, from: https://github.com/ethereum/web3.js
 *
 * @see https://github.com/ethereum/web3.js/blob/edf481d37ed0c4c4caae7a25619704010ac3639e/test/helpers/FakeHttpProvider.js
 */

export class FakeHttpProvider {
  countId: number;
  error: Array<ErrorStub>;
  isDebugActive: boolean;
  response: Array<ResponseStub>;

  constructor() {
    this.countId = 1;
    this.error = [];
    this.isDebugActive = false;
    this.response = [];
  }

  createResponseStub(
    result: any = null,
    options?: InjectResultOptions
  ): ResponseStub {
    return {
      jsonrpc: '2.0',
      id: this.countId,
      result,
      debugName: options?.debugName,
    };
  }

  createErrorStub(
    error: ResponseError = {
      code: 1234,
      message: 'Stub error',
    },
    options?: InjectErrorOptions
  ): ErrorStub {
    return {
      jsonrpc: '2.0',
      id: this.countId,
      error,
      debugName: options?.debugName,
    };
  }

  /**
   * Use this instead of `send`.
   *
   * @link https://eips.ethereum.org/EIPS/eip-1193#request-1
   * @link https://docs.metamask.io/guide/ethereum-provider.html#ethereum-request-args
   */
  async request(payload: {
    method: string;
    params?: any[] | Record<string, any>;
  }): Promise<any> {
    try {
      const {result, debugName: debugNameResponse} = (this.getResponseOrError(
        'response',
        payload
      ) || {}) as ResponseStub;

      const {error, debugName: debugNameError} =
        (this.getResponseOrError('error', payload) as ErrorStub) || {};

      if (this.isDebugActive) {
        console.log(
          '-------DEBUG: `FakeHttpProvider`-------' +
            '\nTYPE: ' +
            (error ? 'error' : 'response') +
            '\nMETHOD: ' +
            payload.method +
            '\nDEBUG METHOD NAME: ' +
            (error ? debugNameError : debugNameResponse) +
            '\nENCODED RESULT OR ERROR: ' +
            (error ? JSON.stringify(error) : result)
        );
      }

      if (error) {
        throw error;
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  getResponseOrError(type: 'response' | 'error', payload: Record<string, any>) {
    let result:
      | ResponseStub
      | ErrorStub
      | ResponseStub[]
      | ErrorStub[]
      | undefined;

    if (type === 'error') {
      result = this.error.shift();
    } else {
      result = this.response.shift() || this.createResponseStub();
    }

    if (result) {
      if (Array.isArray(result)) {
        result = result.map((r, index) => {
          r.id = payload[index] ? payload[index].id : this.countId++;
          return r;
        });
      } else {
        result.id = payload.id;
      }
    }

    return result;
  }

  injectResult(result: any, options?: InjectResultOptions) {
    this.response.push(this.createResponseStub(result, options));
  }

  injectError(error: ResponseError, options?: InjectErrorOptions) {
    this.error.push(this.createErrorStub(error, options));
  }

  debug(shouldStart: boolean = true) {
    this.isDebugActive = shouldStart;
  }
}
