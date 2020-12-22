import {EnvironmentName} from './types';

const {REACT_APP_ENVIRONMENT} = process.env;

export const ENVIRONMENT = REACT_APP_ENVIRONMENT as EnvironmentName | undefined;
