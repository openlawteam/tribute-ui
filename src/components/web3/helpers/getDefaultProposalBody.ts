import {ContractAdapterNames} from '../types';

export function getDefaultProposalBody(
  account: string,
  type: ContractAdapterNames
) {
  try {
    switch (type) {
      case ContractAdapterNames.configuration:
        return '';
      case ContractAdapterNames.financing:
        return '';
      case ContractAdapterNames.guildkick:
        return '';
      case ContractAdapterNames.managing:
        return '';
      case ContractAdapterNames.onboarding:
        return `Membership for ${account}.`;
      case ContractAdapterNames.ragequit:
        return '';
      default:
        throw new Error(
          `Adapter contract name ${type} is not implemented for default proposal body.`
        );
    }
  } catch (error) {
    throw error;
  }
}
