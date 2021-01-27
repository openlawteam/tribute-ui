const abiDecoder = require('abi-decoder');

type ResponseStub = {
  jsonrpc: '2.0';
  id: number;
  result: any;

  /**
   * @note Added this to help us respond to specific mocked calls
   */
  __abiMethodName?: string;
  /**
   * @note Added this to help us respond to specific mocked calls
   */
  __rpcMethodName?: string;
  /**
   * @note Added this to help us respond to specific mocked calls
   */
  __abi?: Record<string, any>;
};

type ErrorStub = {
  jsonrpc: '2.0';
  id: number;
  error: ResponseError;
};

type Validation = (
  payload: Record<string, any>,
  callback: (e: ErrorStub, r: Record<string, any>) => void
) => void;

type ResponseError = {
  code: 1234;
  message: 'Stub error';
};

export type InjectResultOptions = {
  abiMethodName?: string;
  rpcMethodName?: string;
  abi?: Record<string, any>;
};

/**
 * FakeHttpProvider
 *
 * Copied from: https://github.com/ethereum/web3.js
 * Implementation was altered to fit our needs of adding
 * specific responses for a method call, instead of a simple indexed/first-in-first-out
 * response list (this simpler way was not altered - still works).
 *
 * @see https://github.com/ethereum/web3.js/blob/edf481d37ed0c4c4caae7a25619704010ac3639e/test/helpers/FakeHttpProvider.js
 */

export class FakeHttpProvider {
  countId: number;
  getResponseStub: () => ResponseStub;
  getErrorStub: () => ErrorStub;
  response: Array<ResponseStub>;
  error: Array<ErrorStub>;
  validation: Array<Validation>;

  constructor() {
    this.countId = 1;
    this.getResponseStub = function () {
      return {
        jsonrpc: '2.0',
        id: this.countId,
        result: null,
      };
    };
    this.getErrorStub = function () {
      return {
        jsonrpc: '2.0',
        id: this.countId,
        error: {
          code: 1234,
          message: 'Stub error',
        },
      };
    };

    this.response = [];
    this.error = [];
    this.validation = [];
  }

  send(
    payload: Record<string, any>,
    callback: (e: ErrorStub, r: Record<string, any>) => void
  ) {
    // set id
    if (payload.id) this.countId = payload.id;

    const validation = this.validation.shift();

    if (validation) {
      // imitate plain json object
      validation(JSON.parse(JSON.stringify(payload)), callback);
    }

    const response = this.getResponseOrError(
      'response',
      payload
    ) as ResponseStub;
    const error = this.getResponseOrError('error', payload) as ErrorStub;

    setTimeout(function () {
      callback(error, response);
    }, 1);
  }

  getResponseOrError(type: 'response' | 'error', payload: Record<string, any>) {
    let response;

    /**
     * @note Added this to help us respond to specific mocked calls
     */
    const namedResponseIndex = this.response.findIndex((r) => {
      if (!r.__abiMethodName && !r.__rpcMethodName) return false;

      const decodedName =
        r.__abi && r.__abiMethodName && payload.params[0]?.data
          ? this.decodeMethodName(payload.params[0].data, r.__abi)
          : '';

      return (
        decodedName === r.__abiMethodName ||
        payload.method === r.__rpcMethodName
      );
    });

    if (type === 'error') {
      response = this.error.shift();
    } else if (namedResponseIndex >= 0) {
      /**
       * @note Added this to help us respond to specific mocked calls
       */
      response = this.response[namedResponseIndex];
      this.response = this.response.filter((_, i) => i !== namedResponseIndex);
    } else {
      response = this.response.shift() || this.getResponseStub();
    }

    if (response) {
      if (Array.isArray(response)) {
        response = response.map((resp, index) => {
          resp.id = payload[index] ? payload[index].id : this.countId++;
          return resp;
        });
      } else response.id = payload.id;
    }

    return response;
  }

  injectResult(result: any, options?: InjectResultOptions) {
    const response = this.getResponseStub();
    response.result = result;

    /**
     * @note Added this to help us respond to specific mocked calls
     */
    if (options && options.abiMethodName) {
      response.__abiMethodName = options.abiMethodName;
    }

    /**
     * @note Added this to help us respond to specific mocked calls
     */
    if (options && options.rpcMethodName) {
      response.__rpcMethodName = options.rpcMethodName;
    }

    /**
     * @note Added this to help us respond to specific mocked calls
     */
    if (options && options.abi) {
      response.__abi = options.abi;
    }

    this.response.push(response);
  }

  injectError(error: ResponseError) {
    const errorStub = this.getErrorStub();
    errorStub.error = error; // message, code

    this.error.push(errorStub);
  }

  injectValidation(callback: () => void) {
    this.validation.push(callback);
  }

  /**
   * @note Added this to help us respond to specific mocked calls
   */
  private decodeMethodName(
    encodedMethodSignature: string,
    abi: Record<string, any>
  ) {
    abiDecoder.addABI(abi);

    const {name = ''} = abiDecoder.decodeMethod(encodedMethodSignature) || {};

    abiDecoder.removeABI(abi);

    return name;
  }
}
